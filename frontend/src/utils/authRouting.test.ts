import { describe, expect, it } from 'vitest';
import { getSignInTargetPath } from './authRouting';

describe('authRouting', () => {
  it('returns path from router state', () => {
    expect(getSignInTargetPath({ from: '/recipes/new' })).toBe('/recipes/new');
  });

  it('falls back to root when state is invalid', () => {
    expect(getSignInTargetPath(null)).toBe('/');
    expect(getSignInTargetPath({ from: 7 })).toBe('/');
  });
});
