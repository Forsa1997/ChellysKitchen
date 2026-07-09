import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, type Recipe, type RecipeListResponse } from '../api/client';
import { useInfiniteQueryRecipes } from './useInfiniteQueryRecipes';

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

function makeRecipe(id: string, title: string): Recipe {
  return {
    id,
    slug: title.toLowerCase(),
    title,
    shortDescription: 'Lecker',
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
  } as Recipe;
}

function pageResponse(page: number, totalPages: number, titles: string[]): RecipeListResponse {
  return {
    data: titles.map((title, index) => makeRecipe(`recipe-${page}-${index}`, title)),
    meta: {
      page,
      pageSize: titles.length,
      total: totalPages * titles.length,
      totalPages,
      q: '',
      category: 'all',
      sort: 'newest',
      difficulty: 'all',
      maxTotalMinutes: null,
    },
  };
}

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

describe('useInfiniteQueryRecipes', () => {
  beforeEach(() => {
    getRecipesMock.mockReset();
  });

  it('appends the next page to the already loaded recipes', async () => {
    getRecipesMock
      .mockResolvedValueOnce(pageResponse(1, 2, ['Pasta']))
      .mockResolvedValueOnce(pageResponse(2, 2, ['Suppe']));

    const { result } = renderHook(
      () => useInfiniteQueryRecipes({ category: 'all', page: 1 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.recipes).toHaveLength(1));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.recipes).toHaveLength(2));
    expect(result.current.recipes.map((recipe) => recipe.title)).toEqual(['Pasta', 'Suppe']);
    expect(result.current.hasNextPage).toBe(false);
    // Page 2 was requested with the shared filters, page stripped from the key.
    expect(getRecipesMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, category: 'all' }));
  });

  it('resets to the first page when a filter changes', async () => {
    getRecipesMock
      .mockResolvedValueOnce(pageResponse(1, 1, ['Pasta']))
      .mockResolvedValueOnce(pageResponse(1, 1, ['Suppe']));

    const { result, rerender } = renderHook(
      ({ category }) => useInfiniteQueryRecipes({ category, page: 1 }),
      { initialProps: { category: 'all' }, wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.recipes).toHaveLength(1));

    rerender({ category: 'Suppe' });

    await waitFor(() => expect(result.current.recipes.map((recipe) => recipe.title)).toEqual(['Suppe']));
    expect(getRecipesMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, category: 'Suppe' }));
  });

  it('does not fetch while disabled', async () => {
    const { result } = renderHook(
      () => useInfiniteQueryRecipes({ category: 'all', page: 1 }, { enabled: false }),
      { wrapper: createWrapper() },
    );

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(getRecipesMock).not.toHaveBeenCalled();
    expect(result.current.recipes).toHaveLength(0);
  });
});
