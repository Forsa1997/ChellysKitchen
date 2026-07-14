import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';

const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4100 + Math.floor(Math.random() * 400);
const BASE = `http://127.0.0.1:${PORT}`;
const ADMIN_EMAIL = 'admin@test.local';
const ADMIN_PASSWORD = 'admintest';

let child: ReturnType<typeof spawn>;
let dataDir: string;

async function api(path: string, { token, method = 'GET', body }: { token?: string; method?: string; body?: unknown } = {}): Promise<{ status: number; body: any; res: Response }> {
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
  return { status: res.status, body: json, res };
}

function validRecipePayload(overrides = {}) {
  return {
    title: 'Validierungsrezept',
    shortDescription: 'Ein valides Rezept für API-Vertragstests.',
    category: 'Cooking',
    difficulty: 'EINFACH',
    servings: 2,
    preparationTime: 5,
    cookingTime: 10,
    ingredients: [{ name: 'Salz', amount: 1, unit: 'g' }],
    steps: [{ stepNumber: 1, instruction: 'Kochen.' }],
    ...overrides,
  };
}

const INVALID_RECIPE_FIELDS: Array<[string, Record<string, unknown>]> = [
  ['title whitespace', { title: '   ' }],
  ['shortDescription whitespace', { shortDescription: '   ' }],
  ['category whitespace', { category: '   ' }],
  ['servings non-finite', { servings: 'abc' }],
  ['servings negative', { servings: -1 }],
  ['servings fractional', { servings: 1.5 }],
  ['preparationTime non-finite', { preparationTime: 'abc' }],
  ['preparationTime negative', { preparationTime: -1 }],
  ['preparationTime fractional', { preparationTime: 1.5 }],
  ['cookingTime non-finite', { cookingTime: 'abc' }],
  ['cookingTime negative', { cookingTime: -1 }],
  ['cookingTime fractional', { cookingTime: 1.5 }],
  ['ingredients not an array', { ingredients: { name: 'Salz' } }],
  ['ingredients contain null', { ingredients: [null] }],
  ['ingredient name empty', { ingredients: [{ name: ' ', amount: 1, unit: 'g' }] }],
  ['ingredient amount invalid', { ingredients: [{ name: 'Salz', amount: 'viel', unit: 'g' }] }],
  ['steps not an array', { steps: 'Kochen' }],
  ['steps contain null', { steps: [null] }],
  ['step instruction empty', { steps: [{ stepNumber: 1, instruction: ' ' }] }],
  ['step number invalid', { steps: [{ stepNumber: 1.5, instruction: 'Kochen.' }] }],
];

function archivedSubresourceRequests(recipe: any, { stars, notes, servings }: { stars?: unknown; notes?: unknown; servings?: unknown }): Array<[string, string, { method?: string; body?: unknown }]> {
  return [
    ['rating:post', `/api/recipes/${recipe.slug}/rating`, { method: 'POST', body: { stars } }],
    ['rating:get', `/api/recipes/${recipe.slug}/rating`, {}],
    ['rating:delete', `/api/recipes/${recipe.slug}/rating`, { method: 'DELETE' }],
    ['duplicate', `/api/recipes/${recipe.slug}/duplicate`, { method: 'POST' }],
    ['favorite:put', `/api/recipes/${recipe.slug}/favorite`, { method: 'PUT' }],
    ['favorite:delete', `/api/recipes/${recipe.slug}/favorite`, { method: 'DELETE' }],
    ['notes', `/api/recipes/${recipe.slug}/notes`, { method: 'PATCH', body: { notes } }],
    ['weekplan', '/api/weekplan/sunday', { method: 'POST', body: { recipeId: recipe.id, servings } }],
  ];
}

async function collectStatuses(requests: Array<[string, string, { method?: string; body?: unknown }]>, token: string) {
  const statuses: Record<string, number> = {};
  for (const [label, path, options] of requests) {
    statuses[label] = (await api(path, { ...options, token })).status;
  }
  return statuses;
}

