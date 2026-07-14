import { randomBytes } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { pathToFileURL } from 'node:url';
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { recipes } from './data/recipes.mts';
import { queryRecipes } from './src/queryRecipes.mts';
import { pickRandomRecipe } from './src/randomRecipe.mts';
import { createExportPayload, parseImportPayload } from './src/backup.mts';
import { renderBringHtml } from './src/bringExport.mts';
import {
  WEEK_DAYS,
  aggregateWeekPlanIngredients,
  createEmptyWeekPlan,
  isWeekDay,
  type PlannedMeal,
} from './src/weekplan.mts';
import {
  extractRecipeFromPhoto,
  isPhotoImportConfigured,
} from './src/photoImport.mts';
import {
  MAX_BATCH_PHOTOS,
  createBatchPhotoImportJobs,
  type BatchPhoto,
} from './src/batchPhotoImport.mts';
import {
  extractRecipeFromHtml,
  extractRecipeJsonLd,
  isAllowedImportUrl,
  mapJsonLdToRecipe,
} from './src/recipeImport.mts';
import { translateImportedRecipe } from './src/translateImport.mts';
import { createRateLimiter } from './src/rateLimit.mts';
import { resolveCorsOrigin } from './src/cors.mts';
import {
  createDebouncedPersister,
  createStore,
} from './src/persistence.mts';
import { createPrismaStore } from './src/prismaStore.mts';
import {
  contentTypeForExt,
  MAX_UPLOAD_BYTES,
  validateImageUpload,
} from './src/uploads.mts';
import { hashPassword, verifyPassword } from './src/passwords.mts';
import {
  ACCESS_TTL_MS,
  REFRESH_TTL_MS,
  createSessionEntry,
  normalizeSessionMap,
  pruneExpiredSessions,
  resolveSession,
} from './src/sessions.mts';
import { createMetricsRecorder, resolveRequestId } from './src/observability.mts';
import type { BackupUploadEntry } from './src/backup.mts';
import type { ImportedRecipe } from './src/recipeImport.mts';
import type { ValidatedImageUpload } from './src/uploads.mts';
import type {
  Category,
  Rating,
  Recipe,
  RecipeCreator,
  Role,
  SessionEntry,
  StateStore,
  User,
  WeekPlan,
} from './src/types.mts';

const port = Number(process.env.PORT ?? 4000);
const allowedOrigin = process.env.CORS_ORIGIN;
const isProduction = process.env.NODE_ENV === 'production';

const DATA_DIR = process.env.DATA_DIR ?? './.data';
const UPLOADS_DIR = resolve(DATA_DIR, 'uploads');
// With DATABASE_URL the state lives in Postgres (Prisma); without it the
// JSON file store keeps local development and tests dependency-free.
const store: StateStore = process.env.DATABASE_URL
  ? await createPrismaStore(process.env.DATABASE_URL)
  : createStore(resolve(DATA_DIR, 'store.json'));

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Cooking', slug: 'cooking', description: 'Hauptgerichte und Kochrezepte', icon: '🍳' },
  { id: 'cat_2', name: 'Baking', slug: 'baking', description: 'Backwaren und Desserts', icon: '🧁' },
  { id: 'cat_3', name: 'Barbeque', slug: 'barbeque', description: 'Grillen und BBQ', icon: '🍖' },
  { id: 'cat_4', name: 'Salads', slug: 'salads', description: 'Frische Salate', icon: '🥗' },
  { id: 'cat_5', name: 'Soups', slug: 'soups', description: 'Suppen und Eintöpfe', icon: '🍲' },
  { id: 'cat_6', name: 'Desserts', slug: 'desserts', description: 'Süße Desserts', icon: '🍰' },
];

// Hydrate state from the store (survives restarts); fall back to seed data
// on first run or an unreadable store.
const loadedState = await store.load();
const users = loadedState?.users ?? new Map<string, User>();
const sessions = loadedState?.sessions ?? new Map<string, SessionEntry>();
const refreshSessions = loadedState?.refreshSessions ?? new Map<string, SessionEntry>();
const recipeStore: Recipe[] = loadedState?.recipeStore ?? [...recipes];
const ratingsStore = loadedState?.ratingsStore ?? new Map<string, Map<string, Rating>>(); // recipeId -> Map<userId, rating>
const categoriesStore: Category[] = loadedState?.categoriesStore ?? [...DEFAULT_CATEGORIES];
const favoritesStore = loadedState?.favoritesStore ?? new Map<string, Set<string>>(); // userId -> Set<recipeId>
const weekPlanStore: WeekPlan = loadedState?.weekPlanStore ?? createEmptyWeekPlan(); // day -> [{ recipeId, servings }]

const persister = createDebouncedPersister(
  store,
  () => ({ users, sessions, refreshSessions, recipeStore, ratingsStore, categoriesStore, favoritesStore, weekPlanStore }),
  200,
);
const persist = () => persister.schedule();

const metrics = createMetricsRecorder();

// Batch photo import (admin only): every recognized photo becomes an
// unpublished DRAFT tagged for review, so a big cookbook backlog can be
// digitized in one go and published recipe by recipe afterwards.
const BATCH_IMPORT_TAG = 'KI-Import';

interface BatchImportContext {
  createdBy: RecipeCreator;
  baseUrl: string;
}

const batchPhotoImportJobs = createBatchPhotoImportJobs<BatchImportContext>({
  extractRecipe: (photo) => extractRecipeFromPhoto({
    mediaType: photo.mime,
    base64Data: photo.buffer.toString('base64'),
  }),
  createRecipeFromPhoto: async ({ recipe, photo, context }) => {
    // Keep the source photo as the draft's image so reviewers can compare
    // the extracted recipe against the original page.
    const fileName = `${randomBytes(12).toString('hex')}.${photo.ext}`;
    writeFileSync(join(UPLOADS_DIR, fileName), photo.buffer);
    if (store.saveUpload) {
      await store.saveUpload(fileName, photo.buffer);
    }

    const now = new Date().toISOString();
    const title = recipe.title || 'Unbenanntes Rezept';
    const draft: Recipe = {
      id: `r_${randomBytes(8).toString('hex')}`,
      slug: uniqueSlug(title),
      title,
      shortDescription: recipe.shortDescription || 'Automatisch aus einem Foto importiert.',
      category: 'Cooking',
      tag: BATCH_IMPORT_TAG,
      difficulty: 'MITTEL',
      servings: recipe.servings ?? 2,
      preparationTime: recipe.preparationTime ?? 0,
      cookingTime: recipe.cookingTime ?? 0,
      img: `${context.baseUrl}/uploads/${fileName}`,
      ingredients: recipe.ingredients ?? [],
      steps: recipe.steps ?? [],
      status: 'DRAFT',
      createdBy: context.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    recipeStore.unshift(draft);
    persist();
    return draft;
  },
});

// Beim Testlauf (node --test) bleibt stdout für den TAP-Report reserviert.
const requestLoggingEnabled = !process.env.NODE_TEST_CONTEXT;

interface RequestLogEntry {
  requestId: string;
  method: string | undefined;
  path: string | undefined;
  statusCode: number;
  durationMs: number;
}

function logRequest({ requestId, method, path, statusCode, durationMs }: RequestLogEntry): void {
  if (!requestLoggingEnabled) return;
  console.log(JSON.stringify({
    level: statusCode >= 500 ? 'error' : 'info',
    time: new Date().toISOString(),
    msg: 'request completed',
    requestId,
    method,
    path,
    statusCode,
    durationMs: Math.round(durationMs * 100) / 100,
  }));
}

// Login is the only public write endpoint (there is no registration), so
// failed attempts are rate-limited: per IP+account, plus a wider per-account
// net against attackers that rotate IPs. In-memory on purpose.
const LOGIN_MAX_FAILURES = Number(process.env.LOGIN_MAX_FAILURES ?? 8);
const LOGIN_WINDOW_MS = Number(process.env.LOGIN_WINDOW_MS ?? 10 * 60 * 1000);
const loginLimiter = createRateLimiter({ maxFailures: LOGIN_MAX_FAILURES, windowMs: LOGIN_WINDOW_MS });
const accountLimiter = createRateLimiter({ maxFailures: LOGIN_MAX_FAILURES * 3, windowMs: LOGIN_WINDOW_MS });

function errorMessage(error: unknown): string {
  // Every throw in this codebase is `new Error(...)`; anything else is
  // stringified rather than crashing the error path itself.
  return error instanceof Error ? error.message : String(error);
}

function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.socket?.remoteAddress ?? 'unknown';
}

