import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Der Server lädt seinen Store beim Import — deshalb erst die Umgebung
// isolieren und dann dynamisch importieren.
let server: any;
let baseUrl: string;

before(async () => {
  process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'chellys-test-'));
  delete process.env.DATABASE_URL;
  delete process.env.NODE_ENV;

  ({ server } = await import('./server.mts'));
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

async function login(username: string, password: string) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return response;
}

async function loginAs(role: string): Promise<any> {
  const credentials: [string, string] = role === 'ADMIN'
    ? ['admin', 'admin1234']
    : ['demo', 'demo1234'];
  const response = await login(...credentials);
  assert.equal(response.status, 200, `Login als ${role} muss gelingen`);
  return response.json();
}

// ---------------------------------------------------------------------------
// Request-ID-Tracking
// ---------------------------------------------------------------------------

test('jede Antwort enthält einen x-request-id Header', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('x-request-id')!, /^req_[a-f0-9]{16}$/);
});

test('eine gültige eingehende Request-ID wird in der Antwort übernommen', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { 'x-request-id': 'client-trace-42' },
  });
  assert.equal(response.headers.get('x-request-id'), 'client-trace-42');
});

test('auch Fehlerantworten tragen eine Request-ID', async () => {
  const response = await fetch(`${baseUrl}/gibt-es-nicht`);
  assert.equal(response.status, 404);
  assert.ok(response.headers.get('x-request-id'));
});

// ---------------------------------------------------------------------------
// Metriken
// ---------------------------------------------------------------------------

test('GET /metrics liefert Request-Zähler und Latenz-Kennzahlen', async () => {
  await fetch(`${baseUrl}/health`);
  const response = await fetch(`${baseUrl}/metrics`);
  assert.equal(response.status, 200);

  const body: any = await response.json();
  assert.ok(body.totalRequests >= 1);
  assert.ok(body.statusCounts['2xx'] >= 1);
  assert.equal(typeof body.errorRate, 'number');
  assert.equal(typeof body.latencyMs.avg, 'number');
  assert.equal(typeof body.latencyMs.p95, 'number');
});

// ---------------------------------------------------------------------------
// Auth-Flows
// ---------------------------------------------------------------------------

test('Login mit korrekten Daten liefert Session ohne sensible Felder', async () => {
  const session = await loginAs('MEMBER');
  assert.ok(session.accessToken);
  assert.ok(session.refreshToken);
  assert.equal(session.user.role, 'MEMBER');
  assert.equal(session.user.passwordHash, undefined);
  assert.equal(session.user.salt, undefined);
});

test('Login mit falschem Passwort liefert 401', async () => {
  const response = await login('demo', 'falsches-passwort');
  assert.equal(response.status, 401);
});

test('Login mit unbekannter E-Mail liefert 401', async () => {
  const response = await login('niemand@example.com', 'egal1234');
  assert.equal(response.status, 401);
});

test('Refresh mit ungültigem Token liefert 401', async () => {
  const response = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: 'ungueltig' }),
  });
  assert.equal(response.status, 401);
});

test('Refresh Token ist nur einmal verwendbar (Rotation)', async () => {
  const { refreshToken } = await loginAs('MEMBER');

  const first = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  assert.equal(first.status, 200);

  const second = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  assert.equal(second.status, 401);
});

test('GET /api/auth/me ohne Token liefert 401', async () => {
  const response = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(response.status, 401);
});

test('GET /api/auth/me mit Token liefert den User', async () => {
  const { accessToken, user } = await loginAs('MEMBER');

  const response = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(response.status, 200);
  const body: any = await response.json();
  assert.equal(body.user.id, user.id);
});

test('nach Logout ist der Access Token ungültig', async () => {
  const { accessToken } = await loginAs('MEMBER');

  const logout = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(logout.status, 204);

  const me = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(me.status, 401);
});

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

test('Rezept anlegen ohne Anmeldung liefert 401', async () => {
  const response = await fetch(`${baseUrl}/api/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test', shortDescription: 'Test', category: 'Cooking' }),
  });
  assert.equal(response.status, 401);
});

test('MEMBER darf keine Kategorien anlegen (403)', async () => {
  const { accessToken } = await loginAs('MEMBER');

  const response = await fetch(`${baseUrl}/api/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name: 'Verboten' }),
  });
  assert.equal(response.status, 403);
});

test('MEMBER darf Kategorien weder bearbeiten noch löschen (403)', async () => {
  const { accessToken } = await loginAs('MEMBER');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };

  const patch = await fetch(`${baseUrl}/api/categories/cat_1`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ name: 'Umbenannt' }),
  });
  assert.equal(patch.status, 403);

  const del = await fetch(`${baseUrl}/api/categories/cat_1`, { method: 'DELETE', headers });
  assert.equal(del.status, 403);
});

test('ADMIN darf Kategorien anlegen', async () => {
  const { accessToken } = await loginAs('ADMIN');

  const response = await fetch(`${baseUrl}/api/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name: `Testkategorie ${Date.now()}` }),
  });
  assert.equal(response.status, 201);
});

test('Bewertung ohne Anmeldung liefert 401', async () => {
  const response = await fetch(`${baseUrl}/api/recipes/irgendein-rezept/rating`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stars: 5 }),
  });
  assert.equal(response.status, 401);
});

test('Bewertung außerhalb 1-5 wird abgelehnt', async () => {
  const { accessToken } = await loginAs('MEMBER');

  const recipesResponse = await fetch(`${baseUrl}/api/recipes?pageSize=1`);
  const { data }: any = await recipesResponse.json();
  assert.ok(data.length > 0, 'mindestens ein Rezept wird für den Test benötigt');

  const response = await fetch(`${baseUrl}/api/recipes/${data[0].slug}/rating`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ stars: 6 }),
  });
  assert.equal(response.status, 400);
});
