import { recipes } from '../data/recipes.mts';
import type { Recipe } from '../src/types.mts';

const defaultApiBaseUrl = 'https://chellys-kitchen-api.onrender.com';
const defaultUsername = 'demo';
const defaultPassword = 'demo1234';

export function selectMissingRecipes<T extends Pick<Recipe, 'slug'>>(localRecipes: T[], remoteRecipes: Array<Pick<Recipe, 'slug'>>): T[] {
  const remoteSlugs = new Set(remoteRecipes.map((recipe) => recipe.slug));
  return localRecipes.filter((recipe) => recipe.slug && !remoteSlugs.has(recipe.slug));
}

function toApiPayload(recipe: Recipe) {
  return {
    title: recipe.title,
    shortDescription: recipe.shortDescription,
    description: recipe.description,
    category: recipe.category,
    tag: recipe.tag,
    difficulty: recipe.difficulty,
    servings: recipe.servings,
    preparationTime: recipe.preparationTime,
    cookingTime: recipe.cookingTime,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    img: recipe.img,
  };
}

// API responses are used loosely here (accessToken, data, slug) — the
// server owns their shapes.
async function requestJson(url: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${options.method ?? 'GET'} ${url} failed with ${response.status}: ${body}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function uploadMissingRecipes({
  apiBaseUrl = process.env.CHELLYS_API_BASE_URL ?? defaultApiBaseUrl,
  username = process.env.CHELLYS_UPLOAD_USERNAME ?? process.env.CHELLYS_UPLOAD_EMAIL ?? defaultUsername,
  password = process.env.CHELLYS_UPLOAD_PASSWORD ?? defaultPassword,
  localRecipes = recipes,
} = {}) {
  const login = await requestJson(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const remote = await requestJson(`${apiBaseUrl}/api/recipes?pageSize=24`, {
    headers: { Authorization: `Bearer ${login.accessToken}` },
  });
  const missingRecipes = selectMissingRecipes(localRecipes, remote.data ?? []);
  const uploaded: any[] = [];

  for (const recipe of missingRecipes) {
    const created = await requestJson(`${apiBaseUrl}/api/recipes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${login.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(toApiPayload(recipe)),
    });
    uploaded.push(created);
  }

  return {
    uploaded,
    skipped: localRecipes.length - missingRecipes.length,
  };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  uploadMissingRecipes()
    .then((result) => {
      console.log(`Uploaded ${result.uploaded.length} recipes; skipped ${result.skipped}.`);
      for (const recipe of result.uploaded) {
        console.log(`- ${recipe.slug}`);
      }
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
