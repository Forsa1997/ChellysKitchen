const ALLOWED_SORTS = new Set(['newest', 'oldest', 'title_asc', 'title_desc']);
const ALLOWED_DIFFICULTIES = new Set(['Einfach', 'Mittel', 'Schwer']);

function parseIntSafe(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * @param {URLSearchParams} searchParams
 */
export function normalizeRecipeListParams(searchParams) {
  const page = parseIntSafe(searchParams.get('page'), 1);
  const pageSize = Math.min(parseIntSafe(searchParams.get('pageSize'), 6), 24);
  const sort = searchParams.get('sort') ?? 'newest';
  const difficulty = searchParams.get('difficulty') ?? 'all';
  const maxTotalMinutesRaw = parseIntSafe(searchParams.get('maxTotalMinutes'), 0);
  const maxTotalMinutes = maxTotalMinutesRaw > 0 ? maxTotalMinutesRaw : null;

  return {
    q: (searchParams.get('q') ?? '').trim(),
    category: (searchParams.get('category') ?? 'all').trim() || 'all',
    page,
    pageSize,
    sort: ALLOWED_SORTS.has(sort) ? sort : 'newest',
    difficulty: ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'all',
    maxTotalMinutes,
  };
}
