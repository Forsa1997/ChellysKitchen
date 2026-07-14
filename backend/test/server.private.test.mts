import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';

// The whole app is locked to signed-in users ("komplett privat"). Only a small
// allowlist — the health probe, the auth endpoints and the Bring! export pages
// (fetched server-side by Bring's crawler without a token) — stays public.
const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5700 + Math.floor(Math.random() * 100);
const BASE = `http://127.0.0.1:${PORT}`;
const ADMIN_USERNAME = 'admin@test.local';
const ADMIN_PASSWORD = 'admintest';
const MEMBER_USERNAME = 'demo';
const MEMBER_PASSWORD = 'demo1234';

let child: ReturnType<typeof spawn>;
let dataDir: string;
let memberToken: string;

async function raw(path: string, headers: Record<string, string> = {}): Promise<Response> {
  return fetch(`${BASE}${path}`, { headers });
}

async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json() as { accessToken: string };
  assert.equal(res.status, 200, `login for ${username} failed`);
  return body.accessToken;
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
  dataDir = mkdtempSync(join(tmpdir(), 'ck-private-'));
  child = spawn('node', ['server.mts'], {
    cwd: backendDir,
    env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir, ADMIN_USERNAME, ADMIN_PASSWORD },
    stdio: 'ignore',
  });
  await waitForReady();
  memberToken = await login(MEMBER_USERNAME, MEMBER_PASSWORD);
});

after(async () => {
  if (child && child.exitCode === null) {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
  }
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
});

test('anonymous requests to browsing endpoints are rejected with 401', async () => {
  const statuses: Record<string, number> = {};
  for (const path of [
    '/api/recipes',
    '/api/recipes?pageSize=5',
    '/api/recipes/random',
    '/api/recipes/irgendein-slug',
    '/api/categories',
    '/api/weekplan',
    '/uploads/whatever.png',
    '/metrics',
  ]) {
    statuses[path] = (await raw(path)).status;
  }

  assert.deepEqual(statuses, {
    '/api/recipes': 401,
    '/api/recipes?pageSize=5': 401,
    '/api/recipes/random': 401,
    '/api/recipes/irgendein-slug': 401,
    '/api/categories': 401,
    '/api/weekplan': 401,
    '/uploads/whatever.png': 401,
    '/metrics': 401,
  });
});

test('the public allowlist stays reachable without a token', async () => {
  const health = await raw('/health');
  assert.equal(health.status, 200);

  // The per-recipe and week-plan Bring! export pages are fetched by Bring's
  // crawler without a token and must remain public.
  const weekBring = await raw('/api/weekplan/bring');
  assert.equal(weekBring.status, 200);

  const list = await fetch(`${BASE}/api/recipes?pageSize=1`, {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  const listBody = await list.json() as { data: Array<{ slug: string }> };
  const slug = listBody.data[0]?.slug;
  assert.ok(slug, 'seed data should provide at least one recipe');

  const recipeBring = await raw(`/api/recipes/${slug}/bring`);
  assert.equal(recipeBring.status, 200);
});

test('signed-in members can browse recipes and categories', async () => {
  const auth = { Authorization: `Bearer ${memberToken}` };

  const list = await raw('/api/recipes?pageSize=5', auth);
  assert.equal(list.status, 200);

  const random = await raw('/api/recipes/random', auth);
  assert.equal(random.status, 200);

  const categories = await raw('/api/categories', auth);
  assert.equal(categories.status, 200);
});
