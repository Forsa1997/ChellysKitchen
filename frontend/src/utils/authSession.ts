import type { User } from '../types/domain';

export const TOKEN_KEY = 'chellysKitchenToken';

export interface AuthStateSnapshot {
  token: string | null;
  user: User | null;
}

export function getStoredToken(storage: Pick<Storage, 'getItem'>): string | null {
  return storage.getItem(TOKEN_KEY);
}

export function applyAuthSuccess(
  storage: Pick<Storage, 'setItem'>,
  user: User,
  token: string,
): AuthStateSnapshot {
  storage.setItem(TOKEN_KEY, token);
  return { user, token };
}

export function clearAuthState(storage: Pick<Storage, 'removeItem'>): AuthStateSnapshot {
  storage.removeItem(TOKEN_KEY);
  return { user: null, token: null };
}
