import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';

const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5600 + Math.floor(Math.random() * 100);
const BASE = `http://127.0.0.1:${PORT}`;
const ADMIN_EMAIL = 'admin@test.local';
const ADMIN_PASSWORD = 'admintest';

let child;
let dataDir;

function startServer(adminName) {
  return spawn('node', ['server.mjs'], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(PORT),
      DATA_DIR: dataDir,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      ADMIN_NAME: adminName,
    },
    stdio: 'ignore',
  });
}

async function api(path, { token, method = 'GET', body } = {}) {
  const headers = {};
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

function stopServer(proc) {
  return new Promise((resolve) => {
    proc.once('exit', resolve);
    proc.kill('SIGTERM');
  });
}

before(async () => {
  dataDir = mkdtempSync(join(tmpdir(), 'ck-adminname-'));
  child = startServer('Alter Name');
  await waitForReady();
});

after(() => {
  if (child) child.kill('SIGTERM');
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
});

test('a changed ADMIN_NAME renames the existing admin without touching other data', async () => {
  const firstLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  assert.equal(firstLogin.body.user.name, 'Alter Name');

  // A panel-created member must survive the restart (proves the store was
  // loaded, not re-seeded from scratch).
  const created = await api('/api/admin/users', {
    method: 'POST',
    token: firstLogin.body.accessToken,
    body: { name: 'Bleibt', email: 'bleibt@test.local', password: 'secret123' },
  });
  assert.equal(created.status, 201);

  // The persister debounces writes (200 ms) and Windows kills the process
  // without running the SIGTERM flush — wait until the store is on disk.
  await new Promise((r) => setTimeout(r, 600));

  // Restart with a different ADMIN_NAME against the same DATA_DIR.
  await stopServer(child);
  child = startServer('Christoph');
  await waitForReady();

  const secondLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  assert.equal(secondLogin.status, 200);
  assert.equal(secondLogin.body.user.name, 'Christoph');
  assert.equal(secondLogin.body.user.id, firstLogin.body.user.id, 'same account, only renamed');

  const memberLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'bleibt@test.local', password: 'secret123' },
  });
  assert.equal(memberLogin.status, 200);
});
