// End-to-end test for the photo recipe import: boots the real server with a
// mocked OpenAI API (primary, via OPENAI_BASE_URL) and a mocked Anthropic
// API (fallback, via ANTHROPIC_BASE_URL) so no network or real keys are
// needed. One mock HTTP server plays both roles, told apart by the path.
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

const OPENAI_RECIPE = {
  containsRecipe: true,
  title: 'OpenAI-Pfannkuchen',
  shortDescription: 'Vom Kochbuchfoto.',
  servings: 4,
  preparationTime: 10,
  cookingTime: 20,
  ingredients: [{ amount: 250, unit: 'g', name: 'Mehl' }],
  steps: ['Alles verrühren.', 'Backen.'],
};

const ANTHROPIC_RECIPE = { ...OPENAI_RECIPE, title: 'Anthropic-Pfannkuchen' };

let child;
let dataDir;
let mockServer;
let memberToken;
// 'ok' answers with a recipe, 'noRecipe' with containsRecipe:false,
// 'fail' with HTTP 500 (which must trigger the Anthropic fallback).
let openAiMode = 'ok';
let openAiCalls = 0;
let anthropicCalls = 0;
let lastOpenAiRequest = null;

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

function handleOpenAi(body, res) {
  openAiCalls += 1;
  lastOpenAiRequest = body;
  if (openAiMode === 'fail') {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'kaputt' } }));
    return;
  }
  const payload = openAiMode === 'noRecipe' ? { containsRecipe: false } : OPENAI_RECIPE;
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    id: 'chatcmpl_mock',
    choices: [{
      index: 0,
      finish_reason: 'stop',
      message: { role: 'assistant', content: JSON.stringify(payload), refusal: null },
    }],
  }));
}

function handleAnthropic(body, res) {
  anthropicCalls += 1;
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    id: 'msg_mock',
    type: 'message',
    role: 'assistant',
    model: body.model,
    stop_reason: 'end_turn',
    content: [{ type: 'text', text: JSON.stringify(ANTHROPIC_RECIPE) }],
    usage: { input_tokens: 10, output_tokens: 10 },
  }));
}

before(async () => {
  mockServer = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      const body = JSON.parse(raw);
      if (req.url === '/v1/chat/completions') {
        handleOpenAi(body, res);
      } else if (req.url === '/v1/messages') {
        handleAnthropic(body, res);
      } else {
        res.writeHead(404);
        res.end();
      }
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
      OPENAI_API_KEY: 'sk-openai-mock',
      OPENAI_BASE_URL: `http://127.0.0.1:${MOCK_PORT}/v1`,
      ANTHROPIC_API_KEY: 'sk-anthropic-mock',
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

test('photo import asks OpenAI first and maps its answer', async () => {
  openAiMode = 'ok';
  anthropicCalls = 0;
  const imported = await api('/api/recipes/import/photo', {
    method: 'POST',
    token: memberToken,
    body: { filename: 'rezept.png', data: `data:image/png;base64,${TINY_PNG_BASE64}` },
  });

  assert.equal(imported.status, 200);
  assert.equal(imported.body.source, 'photo');
  assert.equal(imported.body.recipe.title, 'OpenAI-Pfannkuchen');
  assert.deepEqual(imported.body.recipe.ingredients[0], { amount: 250, unit: 'g', name: 'Mehl' });
  assert.deepEqual(imported.body.recipe.steps[1], { stepNumber: 2, instruction: 'Backen.' });
  assert.equal(anthropicCalls, 0, 'Anthropic must not be called when OpenAI succeeds');

  // The image must reach OpenAI as a base64 data URL.
  const sent = lastOpenAiRequest.messages[0].content.find((b) => b.type === 'image_url');
  assert.equal(sent.image_url.url, `data:image/png;base64,${TINY_PNG_BASE64}`);
});

test('photo import falls back to Anthropic when OpenAI fails', async () => {
  openAiMode = 'fail';
  anthropicCalls = 0;
  const imported = await api('/api/recipes/import/photo', {
    method: 'POST',
    token: memberToken,
    body: { filename: 'rezept.png', data: `data:image/png;base64,${TINY_PNG_BASE64}` },
  });
  openAiMode = 'ok';

  assert.equal(imported.status, 200);
  assert.equal(imported.body.recipe.title, 'Anthropic-Pfannkuchen');
  assert.equal(anthropicCalls, 1);
});

test('photo import reports when no recipe is recognized (no fallback)', async () => {
  openAiMode = 'noRecipe';
  anthropicCalls = 0;
  const imported = await api('/api/recipes/import/photo', {
    method: 'POST',
    token: memberToken,
    body: { filename: 'katze.png', data: `data:image/png;base64,${TINY_PNG_BASE64}` },
  });
  openAiMode = 'ok';

  assert.equal(imported.status, 422);
  assert.match(imported.body.error, /kein Rezept/i);
  assert.equal(anthropicCalls, 0, 'a clean "no recipe" answer is final');
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
