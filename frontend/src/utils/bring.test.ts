import { describe, expect, it } from 'vitest';
import { buildBringDeeplink, buildWeekPlanBringDeeplink } from './bring';

describe('buildBringDeeplink', () => {
  it('points Bring at the backend recipe page with the selected servings', () => {
    const link = buildBringDeeplink({
      apiBaseUrl: 'https://chellys-kitchen-api.onrender.com',
      slug: 'cremige-pasta',
      servings: 6,
    });

    const url = new URL(link);
    expect(url.origin).toBe('https://api.getbring.com');
    expect(url.pathname).toBe('/rest/bringrecipes/deeplink');
    expect(url.searchParams.get('source')).toBe('web');
    expect(url.searchParams.get('url')).toBe(
      'https://chellys-kitchen-api.onrender.com/api/recipes/cremige-pasta/bring?servings=6',
    );
  });

  it('builds the aggregated week plan deeplink', () => {
    const link = buildWeekPlanBringDeeplink({ apiBaseUrl: 'https://api.example.com' });

    const url = new URL(link);
    expect(url.origin).toBe('https://api.getbring.com');
    expect(url.searchParams.get('url')).toBe('https://api.example.com/api/weekplan/bring');
    expect(url.searchParams.get('source')).toBe('web');
  });

  it('URL-encodes slugs safely', () => {
    const link = buildBringDeeplink({
      apiBaseUrl: 'http://localhost:4000',
      slug: 'kaese/spaetzle',
      servings: 2,
    });

    const inner = new URL(link).searchParams.get('url');
    expect(inner).toContain('kaese%2Fspaetzle');
  });
});
