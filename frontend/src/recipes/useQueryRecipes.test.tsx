import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, type RecipeListResponse } from '../api/client';
import { useQueryRecipes } from './useQueryRecipes';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client');

  return {
    ...actual,
    apiClient: {
      getRecipes: vi.fn(),
    },
  };
});

const getRecipesMock = vi.mocked(apiClient.getRecipes);

const pastaResponse: RecipeListResponse = {
  data: [
    {
      id: 'recipe-1',
      slug: 'pasta',
      title: 'Pasta',
      shortDescription: 'Schnell und lecker',
      difficulty: 'EINFACH',
      servings: 2,
      preparationTime: 10,
      cookingTime: 20,
      category: 'Pasta',
      status: 'PUBLISHED',
      ingredients: [],
      steps: [],
      createdBy: { id: 'u1', name: 'Chris' },
      createdAt: '2026-04-30T12:00:00.000Z',
      updatedAt: '2026-04-30T12:00:00.000Z',
    },
  ],
  meta: {
    page: 1,
    pageSize: 12,
    total: 1,
    totalPages: 1,
    q: '',
    category: 'all',
    sort: 'newest',
    difficulty: 'all',
    maxTotalMinutes: null,
  },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useQueryRecipes', () => {
  beforeEach(() => {
    getRecipesMock.mockReset();
  });

  it('keeps the previous recipe list visible while filter changes are fetching', async () => {
    let resolveFilteredRecipes: (response: RecipeListResponse) => void = () => {};
    const filteredRecipes = new Promise<RecipeListResponse>((resolve) => {
      resolveFilteredRecipes = resolve;
    });

    getRecipesMock
      .mockResolvedValueOnce(pastaResponse)
      .mockReturnValueOnce(filteredRecipes);

    const { result, rerender } = renderHook(
      ({ category }) => useQueryRecipes({ category }),
      {
        initialProps: { category: 'all' },
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.recipes).toHaveLength(1));

    rerender({ category: 'Pasta' });

    await waitFor(() => expect(result.current.fetching).toBe(true));
    expect(result.current.loading).toBe(false);
    expect(result.current.recipes).toHaveLength(1);
    expect(result.current.recipes[0].title).toBe('Pasta');

    resolveFilteredRecipes({ ...pastaResponse, meta: { ...pastaResponse.meta, category: 'Pasta' } });
  });
});
