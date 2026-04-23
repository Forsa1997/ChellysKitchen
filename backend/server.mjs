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

function jsonResponse(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function withCors(req, res) {
  const requestOrigin = req.headers.origin;
  const origin = resolveCorsOrigin({ requestOrigin, allowedOrigin });

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
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
  return {
    ...recipe,
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

  jsonResponse(res, 404, { error: 'Not Found' });
});

server.listen(port, () => {
  console.log(`Chellys Kitchen API listening on http://localhost:${port}`);
});
