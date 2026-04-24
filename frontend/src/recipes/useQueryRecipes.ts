import { useQuery } from '@tanstack/react-query';
import { apiClient, type RecipeListParams } from '../api/client';
import type { Recipe } from '../types/domain';

const defaultMeta = {
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 1,
  q: '',
  category: 'all',
  sort: 'newest',
  difficulty: 'all',
  maxTotalMinutes: null,
};

export function useQueryRecipes(params: RecipeListParams) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recipes', params],
    queryFn: () => apiClient.getRecipes(params),
  });

  const recipes = data?.data || [];
  const meta = data?.meta || defaultMeta;

  return {
    recipes,
    meta,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  };
}