const ROLE_RANK: Record<Role, number> = { GUEST: 0, MEMBER: 1, EDITOR: 2, ADMIN: 3 };
const VALID_ROLES = Object.keys(ROLE_RANK);
const VALID_RECIPE_STATUSES = new Set(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

function hasMinRole(user: User | null | undefined, role: Role): user is User {
  return !!user && (ROLE_RANK[user.role] ?? -1) >= (ROLE_RANK[role] ?? Infinity);
}

function isPublicRecipe(recipe: Recipe): boolean {
  return (recipe.status ?? 'PUBLISHED') === 'PUBLISHED';
}

function canViewRecipe(recipe: Recipe, requester: User | null | undefined): boolean {
  return isPublicRecipe(recipe) || hasMinRole(requester, 'EDITOR');
}

function findRecipeByIdOrSlug(idOrSlug: string): Recipe | null {
  return recipeStore.find(
    (entry) => entry.id === idOrSlug || (entry.slug ?? toSlug(entry.title)) === idOrSlug,
  ) ?? null;
}

function findViewableRecipe(idOrSlug: string, requester: User | null | undefined): Recipe | null {
  const recipe = findRecipeByIdOrSlug(idOrSlug);
  return recipe && canViewRecipe(recipe, requester) ? recipe : null;
}

// Request bodies are validated at runtime; `any` keeps the field checks below
// exactly as they were instead of re-encoding them as type guards.
function validateRecipePayload(payload: any, { partial = false }: { partial?: boolean } = {}): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return 'Rezeptdaten müssen ein Objekt sein.';
  }

  for (const [field, label] of [
    ['title', 'Titel'],
    ['shortDescription', 'Beschreibung'],
    ['category', 'Kategorie'],
  ] as Array<[string, string]>) {
    const value = payload[field];
    if ((!partial || value !== undefined) && (typeof value !== 'string' || !value.trim())) {
      return `${label} ist erforderlich.`;
    }
  }

  for (const [field, label, minimum] of [
    ['servings', 'Portionen', 1],
    ['preparationTime', 'Vorbereitungszeit', 0],
    ['cookingTime', 'Kochzeit', 0],
  ] as Array<[string, string, number]>) {
    const value = payload[field];
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < minimum)) {
      return `${label} muss eine ganze Zahl ab ${minimum} sein.`;
    }
  }

  if (payload.ingredients !== undefined && !Array.isArray(payload.ingredients)) {
    return 'Zutaten müssen als Liste übergeben werden.';
  }
  if (Array.isArray(payload.ingredients)) {
    for (const ingredient of payload.ingredients) {
      if (!ingredient || typeof ingredient !== 'object' || Array.isArray(ingredient)) {
        return 'Jede Zutat muss ein Objekt sein.';
      }
      if (typeof ingredient.name !== 'string' || !ingredient.name.trim()) {
        return 'Jede Zutat benötigt einen Namen.';
      }
      if (typeof ingredient.amount !== 'number' || !Number.isFinite(ingredient.amount) || ingredient.amount < 0) {
        return 'Jede Zutatenmenge muss eine Zahl ab 0 sein.';
      }
      if (typeof ingredient.unit !== 'string') {
        return 'Jede Zutat benötigt eine Einheit als Text.';
      }
    }
  }
  if (payload.steps !== undefined && !Array.isArray(payload.steps)) {
    return 'Zubereitungsschritte müssen als Liste übergeben werden.';
  }
  if (Array.isArray(payload.steps)) {
    for (const step of payload.steps) {
      if (!step || typeof step !== 'object' || Array.isArray(step)) {
        return 'Jeder Zubereitungsschritt muss ein Objekt sein.';
      }
      if (!Number.isInteger(step.stepNumber) || step.stepNumber < 1) {
        return 'Jeder Zubereitungsschritt benötigt eine positive Nummer.';
      }
      if (typeof step.instruction !== 'string' || !step.instruction.trim()) {
        return 'Jeder Zubereitungsschritt benötigt eine Anweisung.';
      }
    }
  }
  if (payload.status !== undefined && !VALID_RECIPE_STATUSES.has(String(payload.status).toUpperCase())) {
    return 'Unbekannter Rezeptstatus.';
  }

  return null;
}

