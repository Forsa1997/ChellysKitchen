import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { normalizeWeekPlan } from './weekplan.mts';
import type {
  Category,
  Rating,
  Recipe,
  ServerState,
  SessionEntry,
  StateStore,
  User,
  WeekPlan,
} from './types.mts';

const STATE_VERSION = 1;

/** JSON shape of the store file (Maps flattened to entry arrays). */
export interface SerializedState {
  version: number;
  users: User[];
  sessions: Array<[string, SessionEntry]>;
  refreshSessions: Array<[string, SessionEntry]>;
  recipeStore: Recipe[];
  ratingsStore: Array<[string, Array<[string, Rating]>]>;
  categoriesStore: Category[];
  favoritesStore: Array<[string, string[]]>;
  weekPlanStore: Partial<WeekPlan>;
}

/**
 * What serializeState accepts: the live server state, or one where the newer
 * optional collections are missing (older callers/backups).
 */
export type PersistableState = Omit<ServerState, 'favoritesStore' | 'weekPlanStore'> & {
  favoritesStore?: ServerState['favoritesStore'];
  weekPlanStore?: WeekPlan;
};

/**
 * Convert the in-memory server state (Maps + Arrays) into a JSON-serializable
 * plain object. Maps are stored as entry arrays; the nested ratings map
 * (recipeId -> Map<userId, rating>) gets a two-level conversion.
 */
export function serializeState(state: PersistableState): SerializedState {
  return {
    version: STATE_VERSION,
    users: [...state.users.values()],
    sessions: [...state.sessions.entries()],
    refreshSessions: [...state.refreshSessions.entries()],
    recipeStore: state.recipeStore,
    ratingsStore: [...state.ratingsStore.entries()].map(([recipeId, userMap]) => [
      recipeId,
      [...userMap.entries()],
    ]),
    categoriesStore: state.categoriesStore,
    // userId -> Set<recipeId>, stored as entry arrays. Optional so callers
    // (and older store files) without favorites keep working.
    favoritesStore: [...(state.favoritesStore ?? new Map<string, Set<string>>()).entries()].map(([userId, recipeIds]) => [
      userId,
      [...recipeIds],
    ]),
    // Plain object (day -> entries), JSON-serializable as-is. Optional so
    // older store files keep loading.
    weekPlanStore: state.weekPlanStore ?? {},
  };
}

/**
 * Rebuild the in-memory state from a previously serialized object.
 * Missing fields fall back to empty collections so partial/old files
 * still load cleanly.
 */
export function deserializeState(raw: Partial<SerializedState> | null | undefined): ServerState {
  const users = new Map<string, User>();
  for (const user of raw?.users ?? []) {
    if (user && user.email) {
      users.set(user.email, user);
    }
  }

  const ratingsStore = new Map<string, Map<string, Rating>>();
  for (const [recipeId, entries] of raw?.ratingsStore ?? []) {
    ratingsStore.set(recipeId, new Map(entries ?? []));
  }

  const favoritesStore = new Map<string, Set<string>>();
  for (const [userId, recipeIds] of raw?.favoritesStore ?? []) {
    favoritesStore.set(userId, new Set(recipeIds ?? []));
  }

  return {
    favoritesStore,
    users,
    sessions: new Map(raw?.sessions ?? []),
    refreshSessions: new Map(raw?.refreshSessions ?? []),
    recipeStore: Array.isArray(raw?.recipeStore) ? raw.recipeStore : [],
    ratingsStore,
    categoriesStore: Array.isArray(raw?.categoriesStore) ? raw.categoriesStore : [],
    weekPlanStore: normalizeWeekPlan(raw?.weekPlanStore),
  };
}

export interface FileStore extends StateStore {
  filePath: string;
  load(): ServerState | null;
  save(state: ServerState): void;
}

/**
 * File-backed store. `load()` returns hydrated state (or null when no file
 * exists yet), `save()` writes atomically via a temp file + rename.
 */
export function createStore(filePath: string): FileStore {
  return {
    filePath,
    load(): ServerState | null {
      if (!existsSync(filePath)) {
        return null;
      }
      try {
        const raw = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<SerializedState>;
        return deserializeState(raw);
      } catch {
        // Corrupt or unreadable store: start fresh instead of crashing.
        return null;
      }
    },
    save(state: ServerState): void {
      mkdirSync(dirname(filePath), { recursive: true });
      const tmp = `${filePath}.tmp`;
      writeFileSync(tmp, JSON.stringify(serializeState(state)));
      renameSync(tmp, filePath);
    },
  };
}

export interface DebouncedPersister {
  schedule(): void;
  flush(): Promise<void> | undefined;
}

/**
 * Wrap a store with a debounced writer so bursts of mutations collapse into a
 * single disk write. `schedule()` is cheap to call after every mutation;
 * `flush()` forces a synchronous write (use on shutdown).
 *
 * Generic over the state so it only demands what it uses: a `save()` method.
 */
export function createDebouncedPersister<TState = ServerState>(store: { save(state: TState): unknown }, getState: () => TState, delay = 200): DebouncedPersister {
  let timer: NodeJS.Timeout | null = null;
  let pending = false;

  // Works with sync stores (JSON file) and async stores (Postgres): a
  // returned promise is awaited on flush and error-swallowed on background
  // writes — persistence must never take the server down.
  const write = (): Promise<void> | undefined => {
    timer = null;
    if (!pending) {
      return undefined;
    }
    pending = false;
    try {
      const result = store.save(getState());
      if (result instanceof Promise) {
        return result.catch(() => {});
      }
    } catch {
      // swallowed, see above
    }
    return undefined;
  };

  return {
    schedule(): void {
      pending = true;
      if (timer) {
        return;
      }
      timer = setTimeout(write, delay);
      if (typeof timer.unref === 'function') {
        timer.unref();
      }
    },
    flush(): Promise<void> | undefined {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      return write();
    },
  };
}