// Public registration no longer exists — the admin provisions every account.
async function createMember(name: string) {
  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  assert.equal(adminLogin.status, 200);

  const email = `${name.toLowerCase()}_${Date.now()}@test.local`;
  const created = await api('/api/admin/users', {
    method: 'POST',
    token: adminLogin.body.accessToken,
    body: { name, email, password: 'secret123' },
  });
  assert.equal(created.status, 201);

  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'secret123' },
  });
  assert.equal(login.status, 200);
  return { token: login.body.accessToken, user: created.body, email };
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
  dataDir = mkdtempSync(join(tmpdir(), 'ck-smoke-'));
  child = spawn('node', ['server.mts'], {
    cwd: backendDir,
    env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir, ADMIN_EMAIL, ADMIN_PASSWORD },
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

test('admin-created user can log in (me returns the user)', async () => {
  const { token, email } = await createMember('Tester');

  const me = await api('/api/auth/me', { token });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.username, email);
});

test('recipe create -> update -> publish flow and admin role update', async () => {
  // Member creates a recipe
  const member = await createMember('Cook');
  const token = member.token;

  const created = await api('/api/recipes', {
    method: 'POST',
    token,
    body: {
      title: 'Smoke Test Rezept',
      shortDescription: 'lecker',
      category: 'Cooking',
      difficulty: 'EINFACH',
      servings: 2,
      preparationTime: 5,
      cookingTime: 10,
      ingredients: [{ name: 'Salz', amount: 1, unit: 'g' }],
      steps: [{ stepNumber: 1, instruction: 'kochen' }],
    },
  });
  assert.equal(created.status, 201);
  assert.equal(
    created.body.img,
    'https://picsum.photos/800/450?random=50',
    'recipes without an image keep the existing default image',
  );
  const recipeId = created.body.id;

  // Owner updates it
  const updated = await api(`/api/recipes/${recipeId}`, {
    method: 'PATCH',
    token,
    body: { title: 'Smoke Test Rezept (bearbeitet)' },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.title, 'Smoke Test Rezept (bearbeitet)');

  // Admin logs in and lists users
  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.body.accessToken;

  const usersList = await api('/api/admin/users', { token: adminToken });
  assert.equal(usersList.status, 200);
  assert.ok(Array.isArray(usersList.body.data));
  assert.equal(typeof usersList.body.total, 'number');
  const memberEntry = usersList.body.data.find((entry: any) => entry.id === member.user.id);
  assert.equal(memberEntry._count.recipesCreated, 1);

  // Promote the member to EDITOR
  const memberId = member.user.id;
  const roleUpdate = await api(`/api/admin/users/${memberId}/role`, {
    method: 'PATCH',
    token: adminToken,
    body: { role: 'EDITOR' },
  });
  assert.equal(roleUpdate.status, 200);
  assert.equal(roleUpdate.body.role, 'EDITOR');

  // Non-admin cannot list users
  const forbidden = await api('/api/admin/users', { token });
  assert.equal(forbidden.status, 403);

  // Admin archives the recipe -> disappears from public list
  const archived = await api(`/api/recipes/${recipeId}/archive`, { method: 'PATCH', token: adminToken });
  assert.equal(archived.status, 200);
  assert.equal(archived.body.status, 'ARCHIVED');

  const publicList = await api('/api/recipes?pageSize=24');
  assert.equal(publicList.status, 200);
  assert.ok(!publicList.body.data.some((r: any) => r.id === recipeId), 'archived recipe hidden from public list');

  // An archived recipe must not be discoverable through endpoints that use a
  // slug directly either. Otherwise the public list would hide it while a
  // previously shared URL still exposed its contents.
  const anonymousDetail = await api(`/api/recipes/${archived.body.slug}`);
  assert.equal(anonymousDetail.status, 404);

  const anonymousBring = await fetch(`${BASE}/api/recipes/${archived.body.slug}/bring`);
  assert.equal(anonymousBring.status, 404);

  const addToPlan = await api('/api/weekplan/monday', {
    method: 'POST',
    token,
    body: { recipeId, servings: 2 },
  });
  assert.equal(addToPlan.status, 200);
  const weekPlanBring = await fetch(`${BASE}/api/weekplan/bring`);
  const weekPlanHtml = await weekPlanBring.text();
  assert.equal(weekPlanBring.status, 200);
  assert.doesNotMatch(weekPlanHtml, /Smoke Test Rezept/);

  // Editors may still access the detail endpoint to review unpublished work.
  const editorDetail = await api(`/api/recipes/${archived.body.slug}`, { token });
  assert.equal(editorDetail.status, 200);
  assert.equal(editorDetail.body.status, 'ARCHIVED');
});

test('image upload stores a file that is served back', async () => {
  const { token } = await createMember('Up');

  const pngDataUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  const upload = await api('/api/uploads', {
    method: 'POST',
    token,
    body: { filename: 'pic.png', data: pngDataUrl },
  });
  assert.equal(upload.status, 201);
  assert.match(upload.body.url, /\/uploads\/[a-f0-9]+\.png$/);

  const path = new URL(upload.body.url).pathname;
  const fetched = await fetch(`${BASE}${path}`);
  assert.equal(fetched.status, 200);
  assert.equal(fetched.headers.get('content-type'), 'image/png');
});

test('CORS preflight allows PUT so browsers can set favorites', async () => {
  const res = await fetch(`${BASE}/api/recipes/irgendwas/favorite`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'PUT',
    },
  });
  assert.equal(res.status, 204);
  const allowed = res.headers.get('access-control-allow-methods') ?? '';
  assert.ok(allowed.includes('PUT'), `PUT missing from allowed methods: ${allowed}`);
});

