import { useEffect, useState } from 'react';
import { fetchRecipes } from '../api/client';
import type { RecipeListMeta, RecipeListParams } from '../api/client';
import type { Recipe } from '../types/domain';

const defaultMeta: RecipeListMeta = {
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 1,
  q: '',
  category: 'all',
  sort: 'newest',
};

export function useQueryRecipes(params: RecipeListParams) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [meta, setMeta] = useState<RecipeListMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    fetchRecipes(params)
      .then((result) => {
        setRecipes(result.data);
        setMeta(result.meta);
        setError(null);
      })
      .catch((requestError: Error) => {
        setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, [params.q, params.category, params.page, params.pageSize, params.sort]);

  return { recipes, meta, loading, error };
}
