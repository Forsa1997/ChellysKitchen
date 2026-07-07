import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient, type RecipeListParams } from '../api/client';

const defaultMeta = {
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 1,
  q: '',
  category: 'all',
  sort: 'newest',
  difficulty: 'all',
  maxTotalMinutes: null,
};

export function useQueryRecipes(params: RecipeListParams) {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['recipes', params],
    queryFn: () => apiClient.getRecipes(params),
    placeholderData: keepPreviousData,
  });

  const recipes = data?.data || [];
  const meta = data?.meta || defaultMeta;

  return {
    recipes,
    meta,
    loading: isLoading && !data,
    fetching: isFetching,
    error: error instanceof Error ? error.message : null,
  };
}