test('favorites can be set, filtered and removed', async () => {
  const { token } = await createMember('Fan');

  const list = await api('/api/recipes?pageSize=2');
  const target = list.body.data[0];

  // Mark as favorite
  const marked = await api(`/api/recipes/${target.slug}/favorite`, { method: 'PUT', token });
  assert.equal(marked.status, 200);
  assert.equal(marked.body.isFavorite, true);

  // The favorites filter returns exactly the marked recipe.
  const favorites = await api('/api/recipes?favorites=true', { token });
  assert.equal(favorites.status, 200);
  assert.deepEqual(favorites.body.data.map((r: any) => r.id), [target.id]);

  // The random endpoint honors the favorites pool.
  const random = await api('/api/recipes/random?favorites=true', { token });
  assert.equal(random.status, 200);
  assert.equal(random.body.id, target.id);

  // Unmark again
  const unmarked = await api(`/api/recipes/${target.slug}/favorite`, { method: 'DELETE', token });
  assert.equal(unmarked.status, 200);
  assert.equal(unmarked.body.isFavorite, false);

  const empty = await api('/api/recipes?favorites=true', { token });
  assert.equal(empty.body.data.length, 0);

  // Unauthenticated favorite calls are rejected.
  const anonymous = await api(`/api/recipes/${target.slug}/favorite`, { method: 'PUT' });
  assert.equal(anonymous.status, 401);
});

