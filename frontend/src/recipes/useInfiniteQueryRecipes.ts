import { useInfiniteQuery } from '@tanstack/react-query';
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

/**
 * Infinite-scroll variant of useQueryRecipes for the mobile list view.
 * The query key omits `page` (each page is a segment of one cached list) and
 * carries an extra 'infinite' marker so it never collides with the paginated
 * desktop cache `['recipes', params]`. Both caches share the `['recipes']`
 * prefix, so the existing mutation invalidations (e.g. useToggleFavorite)
 * refetch this list too — including all pages loaded so far.
 */
export function useInfiniteQueryRecipes(params: RecipeListParams, { enabled = true } = {}) {
  const paramsWithoutPage = { ...params };
  delete paramsWithoutPage.page;

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ['recipes', 'infinite', paramsWithoutPage],
    queryFn: ({ pageParam }) => apiClient.getRecipes({ ...paramsWithoutPage, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      (lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined),
    enabled,
  });

  const pages = data?.pages ?? [];
  const recipes = pages.flatMap((page) => page.data);
  const meta = pages.length > 0 ? pages[pages.length - 1].meta : defaultMeta;

  return {
    recipes,
    meta,
    loading: isLoading && !data,
    fetching: isFetching && !isFetchingNextPage,
    fetchingNextPage: isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    error: error instanceof Error ? error.message : null,
  };
}
