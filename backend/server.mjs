import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { recipes } from './data/recipes.mjs';
import { queryRecipes } from './src/queryRecipes.mjs';
import { pickRandomRecipe } from './src/randomRecipe.mjs';
import { createExportPayload, parseImportPayload } from './src/backup.mjs';
import { resolveCorsOrigin } from './src/cors.mjs';
import {
  createDebouncedPersister,
  createStore,
} from './src/persistence.mjs';
import {
  contentTypeForExt,
  MAX_UPLOAD_BYTES,
  validateImageUpload,
} from './src/uploads.mjs';

const port = Number(process.env.PORT ?? 4000);
const allowedOrigin = process.env.CORS_ORIGIN;

const DATA_DIR = process.env.DATA_DIR ?? './.data';
const UPLOADS_DIR = resolve(DATA_DIR, 'uploads');
const store = createStore(resolve(DATA_DIR, 'store.json'));

const DEFAULT_CATEGORIES = [
  { id: 'cat_1', name: 'Cooking', slug: 'cooking', description: 'Hauptgerichte und Kochrezepte', icon: '🍳' },
  { id: 'cat_2', name: 'Baking', slug: 'baking', description: 'Backwaren und Desserts', icon: '🧁' },
  { id: 'cat_3', name: 'Barbeque', slug: 'barbeque', description: 'Grillen und BBQ', icon: '🍖' },
  { id: 'cat_4', name: 'Salads', slug: 'salads', description: 'Frische Salate', icon: '🥗' },
  { id: 'cat_5', name: 'Soups', slug: 'soups', description: 'Suppen und Eintöpfe', icon: '🍲' },
  { id: 'cat_6', name: 'Desserts', slug: 'desserts', description: 'Süße Desserts', icon: '🍰' },
];

// Hydrate state from disk (survives restarts); fall back to seed data on
// first run or an unreadable store file.
const loadedState = store.load();
const users = loadedState?.users ?? new Map();
const sessions = loadedState?.sessions ?? new Map();
const refreshSessions = loadedState?.refreshSessions ?? new Map();
const recipeStore = loadedState?.recipeStore ?? [...recipes];
const ratingsStore = loadedState?.ratingsStore ?? new Map(); // recipeId -> Map<userId, rating>
const categoriesStore = loadedState?.categoriesStore ?? [...DEFAULT_CATEGORIES];

const persister = createDebouncedPersister(
  store,
  () => ({ users, sessions, refreshSessions, recipeStore, ratingsStore, categoriesStore }),
  200,
);
const persist = () => persister.schedule();

const ROLE_RANK = { GUEST: 0, MEMBER: 1, EDITOR: 2, ADMIN: 3 };
const VALID_ROLES = Object.keys(ROLE_RANK);

function hasMinRole(user, role) {
  return !!user && (ROLE_RANK[user.role] ?? -1) >= (ROLE_RANK[role] ?? Infinity);
}

function findRecipeByIdOrSlug(idOrSlug) {
  return recipeStore.find(
    (entry) => entry.id === idOrSlug || (entry.slug ?? toSlug(entry.title)) === idOrSlug,
  ) ?? null;
}

