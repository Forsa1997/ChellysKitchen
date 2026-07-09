// Bring! shopping-list integration. The official deeplink opens the Bring
// app (or web app) with an import screen; Bring's servers fetch the passed
// URL and parse the schema.org recipe markup the backend serves under
// /api/recipes/:slug/bring.
const BRING_DEEPLINK_BASE = 'https://api.getbring.com/rest/bringrecipes/deeplink';

export interface BringDeeplinkParams {
  apiBaseUrl: string;
  slug: string;
  servings: number;
}

export function buildBringDeeplink({ apiBaseUrl, slug, servings }: BringDeeplinkParams): string {
  const recipeUrl = new URL(`/api/recipes/${encodeURIComponent(slug)}/bring`, apiBaseUrl);
  recipeUrl.searchParams.set('servings', String(servings));

  const deeplink = new URL(BRING_DEEPLINK_BASE);
  deeplink.searchParams.set('url', recipeUrl.toString());
  deeplink.searchParams.set('source', 'web');
  return deeplink.toString();
}

/** Deeplink for the aggregated shopping list of the whole week plan. */
export function buildWeekPlanBringDeeplink({ apiBaseUrl }: { apiBaseUrl: string }): string {
  const deeplink = new URL(BRING_DEEPLINK_BASE);
  deeplink.searchParams.set('url', new URL('/api/weekplan/bring', apiBaseUrl).toString());
  deeplink.searchParams.set('source', 'web');
  return deeplink.toString();
}
