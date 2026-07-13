import type { SessionEntry, SessionMap } from './types.mts';

export const ACCESS_TTL_MS = 24 * 60 * 60 * 1000; // 1 day
export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function createSessionEntry(userId: string, now: number = Date.now(), ttlMs: number = ACCESS_TTL_MS): SessionEntry {
  return { userId, expiresAt: now + ttlMs };
}

/**
 * Look up a token and return its userId, or null when the token is unknown
 * or expired. Expired entries are removed on access so the maps cannot grow
 * without bound.
 */
export function resolveSession(sessionMap: SessionMap, token: string, now: number = Date.now()): string | null {
  const entry = sessionMap.get(token);
  if (!entry) {
    return null;
  }

  if (now >= entry.expiresAt) {
    sessionMap.delete(token);
    return null;
  }

  return entry.userId;
}

/**
 * Upgrade session maps persisted by older server versions, where values were
 * plain userId strings without an expiry, to expiring entries.
 */
export function normalizeSessionMap(sessionMap: SessionMap, now: number = Date.now(), ttlMs: number = ACCESS_TTL_MS): void {
  // Old store files put plain strings where entries belong; the runtime check
  // below cleans that up, so widen what the compiler believes about values.
  for (const [token, value] of sessionMap as Map<string, SessionEntry | string>) {
    if (typeof value === 'string') {
      sessionMap.set(token, createSessionEntry(value, now, ttlMs));
    }
  }
}

export function pruneExpiredSessions(sessionMap: SessionMap, now: number = Date.now()): void {
  for (const [token, entry] of sessionMap) {
    if (!entry || typeof entry !== 'object' || now >= entry.expiresAt) {
      sessionMap.delete(token);
    }
  }
}
