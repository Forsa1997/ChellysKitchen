import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';

const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5700 + Math.floor(Math.random() * 100);
const BASE = `http://127.0.0.1:${PORT}`;
const ADMIN_EMAIL = 'admin@test.local';
const ADMIN_PASSWORD = 'admintest';

let child: ReturnType<typeof spawn>;
let dataDir: string;

async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return { status: res.status, retryAfter: res.headers.get('retry-after'), body: await res.json().catch(() => null) };
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
  dataDir = mkdtempSync(join(tmpdir(), 'ck-ratelimit-'));
  child = spawn('node', ['server.mts'], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(PORT),
      DATA_DIR: dataDir,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      // Tight limits so the test runs fast; production defaults are larger.
      LOGIN_MAX_FAILURES: '3',
      LOGIN_WINDOW_MS: '1500',
    },
    stdio: 'ignore',
  });
  await waitForReady();
});

after(async () => {
  if (child && child.exitCode === null) {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
  }
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
});

test('too many failed logins block the account temporarily', async () => {
  for (let i = 0; i < 3; i += 1) {
    const failed = await login(ADMIN_EMAIL, 'falsches-passwort');
    assert.equal(failed.status, 401, `attempt ${i + 1} is a normal 401`);
  }

  // Now blocked — even the CORRECT password must not get through.
  const blocked = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.retryAfter) >= 1, 'Retry-After header is set');

  // After the window has passed the correct password works again.
  await new Promise((r) => setTimeout(r, 1600));
  const ok = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert.equal(ok.status, 200);
});

test('a successful login resets the failure counter', async () => {
  await login(ADMIN_EMAIL, 'falsch-1');
  await login(ADMIN_EMAIL, 'falsch-2');
  const ok = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert.equal(ok.status, 200);

  // The two earlier failures must be forgotten now.
  const failed = await login(ADMIN_EMAIL, 'falsch-3');
  assert.equal(failed.status, 401, 'still a plain 401, not 429');
});
