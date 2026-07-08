import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const STATE_VERSION = 1;

/**
 * Convert the in-memory server state (Maps + Arrays) into a JSON-serializable
 * plain object. Maps are stored as entry arrays; the nested ratings map
 * (recipeId -> Map<userId, rating>) gets a two-level conversion.
 */
export function serializeState(state) {
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
    favoritesStore: [...(state.favoritesStore ?? new Map()).entries()].map(([userId, recipeIds]) => [
      userId,
      [...recipeIds],
    ]),
  };
}

/**
 * Rebuild the in-memory state from a previously serialized object.
 * Missing fields fall back to empty collections so partial/old files
 * still load cleanly.
 */
export function deserializeState(raw) {
  const users = new Map();
  for (const user of raw?.users ?? []) {
    if (user && user.email) {
      users.set(user.email, user);
    }
  }

  const ratingsStore = new Map();
  for (const [recipeId, entries] of raw?.ratingsStore ?? []) {
    ratingsStore.set(recipeId, new Map(entries ?? []));
  }

  const favoritesStore = new Map();
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
  };
}

/**
 * File-backed store. `load()` returns hydrated state (or null when no file
 * exists yet), `save()` writes atomically via a temp file + rename.
 */
export function createStore(filePath) {
  return {
    filePath,
    load() {
      if (!existsSync(filePath)) {
        return null;
      }
      try {
        const raw = JSON.parse(readFileSync(filePath, 'utf8'));
        return deserializeState(raw);
      } catch {
        // Corrupt or unreadable store: start fresh instead of crashing.
        return null;
      }
    },
    save(state) {
      mkdirSync(dirname(filePath), { recursive: true });
      const tmp = `${filePath}.tmp`;
      writeFileSync(tmp, JSON.stringify(serializeState(state)));
      renameSync(tmp, filePath);
    },
  };
}

/**
 * Wrap a store with a debounced writer so bursts of mutations collapse into a
 * single disk write. `schedule()` is cheap to call after every mutation;
 * `flush()` forces a synchronous write (use on shutdown).
 */
export function createDebouncedPersister(store, getState, delay = 200) {
  let timer = null;
  let pending = false;

  const write = () => {
    timer = null;
    if (!pending) {
      return;
    }
    pending = false;
    try {
      store.save(getState());
    } catch {
      // Persistence must never take the server down.
    }
  };

  return {
    schedule() {
      pending = true;
      if (timer) {
        return;
      }
      timer = setTimeout(write, delay);
      if (typeof timer.unref === 'function') {
        timer.unref();
      }
    },
    flush() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (pending) {
        pending = false;
        store.save(getState());
      }
    },
  };
}
