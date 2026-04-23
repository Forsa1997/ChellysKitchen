import { describe, expect, it } from 'vitest';
import { applyAuthSuccess, clearAuthState, getStoredToken, TOKEN_KEY } from './authSession';

const sampleUser = {
  id: 'u1',
  name: 'Demo User',
  email: 'demo@example.com',
  role: 'member' as const,
};

function createStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  };
}

describe('authSession', () => {
  it('stores token and returns next auth snapshot', () => {
    const storage = createStorage();
    const snapshot = applyAuthSuccess(storage, sampleUser, 'token-1');

    expect(storage.getItem(TOKEN_KEY)).toBe('token-1');
    expect(snapshot).toEqual({ user: sampleUser, token: 'token-1' });
  });

  it('reads and clears token', () => {
    const storage = createStorage();
    storage.setItem(TOKEN_KEY, 'token-2');

    expect(getStoredToken(storage)).toBe('token-2');
    expect(clearAuthState(storage)).toEqual({ user: null, token: null });
    expect(storage.getItem(TOKEN_KEY)).toBeNull();
  });
});