function uniqueSlug(title: string, currentId?: string): string {
  const base = toSlug(title) || `rezept-${randomBytes(4).toString('hex')}`;
  let candidate = base;
  let counter = 2;
  while (recipeStore.some((entry) => entry.id !== currentId && (entry.slug ?? toSlug(entry.title)) === candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

function jsonResponse(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function withCors(req: IncomingMessage, res: ServerResponse): void {
  const requestOrigin = req.headers.origin;
  const origin = resolveCorsOrigin({ requestOrigin, allowedOrigin });

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  // `Allow-Credentials: true` is invalid together with a wildcard origin;
  // only send it when we echo a concrete origin.
  if (origin !== '*') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

function sanitizeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toSlug(value: unknown): string {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeDifficulty(value: unknown): string {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (normalized === 'einfach') return 'EINFACH';
  if (normalized === 'mittel') return 'MITTEL';
  if (normalized === 'schwer') return 'SCHWER';

  return typeof value === 'string' && ['EINFACH', 'MITTEL', 'SCHWER'].includes(value) ? value : 'MITTEL';
}

function createSession(user: User) {
  // Cheap housekeeping on every login so the persisted maps stay bounded.
  pruneExpiredSessions(sessions);
  pruneExpiredSessions(refreshSessions);

  const accessToken = randomBytes(24).toString('hex');
  const refreshToken = randomBytes(24).toString('hex');
  sessions.set(accessToken, createSessionEntry(user.id, Date.now(), ACCESS_TTL_MS));
  refreshSessions.set(refreshToken, createSessionEntry(user.id, Date.now(), REFRESH_TTL_MS));

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  };
}

function sanitizeRecipe(recipe: Recipe, requester: User | null | undefined): Recipe {
  // Calculate average rating for this recipe
  const recipeRatings = ratingsStore.get(recipe.id);
  let averageRating = 0;
  let totalRatings = 0;

  if (recipeRatings && recipeRatings.size > 0) {
    const allRatings = Array.from(recipeRatings.values());
    totalRatings = allRatings.length;
    averageRating = allRatings.reduce((sum, r) => sum + r.stars, 0) / totalRatings;
  }

  return {
    id: recipe.id,
    slug: recipe.slug ?? toSlug(recipe.title || recipe.id),
    title: recipe.title,
    shortDescription: recipe.shortDescription,
    description: recipe.description,
    img: recipe.img,
    tag: recipe.tag,
    difficulty: normalizeDifficulty(recipe.difficulty),
    servings: Number(recipe.servings ?? 2),
    preparationTime: Number(recipe.preparationTime ?? 0),
    cookingTime: Number(recipe.cookingTime ?? 0),
    category: recipe.category ?? 'Cooking',
    status: recipe.status ?? 'PUBLISHED',
    ingredients: recipe.ingredients ?? [],
    steps: recipe.steps ?? [],
    nutritionalValues: recipe.nutritionalValues,
    createdBy: recipe.createdBy ?? {
      id: recipe.createdById ?? 'demo-author',
      name: recipe.authors?.[0]?.name ?? 'Chellys Kitchen',
    },
    createdAt: recipe.createdAt ?? recipe.creationDate ?? new Date().toISOString(),
    updatedAt: recipe.updatedAt ?? recipe.creationDate ?? new Date().toISOString(),
    publishedAt: recipe.publishedAt ?? recipe.creationDate ?? new Date().toISOString(),
    averageRating: Math.round(averageRating * 10) / 10,
    totalRatings,
    notes: recipe.notes ?? '',
    isFavorite: !!(requester && favoritesStore.get(requester.id)?.has(recipe.id)),
  };
}

// Body fields stay `any` on purpose: every route validates them at runtime
// before use, exactly as before the TypeScript migration.
async function parseJsonBody(req: IncomingMessage, maxBytes = 1024 * 1024): Promise<Record<string, any>> {
  let body = '';

  for await (const chunk of req) {
    body += chunk;

    if (body.length > maxBytes) {
      throw new Error('Payload too large');
    }
  }

  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error('Invalid JSON payload');
  }
}

function getBearerToken(req: IncomingMessage): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length).trim();
}

function findUserById(userId: string): User | null {
  return Array.from(users.values()).find((entry) => entry.id === userId) ?? null;
}

function authenticateRequest(req: IncomingMessage): User | null {
  const token = getBearerToken(req);
  if (!token) {
    return null;
  }

  const userId = resolveSession(sessions, token);
  return userId ? findUserById(userId) : null;
}

function seedUser({ name, username, role, password }: { name: string; username: string; role: Role; password: string }): void {
  const normalizedUsername = String(username).trim().toLowerCase();
  if (users.has(normalizedUsername)) {
    return;
  }
  const credential = hashPassword(password);
  const now = new Date().toISOString();
  users.set(normalizedUsername, {
    id: `user_${randomBytes(8).toString('hex')}`,
    name,
    username: normalizedUsername,
    role,
    passwordHash: credential.hash,
    salt: credential.salt,
    algo: credential.algo,
    createdAt: now,
    updatedAt: now,
  });
}

function seedDefaultUsers() {
  // Well-known demo credentials are a development convenience only — never
  // create them on a public deployment.
  if (!isProduction) {
    seedUser({
      name: 'Demo User',
      username: 'demo',
      role: 'MEMBER',
      password: 'demo1234',
    });
  }

  // An admin account is required to reach the admin dashboard. In production
  // it must be configured explicitly; the well-known local fallback would
  // otherwise be an open door.
  // ADMIN_USERNAME is the current name; ADMIN_EMAIL stays as a legacy alias so
  // existing production deployments keep provisioning their admin unchanged.
  const adminUsername = process.env.ADMIN_USERNAME ?? process.env.ADMIN_EMAIL;
  if (adminUsername && process.env.ADMIN_PASSWORD) {
    const adminName = process.env.ADMIN_NAME?.trim() || 'Admin';
    seedUser({
      name: adminName,
      username: adminUsername,
      role: 'ADMIN',
      password: process.env.ADMIN_PASSWORD,
    });
    // The env vars manage this account, so an explicitly configured
    // ADMIN_NAME also renames an already existing admin — otherwise the
    // change would only take effect after a data wipe.
    if (process.env.ADMIN_NAME) {
      const existingAdmin = users.get(String(adminUsername).trim().toLowerCase());
      if (existingAdmin && existingAdmin.name !== adminName) {
        existingAdmin.name = adminName;
        existingAdmin.updatedAt = new Date().toISOString();
      }
    }
  } else if (!isProduction) {
    seedUser({
      name: 'Admin',
      username: 'admin',
      role: 'ADMIN',
      password: 'admin1234',
    });
  } else if (![...users.values()].some((user) => user.role === 'ADMIN')) {
    console.warn('Kein Admin-Konto vorhanden: ADMIN_USERNAME und ADMIN_PASSWORD setzen.');
  }

  // There is no public registration — besides the admin dashboard, SEED_USERS
  // is the only way to provision accounts: a JSON array of
  // { name, username, password, role? } objects, e.g.
  // SEED_USERS='[{"name":"Chelly","username":"chelly","password":"...","role":"EDITOR"}]'
  // `email` is still accepted as a legacy alias for `username`.
  if (process.env.SEED_USERS) {
    let entries: any;
    try {
      entries = JSON.parse(process.env.SEED_USERS);
    } catch {
      console.warn('SEED_USERS ist kein gültiges JSON und wird ignoriert.');
      return;
    }
    if (!Array.isArray(entries)) {
      console.warn('SEED_USERS muss ein JSON-Array sein und wird ignoriert.');
      return;
    }
    for (const entry of entries) {
      const entryUsername = entry?.username ?? entry?.email;
      if (!entry || !entryUsername || !entry.password) {
        console.warn('SEED_USERS-Eintrag ohne username/password übersprungen.');
        continue;
      }
      seedUser({
        name: String(entry.name ?? entryUsername).trim(),
        username: entryUsername,
        role: VALID_ROLES.includes(entry.role) ? entry.role : 'MEMBER',
        password: entry.password,
      });
    }
  }
}

mkdirSync(UPLOADS_DIR, { recursive: true });
// With the Postgres store the disk is just a cache for uploaded images —
// materialize anything the database has that the (ephemeral) disk lost.
if (store.loadUploads) {
  for (const upload of await store.loadUploads()) {
    const filePath = join(UPLOADS_DIR, basename(upload.fileName));
    if (!existsSync(filePath)) {
      writeFileSync(filePath, upload.data);
    }
  }
}
// Stores persisted before the TTL change hold plain userId strings; upgrade
// them once so every session entry carries an expiry.
normalizeSessionMap(sessions, Date.now(), ACCESS_TTL_MS);
normalizeSessionMap(refreshSessions, Date.now(), REFRESH_TTL_MS);
pruneExpiredSessions(sessions);
pruneExpiredSessions(refreshSessions);
seedDefaultUsers();
persist();

const server = createServer(async (req, res) => {
  const requestStart = process.hrtime.bigint();
  const requestId = resolveRequestId(req.headers['x-request-id']);
  res.setHeader('x-request-id', requestId);
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - requestStart) / 1e6;
    metrics.record(res.statusCode, durationMs);
    logRequest({ requestId, method: req.method, path: req.url, statusCode: res.statusCode, durationMs });
  });

  withCors(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ---------------------------------------------------------------------------
  // Private-by-default gate. The app is kept completely private: every endpoint
  // requires a signed-in user. Only a small allowlist stays public — the health
  // probe, the auth endpoints, and the Bring! export pages (Bring's crawler
  // fetches those server-side without a token). Anything else — recipe
  // browsing, categories, uploaded images, the week plan, admin — gets a 401
  // before it reaches its route handler.
  // ---------------------------------------------------------------------------
  {
    const gatePath = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`).pathname;
    const isPublicPath =
      gatePath === '/health' ||
      gatePath.startsWith('/api/auth/') ||
      gatePath === '/api/weekplan/bring' ||
      /^\/api\/recipes\/[^/]+\/bring$/.test(gatePath);

    if (!isPublicPath && !authenticateRequest(req)) {
      jsonResponse(res, 401, { error: 'Bitte zuerst anmelden.' });
      return;
    }
  }

  if (req.method === 'GET' && req.url === '/health') {
    jsonResponse(res, 200, {
      status: 'ok',
      database: process.env.DATABASE_URL ? 'postgres' : 'json-file',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/metrics') {
    jsonResponse(res, 200, metrics.snapshot());
    return;
  }

  if (req.method === 'GET' && req.url?.startsWith('/api/recipes')) {
    const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

    if (requestUrl.pathname === '/api/recipes') {
      const query = Object.fromEntries(requestUrl.searchParams.entries());
      // Only editors/admins may list non-published recipes.
      const requester = authenticateRequest(req);
      if (!hasMinRole(requester, 'EDITOR')) {
        query.status = 'PUBLISHED';
      }
      const result = queryRecipes(recipeStore.map((recipe) => sanitizeRecipe(recipe, requester)), query);
      jsonResponse(res, 200, result);
      return;
    }
  }

  // GET /api/recipes/random - Pick a random recipe from ALL matching recipes
  // (the list endpoint is paginated; this one is not). Must be handled before
  // the generic /api/recipes/:slug route below.
  if (req.method === 'GET' && req.url?.startsWith('/api/recipes/random')) {
    const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

    if (requestUrl.pathname === '/api/recipes/random') {
      const query = Object.fromEntries(requestUrl.searchParams.entries());
      // Same visibility rule as the list: non-editors only see published recipes.
      const requester = authenticateRequest(req);
      if (!hasMinRole(requester, 'EDITOR')) {
        query.status = 'PUBLISHED';
      }

      const picked = pickRandomRecipe(
        recipeStore.map((recipe) => sanitizeRecipe(recipe, requester)),
        query,
        { excludeSlug: String(query.exclude ?? '') || undefined },
      );

      if (!picked) {
        jsonResponse(res, 404, { error: 'Kein passendes Rezept gefunden.' });
        return;
      }

      jsonResponse(res, 200, picked);
      return;
    }
  }

  if (req.method === 'GET' && req.url?.startsWith('/api/recipes/')) {
    const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

    if (!/^\/api\/recipes\/[^/]+$/.test(requestUrl.pathname)) {
      // Let nested recipe routes such as /api/recipes/:slug/rating continue below.
    } else {
      const recipeSlug = requestUrl.pathname.replace('/api/recipes/', '');
      const recipe = recipeStore.find((entry) => entry.id === recipeSlug || (entry.slug ?? toSlug(entry.title)) === recipeSlug);

      if (!recipe) {
        jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
        return;
      }

      const requester = authenticateRequest(req);
      if (!canViewRecipe(recipe, requester)) {
        jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
        return;
      }

      jsonResponse(res, 200, sanitizeRecipe(recipe, requester));
      return;
    }
  }

  // GET /api/recipes/:idOrSlug/bring - Public schema.org page for the Bring!
  // shopping-list import. Bring's deeplink API fetches this URL server-side
  // (unauthenticated) and parses the embedded JSON-LD; ?servings=N scales
  // the ingredient amounts to the portion count picked in the frontend.
  if (req.method === 'GET' && req.url?.startsWith('/api/recipes/')) {
    const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    const bringMatch = requestUrl.pathname.match(/^\/api\/recipes\/([^/]+)\/bring$/);

    if (bringMatch) {
      const recipe = findRecipeByIdOrSlug(decodeURIComponent(bringMatch[1]));
      if (!recipe || !canViewRecipe(recipe, authenticateRequest(req))) {
        jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
        return;
      }

      const html = renderBringHtml(recipe, { servings: requestUrl.searchParams.get('servings') ?? undefined });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }
  }

  if (req.method === 'POST' && req.url === '/api/auth/login') {
    try {
      const { username, email, password } = await parseJsonBody(req);
      // `email` stays accepted as a legacy alias for `username`.
      const normalizedUsername = String(username ?? email ?? '').trim().toLowerCase();

      const ipKey = `${clientIp(req)}|${normalizedUsername}`;
      const blocked = [loginLimiter.isBlocked(ipKey), accountLimiter.isBlocked(normalizedUsername)]
        .find((check) => check.blocked);
      if (blocked) {
        res.setHeader('Retry-After', String(blocked.retryAfterSeconds));
        jsonResponse(res, 429, {
          error: `Zu viele fehlgeschlagene Anmeldeversuche. Bitte warte ${blocked.retryAfterSeconds} Sekunden.`,
        });
        return;
      }

      const user = users.get(normalizedUsername);
      const result = user ? verifyPassword(user, String(password ?? '')) : { valid: false, needsRehash: false };

      if (!user || !result.valid) {
        loginLimiter.recordFailure(ipKey);
        accountLimiter.recordFailure(normalizedUsername);
        jsonResponse(res, 401, { error: 'Ungültige Anmeldedaten.' });
        return;
      }

      loginLimiter.reset(ipKey);
      accountLimiter.reset(normalizedUsername);

      // Accounts from before the scrypt switch still carry SHA-256 hashes;
      // upgrade them transparently while the plaintext password is at hand.
      if (result.needsRehash) {
        const credential = hashPassword(String(password ?? ''));
        user.passwordHash = credential.hash;
        user.salt = credential.salt;
        user.algo = credential.algo;
        user.updatedAt = new Date().toISOString();
      }

      const session = createSession(user);
      persist();
      jsonResponse(res, 200, session);
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  if (req.method === 'POST' && req.url === '/api/auth/refresh') {
    try {
      const { refreshToken } = await parseJsonBody(req);
      const token = String(refreshToken ?? '');
      const userId = resolveSession(refreshSessions, token);
      const user = userId ? findUserById(userId) : null;

      if (!user) {
        jsonResponse(res, 401, { error: 'Ungültiger Refresh Token.' });
        return;
      }

      // Rotate: a refresh token is single-use.
      refreshSessions.delete(token);
      const session = createSession(user);
      persist();
      jsonResponse(res, 200, session);
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  if (req.method === 'POST' && req.url === '/api/auth/logout') {
    const token = getBearerToken(req);
    if (token) {
      sessions.delete(token);
    }

    // Also invalidate the refresh token when the client sends it along.
    try {
      const { refreshToken } = await parseJsonBody(req);
      if (refreshToken) {
        refreshSessions.delete(String(refreshToken));
      }
    } catch {
      // Body is optional for logout.
    }

    persist();
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/auth/me') {
    const user = authenticateRequest(req);

    if (!user) {
      jsonResponse(res, 401, { error: 'Nicht authentifiziert.' });
      return;
    }

    jsonResponse(res, 200, { user: sanitizeUser(user) });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/recipes') {
    const user = authenticateRequest(req);

    if (!user) {
      jsonResponse(res, 401, { error: 'Bitte zuerst anmelden.' });
      return;
    }

    try {
      const payload = await parseJsonBody(req);
      const validationError = validateRecipePayload(payload);
      if (validationError) {
        jsonResponse(res, 400, { error: validationError });
        return;
      }
      const {
        title,
        shortDescription,
        category,
        tag,
        difficulty,
        servings,
        preparationTime,
        cookingTime,
        ingredients,
        steps,
        img,
      } = payload;

      const newRecipe = {
        id: `r_${randomBytes(8).toString('hex')}`,
        slug: uniqueSlug(title),
        title: String(title).trim(),
        shortDescription: String(shortDescription).trim(),
        description: String(payload.description ?? '').trim() || undefined,
        category: String(category).trim(),
        tag: String(tag ?? 'Neu').trim() || 'Neu',
        difficulty: normalizeDifficulty(difficulty),
        servings: servings ?? 2,
        preparationTime: preparationTime ?? 10,
        cookingTime: cookingTime ?? 20,
        img: String(img ?? 'https://picsum.photos/800/450?random=50'),
        ingredients: Array.isArray(ingredients) ? ingredients : [],
        steps: Array.isArray(steps) ? steps : [],
        nutritionalValues: payload.nutritionalValues ?? undefined,
        status: 'PUBLISHED',
        createdBy: { id: user.id, name: user.name },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      };

      recipeStore.unshift(newRecipe);
      persist();
      jsonResponse(res, 201, sanitizeRecipe(newRecipe, user));
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  // ============================================================================
  // Rating Endpoints
  // ============================================================================

  // POST /api/recipes/:slug/rating - Create or update rating
  if (req.method === 'POST' && req.url?.match(/^\/api\/recipes\/[^/]+\/rating$/)) {
    const user = authenticateRequest(req);

    if (!user) {
      jsonResponse(res, 401, { error: 'Bitte zuerst anmelden.' });
      return;
    }

    try {
      const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
      const slug = requestUrl.pathname.split('/')[3];
      const recipe = findViewableRecipe(slug, user);

      if (!recipe) {
        jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
        return;
      }

      const { stars } = await parseJsonBody(req);

      if (typeof stars !== 'number' || !Number.isInteger(stars) || stars < 1 || stars > 5) {
        jsonResponse(res, 400, { error: 'Sternebewertung muss zwischen 1 und 5 liegen.' });
        return;
      }

      // Store or update rating
      let recipeRatings = ratingsStore.get(recipe.id);
      if (!recipeRatings) {
        recipeRatings = new Map();
        ratingsStore.set(recipe.id, recipeRatings);
      }
      recipeRatings.set(user.id, {
        id: `rating_${randomBytes(8).toString('hex')}`,
        userId: user.id,
        recipeId: recipe.id,
        stars,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Calculate average rating
      const allRatings = Array.from(recipeRatings.values());
      const averageRating = allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length
        : 0;

      persist();
      jsonResponse(res, 200, {
        rating: recipeRatings.get(user.id),
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: allRatings.length,
      });
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  // GET /api/recipes/:slug/rating - Get user's rating for a recipe
  if (req.method === 'GET' && req.url?.match(/^\/api\/recipes\/[^/]+\/rating$/)) {
    const user = authenticateRequest(req);

    if (!user) {
      jsonResponse(res, 401, { error: 'Bitte zuerst anmelden.' });
      return;
    }

    try {
      const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
      const slug = requestUrl.pathname.split('/')[3];
      const recipe = findViewableRecipe(slug, user);

      if (!recipe) {
        jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
        return;
      }

      const recipeRatings = ratingsStore.get(recipe.id);
      const userRating = recipeRatings?.get(user.id);

      if (!userRating) {
        jsonResponse(res, 404, { error: 'Keine Bewertung gefunden.' });
        return;
      }

      jsonResponse(res, 200, userRating);
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  // DELETE /api/recipes/:slug/rating - Delete user's rating
  if (req.method === 'DELETE' && req.url?.match(/^\/api\/recipes\/[^/]+\/rating$/)) {
    const user = authenticateRequest(req);

    if (!user) {
      jsonResponse(res, 401, { error: 'Bitte zuerst anmelden.' });
      return;
    }

    try {
      const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
      const slug = requestUrl.pathname.split('/')[3];
      const recipe = findViewableRecipe(slug, user);

      if (!recipe) {
        jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
        return;
      }

      const recipeRatings = ratingsStore.get(recipe.id);
      if (!recipeRatings || !recipeRatings.has(user.id)) {
        jsonResponse(res, 404, { error: 'Keine Bewertung gefunden.' });
        return;
      }

      recipeRatings.delete(user.id);
      persist();
      jsonResponse(res, 204, null);
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  // POST /api/recipes/:idOrSlug/duplicate - Copy a recipe as an own variant
  // ("Variante anlegen"): same content, new owner, fresh ratings/notes.
  if (req.method === 'POST' && req.url?.match(/^\/api\/recipes\/[^/]+\/duplicate$/)) {
    const user = authenticateRequest(req);
    if (!user) {
      jsonResponse(res, 401, { error: 'Bitte zuerst anmelden.' });
      return;
    }
    if (!hasMinRole(user, 'MEMBER')) {
      jsonResponse(res, 403, { error: 'Nur Mitglieder können Rezepte duplizieren.' });
      return;
    }

    const recipe = findViewableRecipe(decodeURIComponent(req.url.split('/')[3]), user);
    if (!recipe) {
      jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
      return;
    }

    const now = new Date().toISOString();
    const title = `${recipe.title} (Variante)`;
    const copy: Recipe = {
      ...(JSON.parse(JSON.stringify(recipe)) as Recipe),
      id: `r_${randomBytes(8).toString('hex')}`,
      title,
      status: 'PUBLISHED',
      createdBy: { id: user.id, name: user.name },
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      notes: '',
    };
    copy.slug = uniqueSlug(title, copy.id);

    recipeStore.unshift(copy);
    persist();
    jsonResponse(res, 201, sanitizeRecipe(copy, user));
    return;
  }

  // ============================================================================
  // Favorite Endpoints
  // ============================================================================

  // PUT/DELETE /api/recipes/:slug/favorite - Mark or unmark a personal favorite
  if ((req.method === 'PUT' || req.method === 'DELETE') && req.url?.match(/^\/api\/recipes\/[^/]+\/favorite$/)) {
    const user = authenticateRequest(req);
    if (!user) {
      jsonResponse(res, 401, { error: 'Bitte zuerst anmelden.' });
      return;
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    const recipe = findViewableRecipe(requestUrl.pathname.split('/')[3], user);
    if (!recipe) {
      jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
      return;
    }

    let userFavorites = favoritesStore.get(user.id);
    if (!userFavorites) {
      userFavorites = new Set();
      favoritesStore.set(user.id, userFavorites);
    }

    if (req.method === 'PUT') {
      userFavorites.add(recipe.id);
    } else {
      userFavorites.delete(recipe.id);
    }

    persist();
    jsonResponse(res, 200, sanitizeRecipe(recipe, user));
    return;
  }

  // PATCH /api/recipes/:slug/notes - Update the shared family notes.
  // Deliberately open to every signed-in member (not just the owner):
  // "beim nächsten Mal weniger Salz" is family knowledge.
  if (req.method === 'PATCH' && req.url?.match(/^\/api\/recipes\/[^/]+\/notes$/)) {
    const user = authenticateRequest(req);
    if (!user) {
      jsonResponse(res, 401, { error: 'Bitte zuerst anmelden.' });
      return;
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    const recipe = findViewableRecipe(requestUrl.pathname.split('/')[3], user);
    if (!recipe) {
      jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
      return;
    }

    try {
      const { notes } = await parseJsonBody(req);
      recipe.notes = String(notes ?? '').slice(0, 2000);
      recipe.updatedAt = new Date().toISOString();
      persist();
      jsonResponse(res, 200, sanitizeRecipe(recipe, user));
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  // ============================================================================
  // Category Endpoints
  // ============================================================================

  // GET /api/categories - Get all categories
  if (req.method === 'GET' && req.url === '/api/categories') {
    jsonResponse(res, 200, categoriesStore);
    return;
  }

  // POST /api/categories - Create category (admin only)
  if (req.method === 'POST' && req.url === '/api/categories') {
    const user = authenticateRequest(req);

    if (!user || user.role !== 'ADMIN') {
      jsonResponse(res, 403, { error: 'Nur Admins können Kategorien erstellen.' });
      return;
    }

    try {
      const { name, description, icon } = await parseJsonBody(req);

      if (!name) {
        jsonResponse(res, 400, { error: 'Name ist erforderlich.' });
        return;
      }

      const slug = String(name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      // Check if category already exists
      if (categoriesStore.some((cat) => cat.slug === slug)) {
        jsonResponse(res, 409, { error: 'Kategorie existiert bereits.' });
        return;
      }

      const newCategory: Category = {
        id: `cat_${randomBytes(8).toString('hex')}`,
        name: String(name).trim(),
        slug,
        description: description || null,
        icon: icon || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      categoriesStore.push(newCategory);
      persist();
      jsonResponse(res, 201, newCategory);
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  // PATCH /api/categories/:id - Update category (admin only)
  if (req.method === 'PATCH' && req.url?.match(/^\/api\/categories\/[^/]+$/)) {
    const user = authenticateRequest(req);

    if (!user || user.role !== 'ADMIN') {
      jsonResponse(res, 403, { error: 'Nur Admins können Kategorien bearbeiten.' });
      return;
    }

    try {
      const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
      const categoryId = requestUrl.pathname.split('/')[3];
      const categoryIndex = categoriesStore.findIndex((cat) => cat.id === categoryId);

      if (categoryIndex === -1) {
        jsonResponse(res, 404, { error: 'Kategorie nicht gefunden.' });
        return;
      }

      const { name, description, icon } = await parseJsonBody(req);
      const category = categoriesStore[categoryIndex];

      if (name) {
        category.name = String(name).trim();
        category.slug = String(name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
      if (description !== undefined) category.description = description || null;
      if (icon !== undefined) category.icon = icon || null;
      category.updatedAt = new Date().toISOString();

      persist();
      jsonResponse(res, 200, category);
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  // DELETE /api/categories/:id - Delete category (admin only)
  if (req.method === 'DELETE' && req.url?.match(/^\/api\/categories\/[^/]+$/)) {
    const user = authenticateRequest(req);

    if (!user || user.role !== 'ADMIN') {
      jsonResponse(res, 403, { error: 'Nur Admins können Kategorien löschen.' });
      return;
    }

    try {
      const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
      const categoryId = requestUrl.pathname.split('/')[3];
      const categoryIndex = categoriesStore.findIndex((cat) => cat.id === categoryId);

      if (categoryIndex === -1) {
        jsonResponse(res, 404, { error: 'Kategorie nicht gefunden.' });
        return;
      }

      categoriesStore.splice(categoryIndex, 1);
      persist();
      jsonResponse(res, 204, null);
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  // ============================================================================
  // Recipe mutation Endpoints (update / delete / publish / archive)
  // ============================================================================

  // PATCH /api/recipes/:id/publish
  if (req.method === 'PATCH' && req.url?.match(/^\/api\/recipes\/[^/]+\/publish$/)) {
    const user = authenticateRequest(req);
    if (!hasMinRole(user, 'EDITOR')) {
      jsonResponse(res, 403, { error: 'Nur Editoren oder Admins dürfen Rezepte veröffentlichen.' });
      return;
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    const recipe = findViewableRecipe(requestUrl.pathname.split('/')[3], user);
    if (!recipe) {
      jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
      return;
    }

    recipe.status = 'PUBLISHED';
    recipe.publishedAt = new Date().toISOString();
    recipe.updatedAt = new Date().toISOString();
    persist();
    jsonResponse(res, 200, sanitizeRecipe(recipe, user));
    return;
  }

  // PATCH /api/recipes/:id/archive
  if (req.method === 'PATCH' && req.url?.match(/^\/api\/recipes\/[^/]+\/archive$/)) {
    const user = authenticateRequest(req);
    if (!hasMinRole(user, 'EDITOR')) {
      jsonResponse(res, 403, { error: 'Nur Editoren oder Admins dürfen Rezepte archivieren.' });
      return;
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    const recipe = findViewableRecipe(requestUrl.pathname.split('/')[3], user);
    if (!recipe) {
      jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
      return;
    }

    recipe.status = 'ARCHIVED';
    recipe.updatedAt = new Date().toISOString();
    persist();
    jsonResponse(res, 200, sanitizeRecipe(recipe, user));
    return;
  }

  // PATCH /api/recipes/:id - Update a recipe (owner or editor/admin)
  if (req.method === 'PATCH' && req.url?.match(/^\/api\/recipes\/[^/]+$/)) {
    const user = authenticateRequest(req);
    if (!user) {
      jsonResponse(res, 401, { error: 'Bitte zuerst anmelden.' });
      return;
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    const recipe = findViewableRecipe(requestUrl.pathname.split('/')[3], user);
    if (!recipe) {
      jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
      return;
    }

    const isOwner = recipe.createdBy?.id && recipe.createdBy.id === user.id;
    if (!isOwner && !hasMinRole(user, 'EDITOR')) {
      jsonResponse(res, 403, { error: 'Keine Berechtigung, dieses Rezept zu bearbeiten.' });
      return;
    }

    try {
      const payload = await parseJsonBody(req);
      const validationError = validateRecipePayload(payload, { partial: true });
      if (validationError) {
        jsonResponse(res, 400, { error: validationError });
        return;
      }

      if (payload.title !== undefined) {
        recipe.title = String(payload.title).trim();
        recipe.slug = uniqueSlug(recipe.title, recipe.id);
      }
      if (payload.shortDescription !== undefined) recipe.shortDescription = String(payload.shortDescription).trim();
      if (payload.description !== undefined) recipe.description = String(payload.description ?? '').trim() || undefined;
      if (payload.category !== undefined) recipe.category = String(payload.category).trim();
      if (payload.tag !== undefined) recipe.tag = String(payload.tag ?? '').trim() || 'Neu';
      if (payload.difficulty !== undefined) recipe.difficulty = normalizeDifficulty(payload.difficulty);
      if (payload.servings !== undefined) recipe.servings = payload.servings;
      if (payload.preparationTime !== undefined) recipe.preparationTime = payload.preparationTime;
      if (payload.cookingTime !== undefined) recipe.cookingTime = payload.cookingTime;
      if (payload.img !== undefined) recipe.img = String(payload.img);
      if (payload.ingredients !== undefined) recipe.ingredients = Array.isArray(payload.ingredients) ? payload.ingredients : [];
      if (payload.steps !== undefined) recipe.steps = Array.isArray(payload.steps) ? payload.steps : [];
      if (payload.nutritionalValues !== undefined) recipe.nutritionalValues = payload.nutritionalValues ?? undefined;
      if (payload.status !== undefined && hasMinRole(user, 'EDITOR')) {
        recipe.status = String(payload.status).toUpperCase();
      }
      recipe.updatedAt = new Date().toISOString();

      persist();
      jsonResponse(res, 200, sanitizeRecipe(recipe, user));
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  // DELETE /api/recipes/:id - Delete a recipe (owner or admin)
  if (req.method === 'DELETE' && req.url?.match(/^\/api\/recipes\/[^/]+$/)) {
    const user = authenticateRequest(req);
    if (!user) {
      jsonResponse(res, 401, { error: 'Bitte zuerst anmelden.' });
      return;
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    const recipe = findViewableRecipe(requestUrl.pathname.split('/')[3], user);
    if (!recipe) {
      jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
      return;
    }

    const isOwner = recipe.createdBy?.id && recipe.createdBy.id === user.id;
    if (!isOwner && !hasMinRole(user, 'ADMIN')) {
      jsonResponse(res, 403, { error: 'Keine Berechtigung, dieses Rezept zu löschen.' });
      return;
    }

    const index = recipeStore.indexOf(recipe);
    if (index !== -1) {
      recipeStore.splice(index, 1);
    }
    ratingsStore.delete(recipe.id);
    for (const userFavorites of favoritesStore.values()) {
      userFavorites.delete(recipe.id);
    }
    persist();
    res.writeHead(204);
    res.end();
    return;
  }

  // ============================================================================
  // Week Plan Endpoints (one shared plan for the whole family)
  // ============================================================================

  const weekPlanRecipeSummary = (recipe: Recipe) => ({
    id: recipe.id,
    slug: recipe.slug ?? toSlug(recipe.title),
    title: recipe.title,
    img: recipe.img,
    servings: recipe.servings,
    category: recipe.category,
  });

  // GET /api/weekplan/bring - Public schema.org page with the aggregated
  // shopping list of every planned meal. Public like the per-recipe Bring
  // pages, because Bring's crawler fetches it unauthenticated.
  if (req.method === 'GET' && req.url?.startsWith('/api/weekplan/bring')) {
    const entries: PlannedMeal[] = [];
    for (const day of WEEK_DAYS) {
      for (const entry of weekPlanStore[day]) {
        const recipe = recipeStore.find((r) => r.id === entry.recipeId);
        if (recipe && isPublicRecipe(recipe)) {
          entries.push({ recipe, servings: entry.servings });
        }
      }
    }

    const ingredients = aggregateWeekPlanIngredients(entries);
    const html = renderBringHtml(
      { title: 'Chellys Kitchen – Wochenplan', servings: 1, ingredients },
      { servings: 1 },
    );
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (req.url === '/api/weekplan' || req.url?.startsWith('/api/weekplan/')) {
    const user = authenticateRequest(req);
    if (!user) {
      jsonResponse(res, 401, { error: 'Bitte zuerst anmelden.' });
      return;
    }
    if (!hasMinRole(user, 'MEMBER')) {
      jsonResponse(res, 403, { error: 'Nur Mitglieder können den Wochenplan nutzen.' });
      return;
    }

    // GET /api/weekplan - The full plan with recipe summaries. Entries whose
    // recipe was deleted are pruned on read.
    if (req.method === 'GET' && req.url === '/api/weekplan') {
      const days: Record<string, unknown[]> = {};
      for (const day of WEEK_DAYS) {
        weekPlanStore[day] = weekPlanStore[day].filter((entry) =>
          recipeStore.some((recipe) => recipe.id === entry.recipeId));
        days[day] = weekPlanStore[day]
          .map((entry) => ({ entry, recipe: recipeStore.find((r) => r.id === entry.recipeId) }))
          .filter((item): item is { entry: (typeof item)['entry']; recipe: Recipe } =>
            Boolean(item.recipe && canViewRecipe(item.recipe, user)))
          .map(({ entry, recipe }) => ({
            recipeId: entry.recipeId,
            servings: entry.servings ?? recipe.servings,
            recipe: weekPlanRecipeSummary(recipe),
          }));
      }
      jsonResponse(res, 200, { days });
      return;
    }

    // POST /api/weekplan/:day - Add a recipe to a day (upsert: re-adding the
    // same recipe updates the planned servings).
    if (req.method === 'POST' && req.url?.match(/^\/api\/weekplan\/[^/]+$/)) {
      try {
        const day = req.url.split('/')[3];
        if (!isWeekDay(day)) {
          jsonResponse(res, 400, { error: 'Unbekannter Wochentag.' });
          return;
        }

        const { recipeId, servings } = await parseJsonBody(req);
        const recipe = findViewableRecipe(String(recipeId ?? ''), user);
        if (!recipe) {
          jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
          return;
        }

        const parsedServings = Number(servings);
        const entry = {
          recipeId: recipe.id,
          servings: Number.isFinite(parsedServings) && parsedServings >= 1
            ? Math.round(parsedServings)
            : recipe.servings,
        };

        const existing = weekPlanStore[day].findIndex((e) => e.recipeId === recipe.id);
        if (existing >= 0) {
          weekPlanStore[day][existing] = entry;
        } else {
          weekPlanStore[day].push(entry);
        }

        persist();
        jsonResponse(res, 200, { day, ...entry });
        return;
      } catch (error) {
        jsonResponse(res, 400, { error: errorMessage(error) });
        return;
      }
    }

    // DELETE /api/weekplan/:day/:recipeId - Remove one planned meal
    if (req.method === 'DELETE' && req.url?.match(/^\/api\/weekplan\/[^/]+\/[^/]+$/)) {
      const [, , , day, recipeId] = req.url.split('/');
      if (!isWeekDay(day)) {
        jsonResponse(res, 400, { error: 'Unbekannter Wochentag.' });
        return;
      }
      const recipe = findViewableRecipe(decodeURIComponent(recipeId), user);
      if (!recipe) {
        jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
        return;
      }
      weekPlanStore[day] = weekPlanStore[day].filter((entry) => entry.recipeId !== recipe.id);
      persist();
      jsonResponse(res, 200, { ok: true });
      return;
    }

    // DELETE /api/weekplan - Clear the whole week
    if (req.method === 'DELETE' && req.url === '/api/weekplan') {
      for (const day of WEEK_DAYS) {
        weekPlanStore[day] = hasMinRole(user, 'EDITOR')
          ? []
          : weekPlanStore[day].filter((entry) => {
            const recipe = recipeStore.find((candidate) => candidate.id === entry.recipeId);
            return recipe && !canViewRecipe(recipe, user);
          });
      }
      persist();
      jsonResponse(res, 200, { ok: true });
      return;
    }
  }

  // ============================================================================
  // Recipe Import (from external websites via schema.org JSON-LD, or from a
  // photo via the Google Gemini API)
  // ============================================================================

  // POST /api/recipes/import/photo - Extract a recipe from an uploaded photo
  // (cookbook page, handwritten note). Nothing is saved; the result prefills
  // the create form. The Gemini API is configured via GEMINI_API_KEY.
  if (req.method === 'POST' && req.url === '/api/recipes/import/photo') {
    const user = authenticateRequest(req);
    if (!user) {
      jsonResponse(res, 401, { error: 'Bitte zuerst anmelden.' });
      return;
    }
    if (!hasMinRole(user, 'MEMBER')) {
      jsonResponse(res, 403, { error: 'Nur Mitglieder können Rezepte importieren.' });
      return;
    }
    if (!isPhotoImportConfigured()) {
      jsonResponse(res, 503, {
        error: 'Der Foto-Import ist auf diesem Server nicht eingerichtet (GEMINI_API_KEY fehlt).',
      });
      return;
    }

    let image: ValidatedImageUpload;
    try {
      const payload = await parseJsonBody(req, Math.ceil(MAX_UPLOAD_BYTES * 1.4) + 1024);
      image = validateImageUpload(payload);
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }

    let recipe: ImportedRecipe | null;
    try {
      recipe = await extractRecipeFromPhoto({
        mediaType: contentTypeForExt(image.ext),
        base64Data: image.buffer.toString('base64'),
      });
    } catch {
      jsonResponse(res, 502, { error: 'Die Bilderkennung ist gerade nicht erreichbar. Bitte später erneut versuchen.' });
      return;
    }
    if (!recipe) {
      jsonResponse(res, 422, { error: 'Auf dem Foto wurde kein Rezept erkannt.' });
      return;
    }
    jsonResponse(res, 200, { recipe, source: 'photo' });
    return;
  }

  // POST /api/recipes/import - Fetch a page server-side and map its
  // schema.org recipe onto our form shape. Nothing is saved; the result
  // prefills the create form.
  if (req.method === 'POST' && req.url === '/api/recipes/import') {
    const user = authenticateRequest(req);
    if (!user) {
      jsonResponse(res, 401, { error: 'Bitte zuerst anmelden.' });
      return;
    }
    if (!hasMinRole(user, 'MEMBER')) {
      jsonResponse(res, 403, { error: 'Nur Mitglieder können Rezepte importieren.' });
      return;
    }

    try {
      const { url } = await parseJsonBody(req);
      if (typeof url !== 'string' || !isAllowedImportUrl(url)) {
        jsonResponse(res, 400, { error: 'Bitte gib eine gültige öffentliche Rezept-URL an.' });
        return;
      }

      let response: Response;
      try {
        response = await fetch(url, {
          signal: AbortSignal.timeout(10_000),
          headers: { 'User-Agent': 'ChellysKitchen-RecipeImport/1.0' },
        });
      } catch {
        jsonResponse(res, 422, { error: 'Die Seite konnte nicht geladen werden.' });
        return;
      }
      if (!response.ok) {
        jsonResponse(res, 422, { error: `Die Seite konnte nicht geladen werden (HTTP ${response.status}).` });
        return;
      }

      // Recipe pages are a few hundred KB; anything beyond a few MB is not
      // a page we want to buffer.
      const html = (await response.text()).slice(0, 3_000_000);
      // Prefer structured JSON-LD; fall back to plain HTML parsing
      // (microdata or Zutaten/Zubereitung headings) for pages without it.
      const jsonLd = extractRecipeJsonLd(html);
      const extracted = jsonLd ? mapJsonLdToRecipe(jsonLd) : extractRecipeFromHtml(html);
      if (!extracted) {
        jsonResponse(res, 422, { error: 'Auf dieser Seite wurde kein Rezept gefunden.' });
        return;
      }

      // Foreign-language recipes are translated to German via Gemini
      // (best-effort: without GEMINI_API_KEY or on failure the recipe
      // stays in its original language).
      const { recipe, translated } = await translateImportedRecipe(extracted);
      jsonResponse(res, 200, { recipe, source: url, translated });
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  // ============================================================================
  // Admin Endpoints
  // ============================================================================

  // GET /api/admin/users - List all users (admin only)
  if (req.method === 'GET' && req.url === '/api/admin/users') {
    const user = authenticateRequest(req);
    if (!hasMinRole(user, 'ADMIN')) {
      jsonResponse(res, 403, { error: 'Nur Admins haben Zugriff.' });
      return;
    }

    const recipeCountsByUserId = new Map<string, number>();
    for (const recipe of recipeStore) {
      const ownerId = recipe.createdBy?.id;
      if (!ownerId) continue;
      recipeCountsByUserId.set(ownerId, (recipeCountsByUserId.get(ownerId) ?? 0) + 1);
    }

    const data = Array.from(users.values()).map((entry) => ({
      ...sanitizeUser(entry),
      _count: { recipesCreated: recipeCountsByUserId.get(entry.id) ?? 0 },
    }));
    jsonResponse(res, 200, { data, total: data.length });
    return;
  }

  // POST /api/admin/users - Create a user (admin only). There is no public
  // registration; accounts exist only via this endpoint or the SEED_USERS /
  // ADMIN_USERNAME environment variables.
  if (req.method === 'POST' && req.url === '/api/admin/users') {
    const actingUser = authenticateRequest(req);
    if (!hasMinRole(actingUser, 'ADMIN')) {
      jsonResponse(res, 403, { error: 'Nur Admins haben Zugriff.' });
      return;
    }

    try {
      const { name, username, email, password, role } = await parseJsonBody(req);
      // `email` stays accepted as a legacy alias for `username`.
      const rawUsername = username ?? email;

      if (!name || !rawUsername || !password) {
        jsonResponse(res, 400, { error: 'Name, Benutzername und Passwort sind erforderlich.' });
        return;
      }

      const resolvedRole = role ?? 'MEMBER';
      if (!VALID_ROLES.includes(resolvedRole)) {
        jsonResponse(res, 400, { error: 'Ungültige Rolle.' });
        return;
      }

      const normalizedUsername = String(rawUsername).trim().toLowerCase();
      if (users.has(normalizedUsername)) {
        jsonResponse(res, 409, { error: 'Benutzername ist bereits vergeben.' });
        return;
      }

      const credential = hashPassword(String(password));
      const now = new Date().toISOString();
      const user: User = {
        id: `user_${randomBytes(8).toString('hex')}`,
        name: String(name).trim(),
        username: normalizedUsername,
        role: resolvedRole,
        passwordHash: credential.hash,
        salt: credential.salt,
        algo: credential.algo,
        createdAt: now,
        updatedAt: now,
      };

      users.set(normalizedUsername, user);
      persist();
      jsonResponse(res, 201, sanitizeUser(user));
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  // PATCH /api/admin/users/:id/role - Update a user's role (admin only)
  if (req.method === 'PATCH' && req.url?.match(/^\/api\/admin\/users\/[^/]+\/role$/)) {
    const actingUser = authenticateRequest(req);
    if (!hasMinRole(actingUser, 'ADMIN')) {
      jsonResponse(res, 403, { error: 'Nur Admins haben Zugriff.' });
      return;
    }

    try {
      const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
      const targetId = requestUrl.pathname.split('/')[4];
      const targetUser = findUserById(targetId);
      if (!targetUser) {
        jsonResponse(res, 404, { error: 'Benutzer nicht gefunden.' });
        return;
      }

      const { role } = await parseJsonBody(req);
      if (!VALID_ROLES.includes(role)) {
        jsonResponse(res, 400, { error: 'Ungültige Rolle.' });
        return;
      }

      // Prevent an admin from removing the last remaining admin (e.g. themselves).
      if (targetUser.role === 'ADMIN' && role !== 'ADMIN') {
        const adminCount = Array.from(users.values()).filter((u) => u.role === 'ADMIN').length;
        if (adminCount <= 1) {
          jsonResponse(res, 400, { error: 'Der letzte Admin kann nicht herabgestuft werden.' });
          return;
        }
      }

      targetUser.role = role;
      targetUser.updatedAt = new Date().toISOString();
      persist();
      jsonResponse(res, 200, sanitizeUser(targetUser));
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  // PATCH /api/admin/users/:id/name - Update a user's displayed name (admin only)
  if (req.method === 'PATCH' && req.url?.match(/^\/api\/admin\/users\/[^/]+\/name$/)) {
    const actingUser = authenticateRequest(req);
    if (!hasMinRole(actingUser, 'ADMIN')) {
      jsonResponse(res, 403, { error: 'Nur Admins haben Zugriff.' });
      return;
    }

    try {
      const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
      const targetId = requestUrl.pathname.split('/')[4];
      const targetUser = findUserById(targetId);
      if (!targetUser) {
        jsonResponse(res, 404, { error: 'Benutzer nicht gefunden.' });
        return;
      }

      const { name } = await parseJsonBody(req);
      const normalizedName = String(name ?? '').trim();
      if (!normalizedName || normalizedName.length > 100) {
        jsonResponse(res, 400, { error: 'Der Name muss zwischen 1 und 100 Zeichen lang sein.' });
        return;
      }

      targetUser.name = normalizedName;
      targetUser.updatedAt = new Date().toISOString();
      persist();
      jsonResponse(res, 200, sanitizeUser(targetUser));
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  // GET /api/admin/recipes - List all recipes incl. drafts/archived (admin only)
  if (req.method === 'GET' && req.url === '/api/admin/recipes') {
    const user = authenticateRequest(req);
    if (!hasMinRole(user, 'ADMIN')) {
      jsonResponse(res, 403, { error: 'Nur Admins haben Zugriff.' });
      return;
    }

    const data = recipeStore.map((recipe) => sanitizeRecipe(recipe, user));
    jsonResponse(res, 200, { data, total: data.length });
    return;
  }

  // POST /api/admin/recipes/import/photos - Start a batch photo import
  // (admin only). Every photo is validated up front; the batch then runs in
  // the background and its progress is polled via the GET endpoints below.
  if (req.method === 'POST' && req.url === '/api/admin/recipes/import/photos') {
    const user = authenticateRequest(req);
    if (!hasMinRole(user, 'ADMIN')) {
      jsonResponse(res, 403, { error: 'Nur Admins können den Batch-Import starten.' });
      return;
    }
    if (!isPhotoImportConfigured()) {
      jsonResponse(res, 503, {
        error: 'Der Foto-Import ist auf diesem Server nicht eingerichtet (GEMINI_API_KEY fehlt).',
      });
      return;
    }
    if (batchPhotoImportJobs.hasRunningJob()) {
      jsonResponse(res, 409, { error: 'Es läuft bereits ein Batch-Import. Bitte warte, bis er abgeschlossen ist.' });
      return;
    }

    let photos: BatchPhoto[];
    try {
      // Base64 inflates each image by ~1/3; allow a full batch of max-size photos.
      const payload = await parseJsonBody(req, MAX_BATCH_PHOTOS * Math.ceil(MAX_UPLOAD_BYTES * 1.4) + 64 * 1024);
      const rawPhotos = Array.isArray(payload?.photos) ? payload.photos : [];
      if (rawPhotos.length === 0) {
        jsonResponse(res, 400, { error: 'Bitte übergib mindestens ein Foto.' });
        return;
      }
      if (rawPhotos.length > MAX_BATCH_PHOTOS) {
        jsonResponse(res, 400, { error: `Maximal ${MAX_BATCH_PHOTOS} Fotos pro Batch.` });
        return;
      }
      photos = rawPhotos.map((entry: any, index: number) => {
        try {
          const image = validateImageUpload(entry);
          return {
            fileName: String(entry?.filename ?? '').trim() || `Foto ${index + 1}`,
            ext: image.ext,
            mime: image.mime,
            buffer: image.buffer,
          };
        } catch (error) {
          throw new Error(`Foto ${index + 1}: ${errorMessage(error)}`);
        }
      });
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }

    const proto = (req.headers['x-forwarded-proto'] || 'http').toString().split(',')[0].trim();
    const host = req.headers.host ?? `localhost:${port}`;
    const job = batchPhotoImportJobs.startJob({
      photos,
      createdBy: { id: user.id, name: user.name },
      context: {
        createdBy: { id: user.id, name: user.name },
        baseUrl: `${proto}://${host}`,
      },
    });
    jsonResponse(res, 202, { job });
    return;
  }

  // GET /api/admin/recipes/import/photos - List batch import jobs (admin only)
  if (req.method === 'GET' && req.url === '/api/admin/recipes/import/photos') {
    const user = authenticateRequest(req);
    if (!hasMinRole(user, 'ADMIN')) {
      jsonResponse(res, 403, { error: 'Nur Admins haben Zugriff.' });
      return;
    }
    const data = batchPhotoImportJobs.listJobs();
    jsonResponse(res, 200, { data, total: data.length });
    return;
  }

  // GET /api/admin/recipes/import/photos/:id - Progress of one batch job (admin only)
  if (req.method === 'GET' && req.url?.match(/^\/api\/admin\/recipes\/import\/photos\/[^/]+$/)) {
    const user = authenticateRequest(req);
    if (!hasMinRole(user, 'ADMIN')) {
      jsonResponse(res, 403, { error: 'Nur Admins haben Zugriff.' });
      return;
    }
    const jobId = decodeURIComponent(req.url.split('/')[6]);
    const job = batchPhotoImportJobs.getJob(jobId);
    if (!job) {
      jsonResponse(res, 404, { error: 'Batch-Import nicht gefunden.' });
      return;
    }
    jsonResponse(res, 200, { job });
    return;
  }

  // GET /api/admin/export - Download a full backup incl. uploaded images (admin only).
  // The Render free tier wipes DATA_DIR on every redeploy; this backup plus
  // the import endpoint below is how data survives a redeploy.
  if (req.method === 'GET' && req.url === '/api/admin/export') {
    const user = authenticateRequest(req);
    if (!hasMinRole(user, 'ADMIN')) {
      jsonResponse(res, 403, { error: 'Nur Admins haben Zugriff.' });
      return;
    }

    const uploads: BackupUploadEntry[] = [];
    try {
      for (const fileName of readdirSync(UPLOADS_DIR)) {
        try {
          uploads.push({ fileName, data: readFileSync(join(UPLOADS_DIR, fileName)).toString('base64') });
        } catch {
          // Skip unreadable files rather than failing the whole backup.
        }
      }
    } catch {
      // Missing uploads dir: export without images.
    }

    const payload = createExportPayload(
      { users, sessions, refreshSessions, recipeStore, ratingsStore, categoriesStore, favoritesStore },
      uploads,
    );
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="chellys-kitchen-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    });
    res.end(JSON.stringify(payload));
    return;
  }

  // POST /api/admin/import - Restore a previously exported backup (admin only).
  // Replaces recipes, users, ratings and categories; the acting admin's own
  // account is always kept so the session importing the backup stays valid.
  if (req.method === 'POST' && req.url === '/api/admin/import') {
    const actingUser = authenticateRequest(req);
    if (!hasMinRole(actingUser, 'ADMIN')) {
      jsonResponse(res, 403, { error: 'Nur Admins haben Zugriff.' });
      return;
    }

    try {
      // Backups embed images as base64, so allow far more than the 1 MB
      // default body limit (images are capped at 5 MB each on upload).
      const payload = await parseJsonBody(req, 200 * 1024 * 1024);
      const imported = parseImportPayload(payload);

      users.clear();
      for (const [username, user] of imported.users) {
        users.set(username, user);
      }
      // Keep the acting admin exactly as-is (id, role, password), even if the
      // backup contains an older record for the same username — otherwise the
      // admin could lock themselves out mid-import.
      users.set(actingUser.username, actingUser);

      recipeStore.splice(0, recipeStore.length, ...imported.recipeStore);

      ratingsStore.clear();
      for (const [recipeId, userRatings] of imported.ratingsStore) {
        ratingsStore.set(recipeId, userRatings);
      }

      categoriesStore.splice(0, categoriesStore.length, ...imported.categoriesStore);

      favoritesStore.clear();
      for (const [userId, recipeIds] of imported.favoritesStore) {
        favoritesStore.set(userId, recipeIds);
      }

      for (const day of WEEK_DAYS) {
        weekPlanStore[day] = imported.weekPlanStore?.[day] ?? [];
      }

      for (const upload of imported.uploads) {
        writeFileSync(join(UPLOADS_DIR, upload.fileName), upload.buffer);
        if (store.saveUpload) {
          await store.saveUpload(upload.fileName, upload.buffer);
        }
      }

      persist();
      jsonResponse(res, 200, {
        recipes: recipeStore.length,
        users: users.size,
        categories: categoriesStore.length,
        uploads: imported.uploads.length,
      });
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  // ============================================================================
  // Image upload Endpoints
  // ============================================================================

  // POST /api/uploads - Upload a base64-encoded image (authenticated)
  if (req.method === 'POST' && req.url === '/api/uploads') {
    const user = authenticateRequest(req);
    if (!user) {
      jsonResponse(res, 401, { error: 'Bitte zuerst anmelden.' });
      return;
    }

    try {
      const payload = await parseJsonBody(req, Math.ceil(MAX_UPLOAD_BYTES * 1.4) + 1024);
      const { ext, buffer } = validateImageUpload(payload);
      const fileName = `${randomBytes(12).toString('hex')}.${ext}`;
      writeFileSync(join(UPLOADS_DIR, fileName), buffer);
      if (store.saveUpload) {
        await store.saveUpload(fileName, buffer);
      }

      const proto = (req.headers['x-forwarded-proto'] || 'http').toString().split(',')[0].trim();
      const host = req.headers.host ?? `localhost:${port}`;
      jsonResponse(res, 201, { url: `${proto}://${host}/uploads/${fileName}` });
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: errorMessage(error) });
      return;
    }
  }

  // GET /uploads/:file - Serve an uploaded image
  if (req.method === 'GET' && req.url?.startsWith('/uploads/')) {
    const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    const fileName = basename(decodeURIComponent(requestUrl.pathname.replace('/uploads/', '')));
    const filePath = join(UPLOADS_DIR, fileName);

    // basename() strips any path traversal; double-check the resolved path.
    if (!fileName || !filePath.startsWith(UPLOADS_DIR) || !existsSync(filePath)) {
      jsonResponse(res, 404, { error: 'Datei nicht gefunden.' });
      return;
    }

    const ext = fileName.split('.').pop();
    res.writeHead(200, {
      'Content-Type': contentTypeForExt(ext),
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    createReadStream(filePath).pipe(res);
    return;
  }

  jsonResponse(res, 404, { error: 'Not Found' });
});

export { server };

// Nur beim Direktstart lauschen — Integrationstests importieren den Server
// und binden ihn selbst an einen freien Port.
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  server.listen(port, () => {
    console.log(`Chellys Kitchen API listening on http://localhost:${port}`);
  });
}

function shutdown() {
  // flush() may be async (Postgres store) — wait for the final write before
  // the process exits.
  Promise.resolve()
    .then(() => persister.flush())
    .catch(() => {})
    .finally(() => server.close(() => process.exit(0)));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
