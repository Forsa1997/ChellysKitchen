export interface RecipeListParams {
  q: string;
  category: string;
  page: number;
  pageSize: number;
  sort: 'newest' | 'oldest' | 'title_asc' | 'title_desc';
}

export function normalizeRecipeListParams(searchParams: URLSearchParams): RecipeListParams;
