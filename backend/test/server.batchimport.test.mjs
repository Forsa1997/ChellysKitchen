// End-to-end test for the admin batch photo import: several photos go in,
// unpublished draft recipes tagged "KI-Import" come out. The real server
// talks to a mocked Gemini Interactions API, so no network or key is needed.
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
const MOCK_PORT = PORT + 100;
const BASE = `http://127.0.0.1:${PORT}`;
const ADMIN_EMAIL = 'batch-admin@test.local';
const ADMIN_PASSWORD = 'batch-admin-secret';

const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const GEMINI_RECIPE = {
  containsRecipe: true,
  title: 'Batch-Pfannkuchen',
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
let adminToken;
let memberToken;
// Each Gemini call consumes the next mode; 'ok' | 'noRecipe' | 'fail'.
let geminiModes = [];

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

async function waitForJobCompletion(jobId, token) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const { status, body } = await api(`/api/admin/recipes/import/photos/${jobId}`, { token });
    assert.equal(status, 200);
    if (body.job.status === 'COMPLETED') return body.job;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Batch job did not complete in time');
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

      const mode = geminiModes.shift() ?? 'ok';
      if (mode === 'fail') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'kaputt' } }));
        return;
      }

      const payload = mode === 'noRecipe' ? { containsRecipe: false } : GEMINI_RECIPE;
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

  dataDir = mkdtempSync(join(tmpdir(), 'ck-batchimport-'));
  child = spawn('node', ['server.mjs'], {
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

  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  adminToken = adminLogin.body.accessToken;
  assert.ok(adminToken, 'admin login must work');

  // The non-production server seeds the demo member account.
  const memberLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'demo@chellys-kitchen.local', password: 'demo1234' },
  });
  memberToken = memberLogin.body.accessToken;
  assert.ok(memberToken, 'member login must work');
});

after(async () => {
  if (child && child.exitCode === null) {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
  }
  await new Promise((resolve) => mockServer?.close(resolve));
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
});

test('batch import is admin only', async () => {
  const photos = [{ filename: 'a.png', data: `data:image/png;base64,${TINY_PNG_BASE64}` }];

  const anonymous = await api('/api/admin/recipes/import/photos', { method: 'POST', body: { photos } });
  assert.equal(anonymous.status, 403);

  const member = await api('/api/admin/recipes/import/photos', {
    method: 'POST',
    token: memberToken,
    body: { photos },
  });
  assert.equal(member.status, 403);

  const memberList = await api('/api/admin/recipes/import/photos', { token: memberToken });
  assert.equal(memberList.status, 403);
});

test('batch import validates the photo payload', async () => {
  const empty = await api('/api/admin/recipes/import/photos', {
    method: 'POST',
    token: adminToken,
    body: { photos: [] },
  });
  assert.equal(empty.status, 400);

  const tooMany = await api('/api/admin/recipes/import/photos', {
    method: 'POST',
    token: adminToken,
    body: {
      photos: Array.from({ length: 11 }, (_, i) => ({
        filename: `f${i}.png`,
        data: `data:image/png;base64,${TINY_PNG_BASE64}`,
      })),
    },
  });
  assert.equal(tooMany.status, 400);
  assert.match(tooMany.body.error, /Maximal/);

  const invalid = await api('/api/admin/recipes/import/photos', {
    method: 'POST',
    token: adminToken,
    body: {
      photos: [
        { filename: 'ok.png', data: `data:image/png;base64,${TINY_PNG_BASE64}` },
        { filename: 'nope.txt', data: 'kein-bild' },
      ],
    },
  });
  assert.equal(invalid.status, 400);
  assert.match(invalid.body.error, /Foto 2/);
});

test('a batch creates unpublished drafts tagged KI-Import and reports progress', async () => {
  geminiModes = ['ok', 'noRecipe', 'fail'];

  const started = await api('/api/admin/recipes/import/photos', {
    method: 'POST',
    token: adminToken,
    body: {
      photos: [
        { filename: 'kochbuch-seite-1.png', data: `data:image/png;base64,${TINY_PNG_BASE64}` },
        { filename: 'katze.png', data: `data:image/png;base64,${TINY_PNG_BASE64}` },
        { filename: 'kaputt.png', data: `data:image/png;base64,${TINY_PNG_BASE64}` },
      ],
    },
  });

  assert.equal(started.status, 202);
  assert.equal(started.body.job.total, 3);
  assert.equal(started.body.job.status, 'RUNNING');

  const job = await waitForJobCompletion(started.body.job.id, adminToken);
  assert.equal(job.processed, 3);
  assert.equal(job.created, 1);
  assert.equal(job.noRecipe, 1);
  assert.equal(job.failed, 1);

  const [createdItem, noRecipeItem, failedItem] = job.items;
  assert.equal(createdItem.status, 'CREATED');
  assert.equal(createdItem.fileName, 'kochbuch-seite-1.png');
  assert.equal(createdItem.recipe.title, 'Batch-Pfannkuchen');
  assert.ok(createdItem.recipe.slug);
  assert.equal(noRecipeItem.status, 'NO_RECIPE');
  assert.equal(failedItem.status, 'FAILED');

  // The job shows up in the admin job list.
  const list = await api('/api/admin/recipes/import/photos', { token: adminToken });
  assert.equal(list.status, 200);
  assert.ok(list.body.data.some((entry) => entry.id === job.id));

  // The draft exists for admins: unpublished, tagged, owned by the admin,
  // with the source photo stored as its image.
  const adminRecipes = await api('/api/admin/recipes', { token: adminToken });
  const draft = adminRecipes.body.data.find((recipe) => recipe.id === createdItem.recipe.id);
  assert.ok(draft, 'draft must be listed for admins');
  assert.equal(draft.status, 'DRAFT');
  assert.equal(draft.tag, 'KI-Import');
  assert.equal(draft.title, 'Batch-Pfannkuchen');
  assert.deepEqual(draft.ingredients[0], { amount: 250, unit: 'g', name: 'Mehl' });
  assert.match(draft.img, new RegExp(`^http://127\\.0\\.0\\.1:${PORT}/uploads/`));

  const image = await fetch(draft.img);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/png');

  // Unpublished drafts stay invisible on the public list until reviewed.
  const publicList = await api('/api/recipes?pageSize=100');
  assert.equal(publicList.status, 200);
  assert.ok(!publicList.body.data.some((recipe) => recipe.id === createdItem.recipe.id));

  // ...and publishing it afterwards works with the normal review endpoint.
  const published = await api(`/api/recipes/${draft.id}/publish`, { method: 'PATCH', token: adminToken });
  assert.equal(published.status, 200);
  assert.equal(published.body.status, 'PUBLISHED');
});

test('unknown job ids return 404', async () => {
  const missing = await api('/api/admin/recipes/import/photos/batch_missing', { token: adminToken });
  assert.equal(missing.status, 404);
});
