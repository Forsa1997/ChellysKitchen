import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';

const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5200 + Math.floor(Math.random() * 200);
const FIXTURE_PORT = PORT + 500;
const BASE = `http://127.0.0.1:${PORT}`;
const FIXTURE_BASE = `http://127.0.0.1:${FIXTURE_PORT}`;
const ADMIN_EMAIL = 'admin@test.local';
const ADMIN_PASSWORD = 'admintest';

let child: ReturnType<typeof spawn>;
let dataDir: string;
let fixtureServer: any;
let memberToken: string;

const FIXTURE_RECIPE_HTML = `<!doctype html><html><head>
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Recipe',
  name: 'Importierte Linsensuppe',
  description: 'Von einer fremden Seite.',
  recipeYield: '4 Portionen',
  prepTime: 'PT15M',
  cookTime: 'PT40M',
  recipeIngredient: ['250 g Linsen', '1 Zwiebel', 'Salz'],
  recipeInstructions: [{ '@type': 'HowToStep', text: 'Alles kochen.' }],
})}</script>
</head><body>Rezept</body></html>`;

// A recipe page without any schema.org/JSON-LD block — the import falls back
// to plain HTML parsing (headings + lists).
const FIXTURE_PLAIN_HTML = `<!doctype html><html><head>
<title>Omas Eintopf | blog</title>
</head><body>
<h1>Omas Eintopf</h1>
<p>Für 6 Portionen.</p>
<h2>Zutaten</h2>
<ul><li>300 g Möhren</li><li>Salz</li></ul>
<h2>Zubereitung</h2>
<ol><li>Möhren schneiden.</li><li>Alles köcheln lassen.</li></ol>
</body></html>`;

async function api(path: string, { token, method = 'GET', body }: { token?: string; method?: string; body?: unknown } = {}): Promise<{ status: number; body: any; res?: Response }> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json };
}

async function waitForReady(timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('Server did not become ready in time');
}

before(async () => {
  dataDir = mkdtempSync(join(tmpdir(), 'ck-features-'));
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
      // Photo import must report "not configured" regardless of the host env.
      GEMINI_API_KEY: '',
    },
    stdio: 'ignore',
  });

  fixtureServer = createServer((req, res) => {
    if (req.url === '/rezept') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(FIXTURE_RECIPE_HTML);
    } else if (req.url === '/rezept-ohne-jsonld') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(FIXTURE_PLAIN_HTML);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body>Kein Rezept hier.</body></html>');
    }
  });
  await new Promise((resolve) => fixtureServer.listen(FIXTURE_PORT, resolve));

  await waitForReady();

  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  await api('/api/admin/users', {
    method: 'POST',
    token: adminLogin.body.accessToken,
    body: { name: 'Planer', email: 'planer@test.local', password: 'secret123' },
  });
  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'planer@test.local', password: 'secret123' },
  });
  memberToken = login.body.accessToken;
});

after(async () => {
  if (child && child.exitCode === null) {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
  }
  if (fixtureServer) fixtureServer.close();
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
});

test('week plan requires a signed-in member', async () => {
  const anonymous = await api('/api/weekplan');
  assert.equal(anonymous.status, 401);
});

test('members can plan recipes, adjust servings and remove them again', async () => {
  const list = await api('/api/recipes?pageSize=2');
  const [first, second] = list.body.data;

  // Plan two meals.
  const addMonday = await api('/api/weekplan/monday', {
    method: 'POST',
    token: memberToken,
    body: { recipeId: first.slug, servings: 2 },
  });
  assert.equal(addMonday.status, 200);

  const addTuesday = await api('/api/weekplan/tuesday', {
    method: 'POST',
    token: memberToken,
    body: { recipeId: second.id },
  });
  assert.equal(addTuesday.status, 200);

  const plan = await api('/api/weekplan', { token: memberToken });
  assert.equal(plan.status, 200);
  assert.equal(plan.body.days.monday.length, 1);
  assert.equal(plan.body.days.monday[0].recipe.title, first.title);
  assert.equal(plan.body.days.monday[0].servings, 2);
  // Without explicit servings the recipe default applies.
  assert.equal(plan.body.days.tuesday[0].servings, second.servings);

  // Re-adding the same recipe updates the servings instead of duplicating.
  await api('/api/weekplan/monday', {
    method: 'POST',
    token: memberToken,
    body: { recipeId: first.slug, servings: 6 },
  });
  const updated = await api('/api/weekplan', { token: memberToken });
  assert.equal(updated.body.days.monday.length, 1);
  assert.equal(updated.body.days.monday[0].servings, 6);

  // Remove one entry.
  const removed = await api(`/api/weekplan/monday/${first.id}`, {
    method: 'DELETE',
    token: memberToken,
  });
  assert.equal(removed.status, 200);
  const afterRemove = await api('/api/weekplan', { token: memberToken });
  assert.equal(afterRemove.body.days.monday.length, 0);
  assert.equal(afterRemove.body.days.tuesday.length, 1);
});

test('week plan rejects unknown days and recipes', async () => {
  const badDay = await api('/api/weekplan/caturday', {
    method: 'POST',
    token: memberToken,
    body: { recipeId: 'r1' },
  });
  assert.equal(badDay.status, 400);

  const badRecipe = await api('/api/weekplan/monday', {
    method: 'POST',
    token: memberToken,
    body: { recipeId: 'gibt-es-nicht' },
  });
  assert.equal(badRecipe.status, 404);
});

