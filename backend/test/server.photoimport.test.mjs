// End-to-end test for the photo recipe import: boots the real server with a
// mocked Anthropic Messages API (via ANTHROPIC_BASE_URL) so no network or
// real API key is needed.
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

// 1x1 transparent PNG
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const EXTRACTED = {
  containsRecipe: true,
  title: 'Foto-Pfannkuchen',
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
// The mock flips to "no recipe" mode when this is true.
let answerWithoutRecipe = false;
let lastAnthropicRequest = null;

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
      lastAnthropicRequest = { url: req.url, headers: req.headers, body: JSON.parse(raw) };
      const payload = answerWithoutRecipe ? { containsRecipe: false } : EXTRACTED;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: 'msg_mock',
        type: 'message',
        role: 'assistant',
        model: lastAnthropicRequest.body.model,
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: JSON.stringify(payload) }],
        usage: { input_tokens: 10, output_tokens: 10 },
      }));
    });
  });
  await new Promise((resolve) => mockServer.listen(MOCK_PORT, '127.0.0.1', resolve));

  dataDir = mkdtempSync(join(tmpdir(), 'ck-photoimport-'));
  child = spawn('node', ['server.mjs'], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(PORT),
      DATA_DIR: dataDir,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      ANTHROPIC_API_KEY: 'sk-test-mock',
      ANTHROPIC_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
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
  child?.kill();
  await new Promise((resolve) => mockServer?.close(resolve));
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
});

test('photo import extracts a recipe via the vision model', async () => {
  answerWithoutRecipe = false;
  const imported = await api('/api/recipes/import/photo', {
    method: 'POST',
    token: memberToken,
    body: { filename: 'rezept.png', data: `data:image/png;base64,${TINY_PNG_BASE64}` },
  });

  assert.equal(imported.status, 200);
  assert.equal(imported.body.source, 'photo');
  assert.equal(imported.body.recipe.title, 'Foto-Pfannkuchen');
  assert.equal(imported.body.recipe.servings, 4);
  assert.deepEqual(imported.body.recipe.ingredients[0], { amount: 250, unit: 'g', name: 'Mehl' });
  assert.deepEqual(imported.body.recipe.steps[1], { stepNumber: 2, instruction: 'Backen.' });

  // The image must reach the model as a base64 image block.
  const sent = lastAnthropicRequest.body.messages[0].content.find((b) => b.type === 'image');
  assert.equal(sent.source.media_type, 'image/png');
  assert.equal(sent.source.data, TINY_PNG_BASE64);
});

test('photo import reports when no recipe is recognized', async () => {
  answerWithoutRecipe = true;
  const imported = await api('/api/recipes/import/photo', {
    method: 'POST',
    token: memberToken,
    body: { filename: 'katze.png', data: `data:image/png;base64,${TINY_PNG_BASE64}` },
  });
  answerWithoutRecipe = false;

  assert.equal(imported.status, 422);
  assert.match(imported.body.error, /kein Rezept/i);
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
