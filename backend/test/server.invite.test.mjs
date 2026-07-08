import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';

const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4600 + Math.floor(Math.random() * 300);
const BASE = `http://127.0.0.1:${PORT}`;
const INVITE_CODE = 'familie-2026';

let child;
let dataDir;

async function register(body) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
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
  dataDir = mkdtempSync(join(tmpdir(), 'ck-invite-'));
  child = spawn('node', ['server.mjs'], {
    cwd: backendDir,
    env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir, INVITE_CODE },
    stdio: 'ignore',
  });
  await waitForReady();
});

after(() => {
  if (child) child.kill('SIGTERM');
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
});

test('registration without or with a wrong invite code is rejected', async () => {
  const missing = await register({ name: 'Fremd', email: 'fremd@test.local', password: 'secret123' });
  assert.equal(missing.status, 403);

  const wrong = await register({
    name: 'Fremd',
    email: 'fremd@test.local',
    password: 'secret123',
    inviteCode: 'falscher-code',
  });
  assert.equal(wrong.status, 403);
});

test('registration with the correct invite code succeeds', async () => {
  const ok = await register({
    name: 'Familie',
    email: 'familie@test.local',
    password: 'secret123',
    inviteCode: INVITE_CODE,
  });
  assert.equal(ok.status, 201);
  assert.ok(ok.body.accessToken);
});
