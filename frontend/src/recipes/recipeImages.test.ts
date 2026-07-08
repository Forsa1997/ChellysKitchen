import { describe, expect, it } from 'vitest';
import { recipeRenderImage } from './recipeImages';

describe('recipeRenderImage', () => {
  it('maps every bundled recipe illustration to its rendered photo', () => {
    const bundledSlugs = [
      'apfel-zimt-porridge',
      'asia-nudelpfanne',
      'bbq-burger',
      'bbq-rippchen',
      'couscous-salat',
      'gemuese-lasagne',
      'karottentorte',
      'linsen-kokos-suppe',
      'panna-cotta-beeren',
      'pasta-spinat-lachs',
      'schoko-himbeer-brownies',
      'zitronen-haehnchen-blech',
    ];

    for (const slug of bundledSlugs) {
      expect(recipeRenderImage(`/recipe-images/${slug}.svg`)).toBe(`/recipe-images/renders/${slug}.jpg`);
    }
  });

  it('returns null for uploaded or external images', () => {
    expect(recipeRenderImage('https://example.com/pasta.jpg')).toBeNull();
    expect(recipeRenderImage('/uploads/mein-rezept.png')).toBeNull();
  });

  it('returns null for unknown bundled illustrations', () => {
    expect(recipeRenderImage('/recipe-images/unbekanntes-rezept.svg')).toBeNull();
  });

  it('returns null when no image is set', () => {
    expect(recipeRenderImage(undefined)).toBeNull();
    expect(recipeRenderImage(null)).toBeNull();
  });
});