test('any member can update the shared notes of a recipe', async () => {
  const { token } = await createMember('Notiz');

  const list = await api('/api/recipes?pageSize=1');
  const target = list.body.data[0];

  const updated = await api(`/api/recipes/${target.slug}/notes`, {
    method: 'PATCH',
    token,
    body: { notes: 'Nächstes Mal weniger Salz.' },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.notes, 'Nächstes Mal weniger Salz.');

  const detail = await api(`/api/recipes/${target.slug}`);
  assert.equal(detail.body.notes, 'Nächstes Mal weniger Salz.');

  const anonymous = await api(`/api/recipes/${target.slug}/notes`, {
    method: 'PATCH',
    body: { notes: 'x' },
  });
  assert.equal(anonymous.status, 401);
});

test('bring export serves schema.org recipe markup with scaled ingredients', async () => {
  const list = await api('/api/recipes?pageSize=1');
  const target = list.body.data[0];
  const doubled = target.servings * 2;

  const res = await fetch(`${BASE}/api/recipes/${target.slug}/bring?servings=${doubled}`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type')!, /text\/html/);

  const html = await res.text();
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  assert.ok(jsonLdMatch, 'page embeds JSON-LD');
  const jsonLd = JSON.parse(jsonLdMatch[1]);
  assert.equal(jsonLd['@type'], 'Recipe');
  assert.equal(jsonLd.name, target.title);
  assert.equal(jsonLd.recipeYield, String(doubled));
  assert.ok(jsonLd.recipeIngredient.length > 0, 'ingredients exported');

  const missing = await fetch(`${BASE}/api/recipes/gibt-es-nicht/bring`);
  assert.equal(missing.status, 404);
});

test('random recipe endpoint picks published recipes and respects filters', async () => {
  const random = await api('/api/recipes/random');
  assert.equal(random.status, 200);
  assert.equal(random.body.status, 'PUBLISHED');
  assert.ok(random.body.slug, 'random recipe has a slug');

  // Category filter narrows the pool.
  const baking = await api('/api/recipes/random?category=Baking');
  assert.equal(baking.status, 200);
  assert.equal(baking.body.category, 'Baking');

  // No match -> 404 instead of an arbitrary recipe.
  const none = await api(`/api/recipes/random?q=gibt-es-sicher-nicht-${Date.now()}`);
  assert.equal(none.status, 404);

  // exclude keeps "roll again" from returning the same recipe.
  const excluded = await api(`/api/recipes/random?category=Baking&exclude=${baking.body.slug}`);
  if (excluded.status === 200) {
    assert.notEqual(excluded.body.slug, baking.body.slug);
  }
});

test('admin can export a backup and restore it after data changes', async () => {
  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const adminToken = adminLogin.body.accessToken;

  // Export the current state.
  const exported = await api('/api/admin/export', { token: adminToken });
  assert.equal(exported.status, 200);
  assert.equal(exported.body.type, 'chellys-kitchen-backup');
  assert.ok(Array.isArray(exported.body.recipeStore));
  const recipeCountAtExport = exported.body.recipeStore.length;

  // Mutate state after the export: add a recipe the backup does not contain.
  const created = await api('/api/recipes', {
    method: 'POST',
    token: adminToken,
    body: {
      title: `Nach dem Backup ${Date.now()}`,
      shortDescription: 'sollte nach dem Import verschwinden',
      category: 'Cooking',
    },
  });
  assert.equal(created.status, 201);

  // Restore the backup -> the extra recipe is gone again.
  const imported = await api('/api/admin/import', {
    method: 'POST',
    token: adminToken,
    body: exported.body,
  });
  assert.equal(imported.status, 200);
  assert.equal(imported.body.recipes, recipeCountAtExport);

  // The importing admin must still be authenticated afterwards.
  const me = await api('/api/auth/me', { token: adminToken });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.role, 'ADMIN');

  const detail = await api(`/api/recipes/${created.body.slug}`);
  assert.equal(detail.status, 404);
});

test('export and import are admin-only', async () => {
  const { token } = await createMember('NoAdmin');

  const exported = await api('/api/admin/export', { token });
  assert.equal(exported.status, 403);

  const imported = await api('/api/admin/import', {
    method: 'POST',
    token,
    body: { type: 'chellys-kitchen-backup', version: 1, users: [], recipeStore: [] },
  });
  assert.equal(imported.status, 403);
});

test('import rejects files that are not a backup', async () => {
  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });

  const imported = await api('/api/admin/import', {
    method: 'POST',
    token: adminLogin.body.accessToken,
    body: { irgendwas: true },
  });
  assert.equal(imported.status, 400);
});

test('unauthenticated upload is rejected', async () => {
  const upload = await api('/api/uploads', {
    method: 'POST',
    body: { filename: 'pic.png', data: 'data:image/png;base64,AAAA' },
  });
  assert.equal(upload.status, 401);
});

