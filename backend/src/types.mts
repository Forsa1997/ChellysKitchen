// Shared domain types for the backend. Type-only module: Node's type
// stripping removes every import of it at runtime.

export type Role = 'GUEST' | 'MEMBER' | 'EDITOR' | 'ADMIN';
export type RecipeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AuditAction = 'USER_CREATED' | 'USER_DELETED' | 'USER_ROLE_CHANGED' | 'BACKUP_IMPORTED';

export type WeekDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
}

export interface NutritionalValues {
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
}

export interface RecipeAuthor {
  name: string;
  avatar?: string;
}

export interface RecipeCreator {
  id: string;
  name: string;
}

/**
 * A recipe as it lives in the in-memory store. Most fields are optional
 * because seed data and old store files predate several additions;
 * `sanitizeRecipe` in server.mts fills the gaps for API responses.
 */
export interface Recipe {
  id: string;
  slug?: string;
  title: string;
  shortDescription: string;
  description?: string;
  img?: string;
  tag?: string;
  difficulty?: string;
  servings?: number;
  preparationTime?: number;
  cookingTime?: number;
  category?: string;
  status?: string;
  ingredients?: Ingredient[];
  steps?: RecipeStep[];
  nutritionalValues?: NutritionalValues;
  authors?: RecipeAuthor[];
  createdBy?: RecipeCreator;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  /** Legacy seed-data field; createdAt/updatedAt supersede it. */
  creationDate?: string;
  notes?: string;
  /** Computed per requester in API responses. */
  isFavorite?: boolean;
  averageRating?: number;
  totalRatings?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  /** Login identifier. Historically an e-mail; now a free-form username. */
  username: string;
  role: Role;
  passwordHash: string;
  salt: string;
  /** 'scrypt' for current hashes; absent on legacy SHA-256 users. */
  algo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rating {
  stars: number;
  id?: string;
  userId?: string;
  recipeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionEntry {
  userId: string;
  expiresAt: number;
}

export interface AuditActor {
  id: string;
  name: string;
  username: string;
}

export interface AuditTarget {
  type: 'USER' | 'BACKUP';
  label: string;
  id?: string;
  username?: string;
}

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  actor: AuditActor;
  target: AuditTarget;
  details: Record<string, string | number>;
  createdAt: string;
}

export type SessionMap = Map<string, SessionEntry>;

export interface WeekPlanEntry {
  recipeId: string;
  /** undefined only in-memory (recipe without base servings); persisted as null. */
  servings: number | null | undefined;
}

export type WeekPlan = Record<WeekDay, WeekPlanEntry[]>;

/** The complete in-memory server state handed to the persistence layer. */
export interface ServerState {
  users: Map<string, User>;
  sessions: SessionMap;
  refreshSessions: SessionMap;
  recipeStore: Recipe[];
  ratingsStore: Map<string, Map<string, Rating>>;
  categoriesStore: Category[];
  favoritesStore: Map<string, Set<string>>;
  weekPlanStore: WeekPlan;
  auditLogStore: AuditLogEntry[];
}

export interface UploadRecord {
  fileName: string;
  /** Prisma returns Bytes columns as Uint8Array; Buffer satisfies this too. */
  data: Uint8Array;
}

/**
 * Contract shared by the JSON file store (sync) and the Prisma store
 * (async). `save()` may return a promise; the debounced persister awaits it
 * on flush. The upload methods only exist on stores with a durable copy of
 * uploaded images (Postgres).
 */
export interface StateStore {
  load(): ServerState | null | Promise<ServerState | null>;
  save(state: ServerState): unknown;
  saveUpload?(fileName: string, data: Buffer): Promise<void>;
  loadUploads?(): Promise<UploadRecord[]>;
}
