// Postgres persistence via Prisma. The server keeps working on its in-memory
// structures; this store replaces the JSON-file store when DATABASE_URL is
// set: `load()` rebuilds the state from the tables at boot, `save()` writes
// the full state back (the debounced persister already collapses bursts, and
// at family scale a full sync per write is cheap and always consistent).
//
// The pure mapping functions are exported separately so they stay testable
// without a database.

import { normalizeWeekPlan, WEEK_DAYS } from './weekplan.mts';

export function stateToRows(state) {
  const users = [...state.users.values()].map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    passwordHash: user.passwordHash,
    salt: user.salt ?? null,
    algo: user.algo ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  const recipes = state.recipeStore.map((recipe) => ({
    id: recipe.id,
    slug: recipe.slug ?? null,
    title: recipe.title ?? '',
    status: recipe.status ?? null,
    data: recipe,
  }));

  const categories = state.categoriesStore.map((category) => ({
    id: category.id,
    data: category,
  }));

  const ratings = [];
  for (const [recipeId, userRatings] of state.ratingsStore) {
    for (const [userId, rating] of userRatings) {
      ratings.push({ recipeId, userId, stars: Number(rating.stars) || 0, data: rating });
    }
  }

  const favorites = [];
  for (const [userId, recipeIds] of state.favoritesStore) {
    for (const recipeId of recipeIds) {
      favorites.push({ userId, recipeId });
    }
  }

  const sessions = [];
  for (const [token, entry] of state.sessions) {
    sessions.push({ token, kind: 'ACCESS', userId: entry.userId, expiresAt: BigInt(entry.expiresAt) });
  }
  for (const [token, entry] of state.refreshSessions) {
    sessions.push({ token, kind: 'REFRESH', userId: entry.userId, expiresAt: BigInt(entry.expiresAt) });
  }

  const weekPlanEntries = [];
  for (const day of WEEK_DAYS) {
    for (const entry of state.weekPlanStore?.[day] ?? []) {
      weekPlanEntries.push({ day, recipeId: entry.recipeId, servings: entry.servings ?? null });
    }
  }

  return { users, recipes, categories, ratings, favorites, sessions, weekPlanEntries };
}

export function rowsToState(rows) {
  const users = new Map();
  for (const row of rows.users ?? []) {
    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      passwordHash: row.passwordHash,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    if (row.salt !== null && row.salt !== undefined) user.salt = row.salt;
    if (row.algo !== null && row.algo !== undefined) user.algo = row.algo;
    users.set(user.email, user);
  }

  const sessions = new Map();
  const refreshSessions = new Map();
  for (const row of rows.sessions ?? []) {
    const entry = { userId: row.userId, expiresAt: Number(row.expiresAt) };
    (row.kind === 'REFRESH' ? refreshSessions : sessions).set(row.token, entry);
  }

  const ratingsStore = new Map();
  for (const row of rows.ratings ?? []) {
    if (!ratingsStore.has(row.recipeId)) {
      ratingsStore.set(row.recipeId, new Map());
    }
    ratingsStore.get(row.recipeId).set(row.userId, row.data);
  }

  const favoritesStore = new Map();
  for (const row of rows.favorites ?? []) {
    if (!favoritesStore.has(row.userId)) {
      favoritesStore.set(row.userId, new Set());
    }
    favoritesStore.get(row.userId).add(row.recipeId);
  }

  const weekPlanRaw = {};
  for (const row of rows.weekPlanEntries ?? []) {
    (weekPlanRaw[row.day] ??= []).push({ recipeId: row.recipeId, servings: row.servings });
  }

  return {
    users,
    sessions,
    refreshSessions,
    recipeStore: (rows.recipes ?? []).map((row) => row.data),
    ratingsStore,
    categoriesStore: (rows.categories ?? []).map((row) => row.data),
    favoritesStore,
    weekPlanStore: normalizeWeekPlan(weekPlanRaw),
  };
}

/**
 * Store with the same load()/save() contract as the file store from
 * persistence.mts, but backed by Postgres. Both functions are async; the
 * server awaits load() at boot and the persister tolerates async save().
 */
export async function createPrismaStore(connectionString) {
  const { PrismaClient } = await import('@prisma/client');
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  return {
    prisma,
    async load() {
      const [users, recipes, categories, ratings, favorites, sessions, weekPlanEntries] = await Promise.all([
        prisma.user.findMany(),
        prisma.recipe.findMany(),
        prisma.category.findMany(),
        prisma.rating.findMany(),
        prisma.favorite.findMany(),
        prisma.session.findMany(),
        prisma.weekPlanEntry.findMany(),
      ]);

      // An empty database means first boot: let the server seed its defaults.
      if (users.length === 0 && recipes.length === 0) {
        return null;
      }

      return rowsToState({ users, recipes, categories, ratings, favorites, sessions, weekPlanEntries });
    },

    async save(state) {
      const rows = stateToRows(state);
      // Full replace inside one transaction: simple, atomic, and with family-
      // sized data (dozens of rows) far below any performance concern.
      await prisma.$transaction([
        prisma.session.deleteMany(),
        prisma.rating.deleteMany(),
        prisma.favorite.deleteMany(),
        prisma.weekPlanEntry.deleteMany(),
        prisma.recipe.deleteMany(),
        prisma.category.deleteMany(),
        prisma.user.deleteMany(),
        prisma.user.createMany({ data: rows.users }),
        prisma.recipe.createMany({ data: rows.recipes }),
        prisma.category.createMany({ data: rows.categories }),
        prisma.rating.createMany({ data: rows.ratings }),
        prisma.favorite.createMany({ data: rows.favorites }),
        prisma.session.createMany({ data: rows.sessions }),
        prisma.weekPlanEntry.createMany({ data: rows.weekPlanEntries }),
      ]);
    },

    // Uploaded images: disk serves them, the database keeps the durable copy.
    async saveUpload(fileName, buffer) {
      await prisma.upload.upsert({
        where: { fileName },
        create: { fileName, data: buffer },
        update: { data: buffer },
      });
    },

    async loadUploads() {
      return prisma.upload.findMany();
    },
  };
}
