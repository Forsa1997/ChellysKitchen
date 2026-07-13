const ALLOWED_SORTS = new Set(['newest', 'oldest', 'title_asc', 'title_desc']);
const ALLOWED_DIFFICULTIES = new Set(['Einfach', 'Mittel', 'Schwer']);

export interface RecipeListParams {
  q: string;
  category: string;
  page: number;
  pageSize: number;
  sort: 'newest' | 'oldest' | 'title_asc' | 'title_desc';
  difficulty: 'all' | 'Einfach' | 'Mittel' | 'Schwer';
  maxTotalMinutes: number | null;
  favorites: boolean;
}

function parseIntSafe(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function normalizeRecipeListParams(searchParams: URLSearchParams): RecipeListParams {
  const page = parseIntSafe(searchParams.get('page'), 1);
  const pageSize = Math.min(parseIntSafe(searchParams.get('pageSize'), 12), 24);
  const sort = searchParams.get('sort') ?? 'newest';
  const difficulty = searchParams.get('difficulty') ?? 'all';
  const maxTotalMinutesRaw = parseIntSafe(searchParams.get('maxTotalMinutes'), 0);
  const maxTotalMinutes = maxTotalMinutesRaw > 0 ? maxTotalMinutesRaw : null;

  return {
    q: (searchParams.get('q') ?? '').trim(),
    category: (searchParams.get('category') ?? 'all').trim() || 'all',
    page,
    pageSize,
    sort: (ALLOWED_SORTS.has(sort) ? sort : 'newest') as RecipeListParams['sort'],
    difficulty: (ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'all') as RecipeListParams['difficulty'],
    maxTotalMinutes,
    favorites: searchParams.get('favorites') === 'true',
  };
}
