const ALLOWED_SORTS = new Set(['newest', 'oldest', 'title_asc', 'title_desc']);
const ALLOWED_DIFFICULTIES = new Set(['Einfach', 'Mittel', 'Schwer']);

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeSort(sort) {
  return ALLOWED_SORTS.has(sort) ? sort : 'newest';
}

function normalizeDifficulty(difficulty) {
  return ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'all';
}

function sortRecipes(recipes, sort) {
  const copied = [...recipes];

  if (sort === 'oldest') {
    copied.sort((a, b) => new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime());
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

  copied.sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
  return copied;
}

export function queryRecipes(recipes, queryParams = {}) {
  const q = String(queryParams.q ?? '').trim().toLowerCase();
  const category = String(queryParams.category ?? 'all').trim();
  const page = toPositiveInt(queryParams.page, 1);
  const pageSize = Math.min(toPositiveInt(queryParams.pageSize, 6), 24);
  const sort = normalizeSort(String(queryParams.sort ?? 'newest'));
  const difficulty = normalizeDifficulty(String(queryParams.difficulty ?? 'all').trim());
  const maxTotalMinutesInput = toPositiveInt(queryParams.maxTotalMinutes, 0);
  const maxTotalMinutes = maxTotalMinutesInput > 0 ? maxTotalMinutesInput : null;

  const filtered = recipes.filter((recipe) => {
    const matchesQuery =
      q.length === 0 ||
      recipe.title.toLowerCase().includes(q) ||
      recipe.shortDescription.toLowerCase().includes(q);
    const matchesCategory = category === 'all' || recipe.category === category;
    const matchesDifficulty = difficulty === 'all' || recipe.difficulty === difficulty;
    const totalMinutes = Number(recipe.preparationTime ?? 0) + Number(recipe.cookingTime ?? 0);
    const matchesMaxTotalMinutes = maxTotalMinutes == null || totalMinutes <= maxTotalMinutes;

    return matchesQuery && matchesCategory && matchesDifficulty && matchesMaxTotalMinutes;
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
      difficulty,
      maxTotalMinutes,
    },
  };
}