test('members cannot access archived recipe subresources while editors retain access', async () => {
  const member = await createMember('ArchiveMember');
  const editor = await createMember('ArchiveEditor');
  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const adminToken = adminLogin.body.accessToken;

  const promoted = await api(`/api/admin/users/${editor.user.id}/role`, {
    method: 'PATCH',
    token: adminToken,
    body: { role: 'EDITOR' },
  });
  assert.equal(promoted.status, 200);

  const title = `Archivierter Sicherheitsvertrag ${Date.now()}`;
  const created = await api('/api/recipes', {
    method: 'POST',
    token: adminToken,
    body: validRecipePayload({ title }),
  });
  assert.equal(created.status, 201);

  // Create member-owned subresources while the recipe is still public. After
  // archiving, GET/DELETE must return 404 because the objects really exist.
  assert.equal((await api(`/api/recipes/${created.body.slug}/rating`, {
    method: 'POST', token: member.token, body: { stars: 5 },
  })).status, 200);
  assert.equal((await api(`/api/recipes/${created.body.slug}/favorite`, {
    method: 'PUT', token: member.token,
  })).status, 200);
  assert.equal((await api('/api/weekplan/sunday', {
    method: 'POST', token: member.token, body: { recipeId: created.body.id, servings: 2 },
  })).status, 200);

  const archived = await api(`/api/recipes/${created.body.id}/archive`, {
    method: 'PATCH',
    token: adminToken,
  });
  assert.equal(archived.status, 200);

  const memberRequests = archivedSubresourceRequests(created.body, {
    stars: 4,
    notes: 'Darf nicht gespeichert werden.',
    servings: 6,
  });
  const memberStatuses = await collectStatuses(memberRequests, member.token);
  const memberPatch = await api(`/api/recipes/${created.body.id}`, {
    method: 'PATCH', token: member.token, body: { title: 'Darf nicht sichtbar werden' },
  });
  const memberDelete = await api(`/api/recipes/${created.body.id}`, {
    method: 'DELETE', token: member.token,
  });
  const memberPlanDelete = await api(`/api/weekplan/sunday/${created.body.id}`, {
    method: 'DELETE', token: member.token,
  });
  const memberPlanClear = await api('/api/weekplan', { method: 'DELETE', token: member.token });

  const memberPlan = await api('/api/weekplan', { token: member.token });
  const memberPlanExposesRecipe = Object.values(memberPlan.body.days)
    .flat()
    .some((entry: any) => entry.recipeId === created.body.id || entry.recipe?.id === created.body.id);
  const publicBring = await fetch(`${BASE}/api/weekplan/bring`);
  const publicBringExposesRecipe = (await publicBring.text()).includes(title);
  const publicVariants = await api(`/api/recipes?q=${encodeURIComponent(title)}&pageSize=100`);

  // A denied MEMBER request must not mutate the existing rating or the recipe.
  const adminSnapshot = await api(`/api/recipes/${created.body.id}`, { token: adminToken });
  const editorPlanAfterMemberDeletes = await api('/api/weekplan', { token: editor.token });
  const hiddenPlanEntryPreserved = Object.values(editorPlanAfterMemberDeletes.body.days)
    .flat()
    .some((entry: any) => entry.recipeId === created.body.id || entry.recipe?.id === created.body.id);

  const editorRequests = archivedSubresourceRequests(created.body, {
    stars: 4,
    notes: 'Editor-Notiz',
    servings: 3,
  });
  const editorStatuses = await collectStatuses(editorRequests, editor.token);
  const editorPlan = await api('/api/weekplan', { token: editor.token });
  const editorPlanExposesRecipe = Object.values(editorPlan.body.days)
    .flat()
    .some((entry: any) => entry.recipeId === created.body.id || entry.recipe?.id === created.body.id);

  assert.deepEqual({
    memberStatuses,
    hiddenRecipeMutations: { patch: memberPatch.status, delete: memberDelete.status },
    hiddenPlanMutations: {
      targetedDelete: memberPlanDelete.status,
      clear: memberPlanClear.status,
      entryPreserved: hiddenPlanEntryPreserved,
    },
    memberPlanExposesRecipe,
    publicBring: { status: publicBring.status, exposesRecipe: publicBringExposesRecipe },
    publicVariantCount: publicVariants.body.meta.total,
    preservedMemberRating: {
      averageRating: adminSnapshot.body.averageRating,
      totalRatings: adminSnapshot.body.totalRatings,
    },
    preservedNotes: adminSnapshot.body.notes,
    editorStatuses,
    editorPlanExposesRecipe,
  }, {
    memberStatuses: Object.fromEntries(memberRequests.map(([label]) => [label, 404])),
    hiddenRecipeMutations: { patch: 404, delete: 404 },
    hiddenPlanMutations: { targetedDelete: 404, clear: 200, entryPreserved: true },
    memberPlanExposesRecipe: false,
    publicBring: { status: 200, exposesRecipe: false },
    publicVariantCount: 0,
    preservedMemberRating: { averageRating: 5, totalRatings: 1 },
    preservedNotes: '',
    editorStatuses: {
      'rating:post': 200,
      'rating:get': 200,
      'rating:delete': 204,
      duplicate: 201,
      'favorite:put': 200,
      'favorite:delete': 200,
      notes: 200,
      weekplan: 200,
    },
    editorPlanExposesRecipe: true,
  });
});

