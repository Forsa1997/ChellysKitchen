import { useEffect, useState } from 'react';
import { fetchRecipes } from '../api/client';
import type { Recipe } from '../types/domain';

export function useQueryRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecipes()
      .then((data) => {
        setRecipes(data);
        setError(null);
      })
      .catch((requestError: Error) => {
        setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { recipes, loading, error };
}