function uniqueSlug(title, currentId) {
  const base = toSlug(title) || `rezept-${randomBytes(4).toString('hex')}`;
  let candidate = base;
  let counter = 2;
  while (recipeStore.some((entry) => entry.id !== currentId && (entry.slug ?? toSlug(entry.title)) === candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

function jsonResponse(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function withCors(req, res) {
  const requestOrigin = req.headers.origin;
  const origin = resolveCorsOrigin({ requestOrigin, allowedOrigin });

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  // `Allow-Credentials: true` is invalid together with a wildcard origin;
  // only send it when we echo a concrete origin.
  if (origin !== '*') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

function hashPassword(password, salt) {
  return createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

function verifyPassword(password, salt, hash) {
  const calculatedHash = hashPassword(password, salt);
  return timingSafeEqual(Buffer.from(calculatedHash), Buffer.from(hash));
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toSlug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeDifficulty(value) {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (normalized === 'einfach') return 'EINFACH';
  if (normalized === 'mittel') return 'MITTEL';
  if (normalized === 'schwer') return 'SCHWER';

  return ['EINFACH', 'MITTEL', 'SCHWER'].includes(value) ? value : 'MITTEL';
}

function createSession(user) {
  const accessToken = randomBytes(24).toString('hex');
  const refreshToken = randomBytes(24).toString('hex');
  sessions.set(accessToken, user.id);
  refreshSessions.set(refreshToken, user.id);

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  };
}

function sanitizeRecipe(recipe) {
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
  };
}

async function parseJsonBody(req, maxBytes = 1024 * 1024) {
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

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length).trim();
}

function findUserById(userId) {
  return Array.from(users.values()).find((entry) => entry.id === userId) ?? null;
}

function authenticateRequest(req) {
  const token = getBearerToken(req);

  if (!token || !sessions.has(token)) {
    return null;
  }

  const userId = sessions.get(token);
  return findUserById(userId);
}

function seedUser({ name, email, role, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  if (users.has(normalizedEmail)) {
    return;
  }
  const salt = randomBytes(16).toString('hex');
  const now = new Date().toISOString();
  users.set(normalizedEmail, {
    id: `user_${randomBytes(8).toString('hex')}`,
    name,
    email: normalizedEmail,
    role,
    passwordHash: hashPassword(password, salt),
    salt,
    createdAt: now,
    updatedAt: now,
  });
}

function seedDefaultUsers() {
  seedUser({
    name: 'Demo User',
    email: 'demo@chellys-kitchen.local',
    role: 'MEMBER',
    password: 'demo1234',
  });
  // An admin account is required to reach the admin dashboard. Configurable
  // via ADMIN_EMAIL / ADMIN_PASSWORD; falls back to a local default.
  seedUser({
    name: 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@chellys-kitchen.local',
    role: 'ADMIN',
    password: process.env.ADMIN_PASSWORD || 'admin1234',
  });
}

mkdirSync(UPLOADS_DIR, { recursive: true });
seedDefaultUsers();
persist();

const server = createServer(async (req, res) => {
  withCors(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    jsonResponse(res, 200, {
      status: 'ok',
      database: 'in-memory',
      timestamp: new Date().toISOString(),
    });
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
      const result = queryRecipes(recipeStore.map((recipe) => sanitizeRecipe(recipe)), query);
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
        recipeStore.map((recipe) => sanitizeRecipe(recipe)),
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

      jsonResponse(res, 200, sanitizeRecipe(recipe));
      return;
    }
  }

  if (req.method === 'POST' && req.url === '/api/auth/register') {
    try {
      const { name, email, password } = await parseJsonBody(req);

      if (!name || !email || !password) {
        jsonResponse(res, 400, { error: 'Name, E-Mail und Passwort sind erforderlich.' });
        return;
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      if (users.has(normalizedEmail)) {
        jsonResponse(res, 409, { error: 'E-Mail ist bereits registriert.' });
        return;
      }

      const salt = randomBytes(16).toString('hex');
      const now = new Date().toISOString();
      const user = {
        id: `user_${randomBytes(8).toString('hex')}`,
        name: String(name).trim(),
        email: normalizedEmail,
        role: 'MEMBER',
        passwordHash: hashPassword(String(password), salt),
        salt,
        createdAt: now,
        updatedAt: now,
      };

      users.set(normalizedEmail, user);
      const session = createSession(user);
      persist();
      jsonResponse(res, 201, session);
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: error.message });
      return;
    }
  }

  if (req.method === 'POST' && req.url === '/api/auth/login') {
    try {
      const { email, password } = await parseJsonBody(req);
      const normalizedEmail = String(email ?? '').trim().toLowerCase();
      const user = users.get(normalizedEmail);

      if (!user || !verifyPassword(String(password ?? ''), user.salt, user.passwordHash)) {
        jsonResponse(res, 401, { error: 'Ungültige Anmeldedaten.' });
        return;
      }

      const session = createSession(user);
      persist();
      jsonResponse(res, 200, session);
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: error.message });
      return;
    }
  }

  if (req.method === 'POST' && req.url === '/api/auth/refresh') {
    try {
      const { refreshToken } = await parseJsonBody(req);
      const userId = refreshSessions.get(String(refreshToken ?? ''));
      const user = userId ? findUserById(userId) : null;

      if (!user) {
        jsonResponse(res, 401, { error: 'Ungültiger Refresh Token.' });
        return;
      }

      const session = createSession(user);
      persist();
      jsonResponse(res, 200, session);
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: error.message });
      return;
    }
  }

  if (req.method === 'POST' && req.url === '/api/auth/logout') {
    const token = getBearerToken(req);

    if (token) {
      sessions.delete(token);
      persist();
    }

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

      if (!title || !shortDescription || !category) {
        jsonResponse(res, 400, { error: 'Titel, Beschreibung und Kategorie sind erforderlich.' });
        return;
      }

      const newRecipe = {
        id: `r_${randomBytes(8).toString('hex')}`,
        slug: uniqueSlug(title),
        title: String(title).trim(),
        shortDescription: String(shortDescription).trim(),
        description: String(payload.description ?? '').trim() || undefined,
        category: String(category).trim(),
        tag: String(tag ?? 'Neu').trim() || 'Neu',
        difficulty: normalizeDifficulty(difficulty),
        servings: Number(servings ?? 2),
        preparationTime: Number(preparationTime ?? 10),
        cookingTime: Number(cookingTime ?? 20),
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
      jsonResponse(res, 201, sanitizeRecipe(newRecipe));
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: error.message });
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
      const recipe = recipeStore.find((entry) => entry.id === slug || entry.slug === slug);

      if (!recipe) {
        jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
        return;
      }

      const { stars } = await parseJsonBody(req);

      if (!stars || stars < 1 || stars > 5) {
        jsonResponse(res, 400, { error: 'Sternebewertung muss zwischen 1 und 5 liegen.' });
        return;
      }

      // Store or update rating
      if (!ratingsStore.has(recipe.id)) {
        ratingsStore.set(recipe.id, new Map());
      }

      const recipeRatings = ratingsStore.get(recipe.id);
      recipeRatings.set(user.id, {
        id: `rating_${randomBytes(8).toString('hex')}`,
        userId: user.id,
        recipeId: recipe.id,
        stars: Number(stars),
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
      jsonResponse(res, 400, { error: error.message });
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
      const recipe = recipeStore.find((entry) => entry.id === slug || entry.slug === slug);

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
      jsonResponse(res, 400, { error: error.message });
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
      const recipe = recipeStore.find((entry) => entry.id === slug || entry.slug === slug);

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
      jsonResponse(res, 400, { error: error.message });
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

      const newCategory = {
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
      jsonResponse(res, 400, { error: error.message });
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
      jsonResponse(res, 400, { error: error.message });
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
      jsonResponse(res, 400, { error: error.message });
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
    const recipe = findRecipeByIdOrSlug(requestUrl.pathname.split('/')[3]);
    if (!recipe) {
      jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
      return;
    }

    recipe.status = 'PUBLISHED';
    recipe.publishedAt = new Date().toISOString();
    recipe.updatedAt = new Date().toISOString();
    persist();
    jsonResponse(res, 200, sanitizeRecipe(recipe));
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
    const recipe = findRecipeByIdOrSlug(requestUrl.pathname.split('/')[3]);
    if (!recipe) {
      jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
      return;
    }

    recipe.status = 'ARCHIVED';
    recipe.updatedAt = new Date().toISOString();
    persist();
    jsonResponse(res, 200, sanitizeRecipe(recipe));
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
    const recipe = findRecipeByIdOrSlug(requestUrl.pathname.split('/')[3]);
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

      if (payload.title !== undefined) {
        recipe.title = String(payload.title).trim();
        recipe.slug = uniqueSlug(recipe.title, recipe.id);
      }
      if (payload.shortDescription !== undefined) recipe.shortDescription = String(payload.shortDescription).trim();
      if (payload.description !== undefined) recipe.description = String(payload.description ?? '').trim() || undefined;
      if (payload.category !== undefined) recipe.category = String(payload.category).trim();
      if (payload.tag !== undefined) recipe.tag = String(payload.tag ?? '').trim() || 'Neu';
      if (payload.difficulty !== undefined) recipe.difficulty = normalizeDifficulty(payload.difficulty);
      if (payload.servings !== undefined) recipe.servings = Number(payload.servings);
      if (payload.preparationTime !== undefined) recipe.preparationTime = Number(payload.preparationTime);
      if (payload.cookingTime !== undefined) recipe.cookingTime = Number(payload.cookingTime);
      if (payload.img !== undefined) recipe.img = String(payload.img);
      if (payload.ingredients !== undefined) recipe.ingredients = Array.isArray(payload.ingredients) ? payload.ingredients : [];
      if (payload.steps !== undefined) recipe.steps = Array.isArray(payload.steps) ? payload.steps : [];
      if (payload.nutritionalValues !== undefined) recipe.nutritionalValues = payload.nutritionalValues ?? undefined;
      if (payload.status !== undefined && hasMinRole(user, 'EDITOR')) {
        recipe.status = String(payload.status).toUpperCase();
      }
      recipe.updatedAt = new Date().toISOString();

      persist();
      jsonResponse(res, 200, sanitizeRecipe(recipe));
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: error.message });
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
    const recipe = findRecipeByIdOrSlug(requestUrl.pathname.split('/')[3]);
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
    persist();
    res.writeHead(204);
    res.end();
    return;
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

    const data = Array.from(users.values()).map(sanitizeUser);
    jsonResponse(res, 200, { data, total: data.length });
    return;
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
      jsonResponse(res, 400, { error: error.message });
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

    const data = recipeStore.map(sanitizeRecipe);
    jsonResponse(res, 200, { data, total: data.length });
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

    const uploads = [];
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
      { users, sessions, refreshSessions, recipeStore, ratingsStore, categoriesStore },
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
      for (const [email, user] of imported.users) {
        users.set(email, user);
      }
      // Keep the acting admin exactly as-is (id, role, password), even if the
      // backup contains an older record for the same email — otherwise the
      // admin could lock themselves out mid-import.
      users.set(actingUser.email, actingUser);

      recipeStore.splice(0, recipeStore.length, ...imported.recipeStore);

      ratingsStore.clear();
      for (const [recipeId, userRatings] of imported.ratingsStore) {
        ratingsStore.set(recipeId, userRatings);
      }

      categoriesStore.splice(0, categoriesStore.length, ...imported.categoriesStore);

      for (const upload of imported.uploads) {
        writeFileSync(join(UPLOADS_DIR, upload.fileName), upload.buffer);
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
      jsonResponse(res, 400, { error: error.message });
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

      const proto = (req.headers['x-forwarded-proto'] || 'http').toString().split(',')[0].trim();
      const host = req.headers.host ?? `localhost:${port}`;
      jsonResponse(res, 201, { url: `${proto}://${host}/uploads/${fileName}` });
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: error.message });
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

server.listen(port, () => {
  console.log(`Chellys Kitchen API listening on http://localhost:${port}`);
});

function shutdown() {
  try {
    persister.flush();
  } finally {
    server.close(() => process.exit(0));
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