test('owners cannot mutate their own recipe after an editor archives it', async () => {
  const member = await createMember('ArchivedOwner');
  const adminLogin = await api('/api/auth/login', {
    method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const created = await api('/api/recipes', {
    method: 'POST', token: member.token, body: validRecipePayload({ title: `Owner-Archiv ${Date.now()}` }),
  });
  assert.equal(created.status, 201);
  assert.equal((await api(`/api/recipes/${created.body.id}/archive`, {
    method: 'PATCH', token: adminLogin.body.accessToken,
  })).status, 200);

  const patch = await api(`/api/recipes/${created.body.id}`, {
    method: 'PATCH', token: member.token, body: { title: 'Versteckte Änderung' },
  });
  const remove = await api(`/api/recipes/${created.body.id}`, {
    method: 'DELETE', token: member.token,
  });

  assert.deepEqual([patch.status, remove.status], [404, 404]);
});

test('ratings accept only integer stars from one through five', async () => {
  const { token } = await createMember('RatingContract');
  const list = await api('/api/recipes?pageSize=1');
  const target = list.body.data[0];

  const invalidStatuses: Record<string, number> = {};
  for (const stars of ['abc', 1.5, null]) {
    const response = await api(`/api/recipes/${target.slug}/rating`, {
      method: 'POST',
      token,
      body: { stars },
    });
    invalidStatuses[String(stars)] = response.status;
  }
  const lowerBound = await api(`/api/recipes/${target.slug}/rating`, {
    method: 'POST', token, body: { stars: 1 },
  });
  const upperBound = await api(`/api/recipes/${target.slug}/rating`, {
    method: 'POST', token, body: { stars: 5 },
  });

  assert.deepEqual(invalidStatuses, { abc: 400, '1.5': 400, null: 400 });
  assert.deepEqual([lowerBound.status, upperBound.status], [200, 200]);
});

test('recipe creation rejects invalid fields without persisting a recipe', async () => {
  const { token } = await createMember('CreateContract');
  const before = await api('/api/recipes?pageSize=1000');
  const unexpectedStatuses: Record<string, number> = {};

  for (const [label, override] of INVALID_RECIPE_FIELDS) {
    const response = await api('/api/recipes', {
      method: 'POST',
      token,
      body: validRecipePayload(override),
    });
    if (response.status !== 400) unexpectedStatuses[label] = response.status;
  }

  const after = await api('/api/recipes?pageSize=1000');
  assert.deepEqual({
    unexpectedStatuses,
    persistedRecipeDelta: after.body.meta.total - before.body.meta.total,
  }, {
    unexpectedStatuses: {},
    persistedRecipeDelta: 0,
  });
});

test('recipe patch rejects invalid fields without mutating the recipe', async () => {
  const { token } = await createMember('PatchContract');
  const created = await api('/api/recipes', {
    method: 'POST',
    token,
    body: validRecipePayload({ title: `Patch-Vertrag ${Date.now()}` }),
  });
  assert.equal(created.status, 201);

  const unexpectedStatuses: Record<string, number> = {};

  for (const [label, body] of INVALID_RECIPE_FIELDS) {
    const response = await api(`/api/recipes/${created.body.id}`, {
      method: 'PATCH',
      token,
      body,
    });
    if (response.status !== 400) unexpectedStatuses[label] = response.status;
  }

  const after = await api(`/api/recipes/${created.body.id}`, { token });
  const fields = [
    'title', 'shortDescription', 'category', 'servings', 'preparationTime',
    'cookingTime', 'ingredients', 'steps',
  ];
  const project = (recipe: any) => Object.fromEntries(fields.map((field) => [field, recipe[field]]));

  assert.deepEqual({
    unexpectedStatuses,
    recipe: project(after.body),
  }, {
    unexpectedStatuses: {},
    recipe: project(created.body),
  });
});
