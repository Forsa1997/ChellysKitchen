// End-to-end test for the URL recipe import with German translation. The
// real server fetches fixture pages from a local server and calls a mocked
// Gemini Interactions API for non-German recipes.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 6100 + Math.floor(Math.random() * 100);
const FIXTURE_PORT = PORT + 100;
const MOCK_PORT = PORT + 200;
const BASE = `http://127.0.0.1:${PORT}`;
const FIXTURE_BASE = `http://127.0.0.1:${FIXTURE_PORT}`;
const ADMIN_EMAIL = 'urlimport-admin@test.local';
const ADMIN_PASSWORD = 'urlimport-admin-secret';

const ENGLISH_RECIPE_HTML = `<!doctype html><html><head>
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Recipe',
  name: 'Creamy Tomato Soup',
  description: 'A quick weeknight soup.',
  recipeYield: '4 servings',
  prepTime: 'PT10M',
  cookTime: 'PT25M',
  recipeIngredient: ['800 g canned tomatoes', '1 onion'],
  recipeInstructions: [
    { '@type': 'HowToStep', text: 'Saute the onion until soft.' },
    { '@type': 'HowToStep', text: 'Add the tomatoes and simmer.' },
  ],
})}</script>
</head><body>Recipe</body></html>`;

const GERMAN_RECIPE_HTML = `<!doctype html><html><head>
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Recipe',
  name: 'Importierte Linsensuppe',
  description: 'Ein deftiger Klassiker für die ganze Familie.',
  recipeYield: '4 Portionen',
  recipeIngredient: ['250 g Linsen', '1 Zwiebel'],
  recipeInstructions: [{ '@type': 'HowToStep', text: 'Alles zusammen weich kochen.' }],
})}</script>
</head><body>Rezept</body></html>`;

const GEMINI_TRANSLATION = {
  title: 'Cremige Tomatensuppe',
  shortDescription: 'Eine schnelle Suppe für den Feierabend.',
  ingredients: [
    { amount: 800, unit: 'g', name: 'Dosentomaten' },
    { amount: 1, unit: '', name: 'Zwiebel' },
  ],
  steps: ['Die Zwiebel glasig anbraten.', 'Die Tomaten dazugeben und köcheln lassen.'],
};

let child: ReturnType<typeof spawn>;
let dataDir: string;
let fixtureServer: any;
let mockServer: any;
let memberToken: string;
let geminiMode = 'ok';
let geminiCalls = 0;
let lastGeminiRequest: any = null;

async function api(path: string, { method = 'GET', token, body }: { token?: string; method?: string; body?: unknown } = {}): Promise<{ status: number; body: any }> {
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
  fixtureServer = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(req.url === '/deutsches-rezept' ? GERMAN_RECIPE_HTML : ENGLISH_RECIPE_HTML);
  });
  await new Promise((resolve) => fixtureServer.listen(FIXTURE_PORT, '127.0.0.1', resolve));

  mockServer = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      geminiCalls += 1;
      lastGeminiRequest = JSON.parse(raw);
      if (geminiMode === 'fail') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'kaputt' } }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: 'interaction_mock',
        status: 'completed',
        steps: [{
          type: 'model_output',
          content: [{ type: 'text', text: JSON.stringify(GEMINI_TRANSLATION) }],
        }],
      }));
    });
  });
  await new Promise((resolve) => mockServer.listen(MOCK_PORT, '127.0.0.1', resolve));

  dataDir = mkdtempSync(join(tmpdir(), 'ck-urlimport-'));
  child = spawn('node', ['server.mts'], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(PORT),
      DATA_DIR: dataDir,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      // The fixture pages live on localhost, which the SSRF guard would block.
      IMPORT_ALLOW_PRIVATE: '1',
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
  await new Promise((resolve) => fixtureServer?.close(resolve));
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
});

test('URL import translates a foreign-language recipe to German via Gemini', async () => {
  geminiMode = 'ok';
  geminiCalls = 0;
  const imported = await api('/api/recipes/import', {
    method: 'POST',
    token: memberToken,
    body: { url: `${FIXTURE_BASE}/english-recipe` },
  });

  assert.equal(imported.status, 200);
  assert.equal(imported.body.translated, true);
  assert.equal(imported.body.recipe.title, 'Cremige Tomatensuppe');
  assert.equal(imported.body.recipe.shortDescription, 'Eine schnelle Suppe für den Feierabend.');
  assert.deepEqual(imported.body.recipe.ingredients, [
    { amount: 800, unit: 'g', name: 'Dosentomaten' },
    { amount: 1, unit: '', name: 'Zwiebel' },
  ]);
  assert.deepEqual(imported.body.recipe.steps, [
    { stepNumber: 1, instruction: 'Die Zwiebel glasig anbraten.' },
    { stepNumber: 2, instruction: 'Die Tomaten dazugeben und köcheln lassen.' },
  ]);
  // Times and servings come from the page, not from the translation.
  assert.equal(imported.body.recipe.servings, 4);
  assert.equal(imported.body.recipe.preparationTime, 10);
  assert.equal(imported.body.recipe.cookingTime, 25);

  assert.equal(geminiCalls, 1);
  assert.equal(lastGeminiRequest.store, false);
  const prompt = lastGeminiRequest.input.find((entry: any) => entry.type === 'text').text;
  assert.match(prompt, /Creamy Tomato Soup/);
});

test('URL import leaves German recipes untouched and does not call Gemini', async () => {
  geminiMode = 'ok';
  geminiCalls = 0;
  const imported = await api('/api/recipes/import', {
    method: 'POST',
    token: memberToken,
    body: { url: `${FIXTURE_BASE}/deutsches-rezept` },
  });

  assert.equal(imported.status, 200);
  assert.equal(imported.body.translated, false);
  assert.equal(imported.body.recipe.title, 'Importierte Linsensuppe');
  assert.equal(geminiCalls, 0);
});

test('URL import still succeeds with the original recipe when Gemini fails', async () => {
  geminiMode = 'fail';
  geminiCalls = 0;
  const imported = await api('/api/recipes/import', {
    method: 'POST',
    token: memberToken,
    body: { url: `${FIXTURE_BASE}/english-recipe` },
  });
  geminiMode = 'ok';

  assert.equal(imported.status, 200);
  assert.equal(imported.body.translated, false);
  assert.equal(imported.body.recipe.title, 'Creamy Tomato Soup');
  assert.equal(geminiCalls, 1);
});
