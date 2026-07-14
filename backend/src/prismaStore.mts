// Postgres persistence via Prisma. The server keeps working on its in-memory
// structures; this store replaces the JSON-file store when DATABASE_URL is
// set: `load()` rebuilds the state from the tables at boot, `save()` writes
// the full state back (the debounced persister already collapses bursts, and
// at family scale a full sync per write is cheap and always consistent).
//
// The pure mapping functions are exported separately so they stay testable
// without a database.

import { normalizeWeekPlan, WEEK_DAYS } from './weekplan.mts';
import type { Prisma } from '@prisma/client';
import type {
  Category,
  Rating,
  Recipe,
  Role,
  ServerState,
  SessionEntry,
  StateStore,
  UploadRecord,
  User,
  WeekPlanEntry,
} from './types.mts';

// Row shapes mirroring prisma/schema.prisma, kept independent of the
// generated client so the pure mappers typecheck (and unit-test) without a
// generated Prisma client or a database.
export interface UserRow {
  id: string;
  username: string;
  name: string;
  role: string;
  passwordHash: string;
  salt: string | null;
  algo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeRow {
  id: string;
  slug: string | null;
  title: string;
  status: string | null;
  data: Recipe;
}

export interface CategoryRow {
  id: string;
  data: Category;
}

export interface RatingRow {
  recipeId: string;
  userId: string;
  stars: number;
  data: Rating;
}

export interface FavoriteRow {
  userId: string;
  recipeId: string;
}

export interface SessionRow {
  token: string;
  kind: string;
  userId: string;
  expiresAt: bigint;
}

export interface WeekPlanEntryRow {
  day: string;
  recipeId: string;
  servings: number | null;
}

export interface StateRows {
  users: UserRow[];
  recipes: RecipeRow[];
  categories: CategoryRow[];
  ratings: RatingRow[];
  favorites: FavoriteRow[];
  sessions: SessionRow[];
  weekPlanEntries: WeekPlanEntryRow[];
}

export function stateToRows(state: ServerState): StateRows {
  const users = [...state.users.values()].map((user): UserRow => ({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    passwordHash: user.passwordHash,
    salt: user.salt ?? null,
    algo: user.algo ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  const recipes = state.recipeStore.map((recipe): RecipeRow => ({
    id: recipe.id,
    slug: recipe.slug ?? null,
    title: recipe.title ?? '',
    status: recipe.status ?? null,
    data: recipe,
  }));

  const categories = state.categoriesStore.map((category): CategoryRow => ({
    id: category.id,
    data: category,
  }));

  const ratings: RatingRow[] = [];
  for (const [recipeId, userRatings] of state.ratingsStore) {
    for (const [userId, rating] of userRatings) {
      ratings.push({ recipeId, userId, stars: Number(rating.stars) || 0, data: rating });
    }
  }

  const favorites: FavoriteRow[] = [];
  for (const [userId, recipeIds] of state.favoritesStore) {
    for (const recipeId of recipeIds) {
      favorites.push({ userId, recipeId });
    }
  }

  const sessions: SessionRow[] = [];
  for (const [token, entry] of state.sessions) {
    sessions.push({ token, kind: 'ACCESS', userId: entry.userId, expiresAt: BigInt(entry.expiresAt) });
  }
  for (const [token, entry] of state.refreshSessions) {
    sessions.push({ token, kind: 'REFRESH', userId: entry.userId, expiresAt: BigInt(entry.expiresAt) });
  }

  const weekPlanEntries: WeekPlanEntryRow[] = [];
  for (const day of WEEK_DAYS) {
    for (const entry of state.weekPlanStore?.[day] ?? []) {
      weekPlanEntries.push({ day, recipeId: entry.recipeId, servings: entry.servings ?? null });
    }
  }

  return { users, recipes, categories, ratings, favorites, sessions, weekPlanEntries };
}

export function rowsToState(rows: Partial<StateRows>): ServerState {
  const users = new Map<string, User>();
  for (const row of rows.users ?? []) {
    // salt/algo keys stay absent (not undefined) when the column is NULL,
    // exactly as the pre-Postgres store files looked.
    const user = {
      id: row.id,
      name: row.name,
      username: row.username,
      role: row.role as Role,
      passwordHash: row.passwordHash,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    } as User;
    if (row.salt !== null && row.salt !== undefined) user.salt = row.salt;
    if (row.algo !== null && row.algo !== undefined) user.algo = row.algo;
    users.set(user.username, user);
  }

  const sessions = new Map<string, SessionEntry>();
  const refreshSessions = new Map<string, SessionEntry>();
  for (const row of rows.sessions ?? []) {
    const entry: SessionEntry = { userId: row.userId, expiresAt: Number(row.expiresAt) };
    (row.kind === 'REFRESH' ? refreshSessions : sessions).set(row.token, entry);
  }

  const ratingsStore = new Map<string, Map<string, Rating>>();
  for (const row of rows.ratings ?? []) {
    if (!ratingsStore.has(row.recipeId)) {
      ratingsStore.set(row.recipeId, new Map());
    }
    ratingsStore.get(row.recipeId)?.set(row.userId, row.data);
  }

  const favoritesStore = new Map<string, Set<string>>();
  for (const row of rows.favorites ?? []) {
    if (!favoritesStore.has(row.userId)) {
      favoritesStore.set(row.userId, new Set());
    }
    favoritesStore.get(row.userId)?.add(row.recipeId);
  }

  const weekPlanRaw: Record<string, WeekPlanEntry[]> = {};
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

export interface PrismaStore extends StateStore {
  prisma: unknown;
  load(): Promise<ServerState | null>;
  save(state: ServerState): Promise<void>;
  saveUpload(fileName: string, buffer: Buffer): Promise<void>;
  loadUploads(): Promise<UploadRecord[]>;
}

/**
 * Store with the same load()/save() contract as the file store from
 * persistence.mts, but backed by Postgres. Both functions are async; the
 * server awaits load() at boot and the persister tolerates async save().
 */
export async function createPrismaStore(connectionString: string): Promise<PrismaStore> {
  const { PrismaClient } = await import('@prisma/client');
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  return {
    prisma,
    async load(): Promise<ServerState | null> {
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

      // The Json columns come back as Prisma.JsonValue; the rows were written
      // from our own domain objects, so narrowing them back is safe.
      return rowsToState({
        users,
        recipes: recipes as unknown as RecipeRow[],
        categories: categories as unknown as CategoryRow[],
        ratings: ratings as unknown as RatingRow[],
        favorites,
        sessions,
        weekPlanEntries,
      });
    },

    async save(state: ServerState): Promise<void> {
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
        // The Json columns take our domain objects as-is; Prisma's generated
        // InputJsonValue just cannot express that statically.
        prisma.recipe.createMany({ data: rows.recipes as unknown as Prisma.RecipeCreateManyInput[] }),
        prisma.category.createMany({ data: rows.categories as unknown as Prisma.CategoryCreateManyInput[] }),
        prisma.rating.createMany({ data: rows.ratings as unknown as Prisma.RatingCreateManyInput[] }),
        prisma.favorite.createMany({ data: rows.favorites }),
        prisma.session.createMany({ data: rows.sessions }),
        prisma.weekPlanEntry.createMany({ data: rows.weekPlanEntries }),
      ]);
    },

    // Uploaded images: disk serves them, the database keeps the durable copy.
    async saveUpload(fileName: string, buffer: Buffer): Promise<void> {
      const data = buffer as Uint8Array<ArrayBuffer>;
      await prisma.upload.upsert({
        where: { fileName },
        create: { fileName, data },
        update: { data },
      });
    },

    async loadUploads(): Promise<UploadRecord[]> {
      return prisma.upload.findMany();
    },
  };
}
