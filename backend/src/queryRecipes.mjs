const ALLOWED_SORTS = new Set(['newest', 'oldest', 'title_asc', 'title_desc']);
const ALLOWED_DIFFICULTIES = new Set(['EINFACH', 'MITTEL', 'SCHWER', 'Einfach', 'Mittel', 'Schwer']);

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeSort(sort) {
  return ALLOWED_SORTS.has(sort) ? sort : 'newest';
}

function normalizeDifficulty(difficulty) {
  if (!ALLOWED_DIFFICULTIES.has(difficulty)) {
    return 'all';
  }

  const normalized = String(difficulty).toLowerCase();

  if (normalized === 'einfach') return 'EINFACH';
  if (normalized === 'mittel') return 'MITTEL';
  if (normalized === 'schwer') return 'SCHWER';

  return difficulty;
}

function sortRecipes(recipes, sort) {
  const copied = [...recipes];

  if (sort === 'oldest') {
    copied.sort((a, b) => new Date(a.createdAt ?? a.creationDate).getTime() - new Date(b.createdAt ?? b.creationDate).getTime());
    return copied;
  }

  if (sort === 'title_asc') {
    copied.sort((a, b) => a.title.localeCompare(b.title, 'de'));
    return copied;
  }

  if (sort === 'title_desc') {
    copied.sort((a, b) => b.title.localeCompare(a.title, 'de'));
    return copied;
  }

  copied.sort((a, b) => new Date(b.createdAt ?? b.creationDate).getTime() - new Date(a.createdAt ?? a.creationDate).getTime());
  return copied;
}

export function queryRecipes(recipes, queryParams = {}) {
  const q = String(queryParams.q ?? '').trim().toLowerCase();
  const category = String(queryParams.category ?? 'all').trim();
  const page = toPositiveInt(queryParams.page, 1);
  const pageSize = Math.min(toPositiveInt(queryParams.pageSize, 6), 24);
  const sort = normalizeSort(String(queryParams.sort ?? 'newest'));
  const requestedDifficulty = String(queryParams.difficulty ?? 'all').trim();
  const difficulty = normalizeDifficulty(requestedDifficulty);
  const difficultyMeta = difficulty === 'all' ? 'all' : requestedDifficulty;
  const maxTotalMinutesInput = toPositiveInt(queryParams.maxTotalMinutes, 0);
  const maxTotalMinutes = maxTotalMinutesInput > 0 ? maxTotalMinutesInput : null;
  // Public listing defaults to PUBLISHED only; pass status='all' (or a
  // specific status) to include drafts/archived (used by admin views).
  const status = String(queryParams.status ?? 'PUBLISHED').trim().toUpperCase();

  const filtered = recipes.filter((recipe) => {
    const matchesQuery =
      q.length === 0 ||
      recipe.title.toLowerCase().includes(q) ||
      recipe.shortDescription.toLowerCase().includes(q);
    const matchesCategory = category === 'all' || recipe.category === category;
    const recipeDifficulty = normalizeDifficulty(String(recipe.difficulty ?? 'all').trim());
    const matchesDifficulty = difficulty === 'all' || recipeDifficulty === difficulty;
    const recipeStatus = String(recipe.status ?? 'PUBLISHED').toUpperCase();
    const matchesStatus = status === 'ALL' || recipeStatus === status;
    const totalMinutes = Number(recipe.preparationTime ?? 0) + Number(recipe.cookingTime ?? 0);
    const matchesMaxTotalMinutes = maxTotalMinutes == null || totalMinutes <= maxTotalMinutes;

    return matchesQuery && matchesCategory && matchesDifficulty && matchesStatus && matchesMaxTotalMinutes;
  });

  const sorted = sortRecipes(filtered, sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const data = sorted.slice(start, start + pageSize);

  return {
    data,
    meta: {
      page: safePage,
      pageSize,
      total,
      totalPages,
      q,
      category,
      sort,
      difficulty: difficultyMeta,
      maxTotalMinutes,
    },
  };
}
