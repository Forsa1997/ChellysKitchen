import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { recipes } from './data/recipes.mjs';
import { queryRecipes } from './src/queryRecipes.mjs';
import { resolveCorsOrigin } from './src/cors.mjs';

const port = Number(process.env.PORT ?? 4000);
const allowedOrigin = process.env.CORS_ORIGIN;

const users = new Map();
const sessions = new Map();
const recipeStore = [...recipes];
const ratingsStore = new Map(); // Store ratings by recipeId -> Map<userId, rating>
const categoriesStore = [
  { id: 'cat_1', name: 'Cooking', slug: 'cooking', description: 'Hauptgerichte und Kochrezepte', icon: '🍳' },
  { id: 'cat_2', name: 'Baking', slug: 'baking', description: 'Backwaren und Desserts', icon: '🧁' },
  { id: 'cat_3', name: 'Barbeque', slug: 'barbeque', description: 'Grillen und BBQ', icon: '🍖' },
  { id: 'cat_4', name: 'Salads', slug: 'salads', description: 'Frische Salate', icon: '🥗' },
  { id: 'cat_5', name: 'Soups', slug: 'soups', description: 'Suppen und Eintöpfe', icon: '🍲' },
  { id: 'cat_6', name: 'Desserts', slug: 'desserts', description: 'Süße Desserts', icon: '🍰' },
];

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
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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
    ...recipe,
    averageRating: Math.round(averageRating * 10) / 10,
    totalRatings,
  };
}

async function parseJsonBody(req) {
  let body = '';

  for await (const chunk of req) {
    body += chunk;

    if (body.length > 1024 * 1024) {
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

function seedDemoUser() {
  const normalizedEmail = 'demo@chellys-kitchen.local';
  const salt = randomBytes(16).toString('hex');
  users.set(normalizedEmail, {
    id: `user_${randomBytes(8).toString('hex')}`,
    name: 'Demo User',
    email: normalizedEmail,
    role: 'member',
    passwordHash: hashPassword('demo1234', salt),
    salt,
  });
}

seedDemoUser();

const server = createServer(async (req, res) => {
  withCors(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    jsonResponse(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'GET' && req.url?.startsWith('/api/recipes')) {
    const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

    if (requestUrl.pathname === '/api/recipes') {
      const query = Object.fromEntries(requestUrl.searchParams.entries());
      const result = queryRecipes(recipeStore.map((recipe) => sanitizeRecipe(recipe)), query);
      jsonResponse(res, 200, result);
      return;
    }
  }

  if (req.method === 'GET' && req.url?.startsWith('/api/recipes/')) {
    const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    const recipeId = requestUrl.pathname.replace('/api/recipes/', '');
    const recipe = recipeStore.find((entry) => entry.id === recipeId);

    if (!recipe) {
      jsonResponse(res, 404, { error: 'Rezept nicht gefunden.' });
      return;
    }

    jsonResponse(res, 200, { data: sanitizeRecipe(recipe) });
    return;
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
      const user = {
        id: `user_${randomBytes(8).toString('hex')}`,
        name: String(name).trim(),
        email: normalizedEmail,
        role: 'member',
        passwordHash: hashPassword(String(password), salt),
        salt,
      };

      users.set(normalizedEmail, user);
      const token = randomBytes(24).toString('hex');
      sessions.set(token, user.id);
      jsonResponse(res, 201, { token, user: sanitizeUser(user) });
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

      const token = randomBytes(24).toString('hex');
      sessions.set(token, user.id);
      jsonResponse(res, 200, { token, user: sanitizeUser(user) });
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: error.message });
      return;
    }
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
        title: String(title).trim(),
        shortDescription: String(shortDescription).trim(),
        category: String(category).trim(),
        tag: String(tag ?? 'Neu').trim() || 'Neu',
        difficulty: String(difficulty ?? 'Einfach').trim() || 'Einfach',
        servings: Number(servings ?? 2),
        preparationTime: Number(preparationTime ?? 10),
        cookingTime: Number(cookingTime ?? 20),
        img: String(img ?? 'https://picsum.photos/800/450?random=50'),
        ingredients: Array.isArray(ingredients) ? ingredients : [],
        steps: Array.isArray(steps) ? steps : [],
        authors: [{ name: user.name, avatar: '/static/images/avatar/1.jpg' }],
        creationDate: new Date().toISOString(),
      };

      recipeStore.unshift(newRecipe);
      jsonResponse(res, 201, { data: sanitizeRecipe(newRecipe) });
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

    if (!user || user.role !== 'admin') {
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

    if (!user || user.role !== 'admin') {
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

    if (!user || user.role !== 'admin') {
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
      jsonResponse(res, 204, null);
      return;
    } catch (error) {
      jsonResponse(res, 400, { error: error.message });
      return;
    }
  }

  jsonResponse(res, 404, { error: 'Not Found' });
});

server.listen(port, () => {
  console.log(`Chellys Kitchen API listening on http://localhost:${port}`);
});
