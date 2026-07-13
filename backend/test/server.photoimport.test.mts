// End-to-end test for the photo recipe import. The real server calls a mocked
// Gemini Interactions API, so no network access or real API key is needed.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5900 + Math.floor(Math.random() * 100);
const MOCK_PORT = PORT + 100;
const BASE = `http://127.0.0.1:${PORT}`;
const ADMIN_EMAIL = 'photo-admin@test.local';
const ADMIN_PASSWORD = 'photo-admin-secret';

const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const GEMINI_RECIPE = {
  containsRecipe: true,
  title: 'Gemini-Pfannkuchen',
  shortDescription: 'Vom Kochbuchfoto.',
  servings: 4,
  preparationTime: 10,
  cookingTime: 20,
  ingredients: [{ amount: 250, unit: 'g', name: 'Mehl' }],
  steps: ['Alles verrühren.', 'Backen.'],
};

let child;
let dataDir;
let mockServer;
let memberToken;
let geminiMode = 'ok';
let geminiCalls = 0;
let lastGeminiRequest = null;
let lastGeminiApiKey = null;

async function api(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let parsed = null;
  try {
    parsed = await response.json();
  } catch {
    // some error paths return no body
  }
  return { status: response.status, body: parsed };
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/health`);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Server did not start');
}

before(async () => {
  mockServer = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      if (req.url !== '/v1beta/interactions') {
        res.writeHead(404);
        res.end();
        return;
      }

      geminiCalls += 1;
      lastGeminiRequest = JSON.parse(raw);
      lastGeminiApiKey = req.headers['x-goog-api-key'];
      if (geminiMode === 'fail') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'kaputt' } }));
        return;
      }

      const payload = geminiMode === 'noRecipe' ? { containsRecipe: false } : GEMINI_RECIPE;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: 'interaction_mock',
        status: 'completed',
        steps: [{
          type: 'model_output',
          content: [{ type: 'text', text: JSON.stringify(payload) }],
        }],
      }));
    });
  });
  await new Promise((resolve) => mockServer.listen(MOCK_PORT, '127.0.0.1', resolve));

  dataDir = mkdtempSync(join(tmpdir(), 'ck-photoimport-'));
  child = spawn('node', ['server.mts'], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(PORT),
      DATA_DIR: dataDir,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      GEMINI_API_KEY: 'gemini-mock-key',
      GEMINI_BASE_URL: `http://127.0.0.1:${MOCK_PORT}/v1beta`,
    },
    stdio: 'ignore',
  });
  await waitForServer();

  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  memberToken = login.body.accessToken;
  assert.ok(memberToken, 'admin login must work');
});

after(async () => {
  if (child && child.exitCode === null) {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
  }
  await new Promise((resolve) => mockServer?.close(resolve));
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
});

test('photo import asks Gemini once and maps its answer', async () => {
  geminiMode = 'ok';
  geminiCalls = 0;
  const imported = await api('/api/recipes/import/photo', {
    method: 'POST',
    token: memberToken,
    body: { filename: 'rezept.png', data: `data:image/png;base64,${TINY_PNG_BASE64}` },
  });

  assert.equal(imported.status, 200);
  assert.equal(imported.body.source, 'photo');
  assert.equal(imported.body.recipe.title, 'Gemini-Pfannkuchen');
  assert.deepEqual(imported.body.recipe.ingredients[0], { amount: 250, unit: 'g', name: 'Mehl' });
  assert.deepEqual(imported.body.recipe.steps[1], { stepNumber: 2, instruction: 'Backen.' });
  assert.equal(geminiCalls, 1);
  assert.equal(lastGeminiApiKey, 'gemini-mock-key');
  assert.equal(lastGeminiRequest.store, false);
  assert.deepEqual(
    lastGeminiRequest.input.find((entry) => entry.type === 'image'),
    { type: 'image', data: TINY_PNG_BASE64, mime_type: 'image/png' },
  );
});

test('photo import reports when Gemini recognizes no recipe', async () => {
  geminiMode = 'noRecipe';
  const imported = await api('/api/recipes/import/photo', {
    method: 'POST',
    token: memberToken,
    body: { filename: 'katze.png', data: `data:image/png;base64,${TINY_PNG_BASE64}` },
  });
  geminiMode = 'ok';

  assert.equal(imported.status, 422);
  assert.match(imported.body.error, /kein Rezept/i);
});

test('photo import reports a temporary Gemini failure', async () => {
  geminiMode = 'fail';
  const imported = await api('/api/recipes/import/photo', {
    method: 'POST',
    token: memberToken,
    body: { filename: 'rezept.png', data: `data:image/png;base64,${TINY_PNG_BASE64}` },
  });
  geminiMode = 'ok';

  assert.equal(imported.status, 502);
});

test('photo import validates auth and image payload', async () => {
  const anonymous = await api('/api/recipes/import/photo', {
    method: 'POST',
    body: { filename: 'rezept.png', data: `data:image/png;base64,${TINY_PNG_BASE64}` },
  });
  assert.equal(anonymous.status, 401);

  const invalid = await api('/api/recipes/import/photo', {
    method: 'POST',
    token: memberToken,
    body: { filename: 'rezept.txt', data: 'kein-bild' },
  });
  assert.equal(invalid.status, 400);
});