test('the week plan Bring page aggregates all planned ingredients publicly', async () => {
  const list = await api('/api/recipes?pageSize=1');
  const recipe = list.body.data[0];

  await api('/api/weekplan', { method: 'DELETE', token: memberToken });
  // Same recipe on two days -> its ingredients must be summed (2x scaling).
  await api('/api/weekplan/wednesday', {
    method: 'POST',
    token: memberToken,
    body: { recipeId: recipe.id, servings: recipe.servings },
  });
  await api('/api/weekplan/thursday', {
    method: 'POST',
    token: memberToken,
    body: { recipeId: recipe.id, servings: recipe.servings },
  });

  const res = await fetch(`${BASE}/api/weekplan/bring`);
  assert.equal(res.status, 200);
  const html = await res.text();
  const jsonLd = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1]);
  assert.equal(jsonLd['@type'], 'Recipe');

  const firstIngredient = recipe.ingredients[0];
  const doubled = `${Number((firstIngredient.amount * 2).toFixed(2))} ${firstIngredient.unit} ${firstIngredient.name}`.replace(/\s+/g, ' ').trim();
  assert.ok(
    jsonLd.recipeIngredient.includes(doubled),
    `expected "${doubled}" in ${JSON.stringify(jsonLd.recipeIngredient)}`,
  );
});

test('clearing the week plan empties every day', async () => {
  const cleared = await api('/api/weekplan', { method: 'DELETE', token: memberToken });
  assert.equal(cleared.status, 200);
  const plan = await api('/api/weekplan', { token: memberToken });
  assert.ok(Object.values(plan.body.days).every((entries: any) => entries.length === 0));
});

test('members can duplicate a recipe as their own variant', async () => {
  const list = await api('/api/recipes?pageSize=1');
  const original = list.body.data[0];

  const duplicated = await api(`/api/recipes/${original.slug}/duplicate`, {
    method: 'POST',
    token: memberToken,
  });
  assert.equal(duplicated.status, 201);
  assert.equal(duplicated.body.title, `${original.title} (Variante)`);
  assert.notEqual(duplicated.body.id, original.id);
  assert.notEqual(duplicated.body.slug, original.slug);
  assert.equal(duplicated.body.createdBy.name, 'Planer', 'the duplicating member owns the copy');
  assert.deepEqual(duplicated.body.ingredients, original.ingredients);
  // Ratings and shared notes belong to the original, not the variant.
  assert.equal(duplicated.body.totalRatings, 0);
  assert.equal(duplicated.body.notes, '');

  const detail = await api(`/api/recipes/${duplicated.body.slug}`);
  assert.equal(detail.status, 200);

  const anonymous = await api(`/api/recipes/${original.slug}/duplicate`, { method: 'POST' });
  assert.equal(anonymous.status, 401);

  const missing = await api('/api/recipes/gibt-es-nicht/duplicate', {
    method: 'POST',
    token: memberToken,
  });
  assert.equal(missing.status, 404);
});

test('recipe import maps a schema.org page onto the recipe form shape', async () => {
  const imported = await api('/api/recipes/import', {
    method: 'POST',
    token: memberToken,
    body: { url: `${FIXTURE_BASE}/rezept` },
  });
  assert.equal(imported.status, 200);
  assert.equal(imported.body.recipe.title, 'Importierte Linsensuppe');
  assert.equal(imported.body.recipe.servings, 4);
  assert.equal(imported.body.recipe.preparationTime, 15);
  assert.deepEqual(imported.body.recipe.ingredients[0], { amount: 250, unit: 'g', name: 'Linsen' });
  assert.equal(imported.body.recipe.steps[0].instruction, 'Alles kochen.');
});

test('recipe import falls back to plain HTML parsing without JSON-LD', async () => {
  const imported = await api('/api/recipes/import', {
    method: 'POST',
    token: memberToken,
    body: { url: `${FIXTURE_BASE}/rezept-ohne-jsonld` },
  });
  assert.equal(imported.status, 200);
  assert.equal(imported.body.recipe.title, 'Omas Eintopf');
  assert.equal(imported.body.recipe.servings, 6);
  assert.deepEqual(imported.body.recipe.ingredients[0], { amount: 300, unit: 'g', name: 'Möhren' });
  assert.equal(imported.body.recipe.steps[1].instruction, 'Alles köcheln lassen.');
});

test('photo import answers 503 when no Gemini key is configured', async () => {
  // This server was booted without GEMINI_API_KEY, so the
  // endpoint must explain that the feature is not configured.
  const response = await api('/api/recipes/import/photo', {
    method: 'POST',
    token: memberToken,
    body: { filename: 'foto.png', data: 'data:image/png;base64,QUJD' },
  });
  assert.equal(response.status, 503);
  assert.match(response.body.error, /Foto-Import/);
});

test('recipe import validates input and requires membership', async () => {
  const anonymous = await api('/api/recipes/import', {
    method: 'POST',
    body: { url: `${FIXTURE_BASE}/rezept` },
  });
  assert.equal(anonymous.status, 401);

  const invalid = await api('/api/recipes/import', {
    method: 'POST',
    token: memberToken,
    body: { url: 'kein url' },
  });
  assert.equal(invalid.status, 400);

  const noRecipe = await api('/api/recipes/import', {
    method: 'POST',
    token: memberToken,
    body: { url: `${FIXTURE_BASE}/ohne-rezept` },
  });
  assert.equal(noRecipe.status, 422);
});
