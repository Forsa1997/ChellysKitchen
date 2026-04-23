import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { recipes } from './data/recipes.mjs';

const port = Number(process.env.PORT ?? 4000);
const allowedOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

const users = new Map();
const sessions = new Map();

function jsonResponse(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function withCors(req, res) {
  const requestOrigin = req.headers.origin;
  const origin = requestOrigin === allowedOrigin ? allowedOrigin : 'null';

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

  if (req.method === 'GET' && req.url === '/api/recipes') {
    jsonResponse(res, 200, { data: recipes });
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
    const token = getBearerToken(req);

    if (!token || !sessions.has(token)) {
      jsonResponse(res, 401, { error: 'Nicht authentifiziert.' });
      return;
    }

    const userId = sessions.get(token);
    const user = Array.from(users.values()).find((entry) => entry.id === userId);

    if (!user) {
      jsonResponse(res, 401, { error: 'Session abgelaufen.' });
      return;
    }

    jsonResponse(res, 200, { user: sanitizeUser(user) });
    return;
  }

  jsonResponse(res, 404, { error: 'Not Found' });
});

server.listen(port, () => {
  console.log(`Chellys Kitchen API listening on http://localhost:${port}`);
});
