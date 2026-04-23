export interface RecipeListParams {
  q: string;
  category: string;
  page: number;
  pageSize: number;
  sort: 'newest' | 'oldest' | 'title_asc' | 'title_desc';
  difficulty: 'all' | 'Einfach' | 'Mittel' | 'Schwer';
  maxTotalMinutes: number | null;
}

export function normalizeRecipeListParams(searchParams: URLSearchParams): RecipeListParams;
