import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRecipe, fetchRecipeById, fetchRecipes, login, me, register } from './client';

const sampleUser = {
  id: 'u1',
  name: 'Demo User',
  email: 'demo@example.com',
  role: 'member' as const,
};

const sampleRecipe = {
  id: '1',
  img: 'https://example.com/pasta.jpg',
  tag: 'Quick',
  title: 'Tomato Pasta',
  shortDescription: 'Fresh tomato sauce with basil',
  preparationTime: 10,
  cookingTime: 20,
  difficulty: 'Easy',
  servings: 2,
  ingredients: [{ name: 'Tomato', amount: 4, unit: 'pcs' }],
  steps: [{ stepNumber: 1, instruction: 'Cook pasta.' }],
  category: 'Cooking',
};

describe('api client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads recipes and recipe details from API envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: RequestInfo | URL) => ({
        ok: true,
        json: async () => ({ data: String(url).endsWith('/1') ? sampleRecipe : [sampleRecipe] }),
      })),
    );

    await expect(fetchRecipes()).resolves.toEqual([sampleRecipe]);
    await expect(fetchRecipeById('1')).resolves.toEqual(sampleRecipe);
  });

  it('sends auth payloads and authorization headers', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ token: 'abc', user: sampleUser, data: sampleRecipe }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    await register({ name: sampleUser.name, email: sampleUser.email, password: 'pw' });
    await login({ email: sampleUser.email, password: 'pw' });
    await me('token-xyz');
    await createRecipe({ title: 'A', shortDescription: 'B', category: 'Cooking' }, 'token-xyz');

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[0]?.[0]).toMatch(/\/api\/auth\/register$/);
    expect((fetchMock.mock.calls[2]?.[1]?.headers as Record<string, string>).Authorization).toBe('Bearer token-xyz');
    expect((fetchMock.mock.calls[3]?.[1]?.headers as Record<string, string>).Authorization).toBe('Bearer token-xyz');
  });

  it('surfaces backend error messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error: 'Kaputt' }),
      })),
    );

    await expect(fetchRecipes()).rejects.toThrow('Kaputt');
  });
});
