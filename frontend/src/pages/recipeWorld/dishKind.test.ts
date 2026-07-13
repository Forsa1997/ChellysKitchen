import { describe, expect, it } from 'vitest';
import { dishKindLabels, dishSeed, pickDishKind, type DishKind } from './dishKind';

function recipe(overrides: Partial<{ title: string; category: string; tag: string; ingredients: { name: string; amount: number; unit: string }[] }>) {
  return { title: 'Etwas Leckeres', category: 'Sonstiges', tag: undefined, ingredients: [], ...overrides };
}

describe('pickDishKind', () => {
  it.each<[DishKind, Parameters<typeof recipe>[0]]>([
    ['pasta', { category: 'Pasta' }],
    ['pasta', { title: 'Omas Spaghetti Bolognese' }],
    ['pasta', { title: 'Lasagne al Forno' }],
    ['soup', { category: 'Suppen' }],
    ['soup', { title: 'Kürbissuppe mit Ingwer' }],
    ['soup', { title: 'Linseneintopf' }],
    ['pizza', { category: 'Pizza' }],
    ['pizza', { title: 'Flammkuchen mit Lauch' }],
    ['cake', { category: 'Dessert' }],
    ['cake', { title: 'Schokokuchen' }],
    ['cake', { title: 'Erdbeertorte' }],
    ['cake', { title: 'Blaubeer-Muffins' }],
    ['burger', { title: 'Smashed Burger' }],
    ['salad', { category: 'Salate' }],
    ['salad', { title: 'Bunte Sommer-Bowl' }],
    ['fish', { category: 'Fisch' }],
    ['fish', { title: 'Lachs aus dem Ofen' }],
    ['meat', { title: 'Hähnchenschenkel mit Reis' }],
    ['meat', { title: 'Schnitzel Wiener Art' }],
    ['bread', { category: 'Frühstück' }],
    ['bread', { title: 'Sauerteigbrot' }],
    ['drink', { category: 'Getränke' }],
    ['drink', { title: 'Beeren-Smoothie' }],
    ['fries', { title: 'Pommes rot-weiß' }],
    ['fries', { title: 'Süßkartoffel-Wedges' }],
    ['taco', { title: 'Tacos mit Guacamole' }],
    ['taco', { title: 'Hähnchen-Wrap' }],
    ['casserole', { title: 'Kartoffelgratin' }],
    ['casserole', { title: 'Blumenkohl-Auflauf' }],
    ['pot', { title: 'Wochenend-Experiment' }],
  ])('maps to %s', (expected, overrides) => {
    expect(pickDishKind(recipe(overrides))).toBe(expected);
  });

  it('prefers the category over the title', () => {
    expect(pickDishKind(recipe({ category: 'Suppen', title: 'Pizza-Suppe' }))).toBe('soup');
  });

  it('falls back to ingredient names when title and category say nothing', () => {
    expect(
      pickDishKind(recipe({ ingredients: [{ name: 'Spaghetti', amount: 500, unit: 'g' }] })),
    ).toBe('pasta');
  });

  it('has a German label for every dish kind', () => {
    const kinds: DishKind[] = ['pasta', 'soup', 'pizza', 'cake', 'burger', 'salad', 'fish', 'meat', 'bread', 'drink', 'fries', 'taco', 'casserole', 'pot'];
    for (const kind of kinds) {
      expect(dishKindLabels[kind]).toBeTruthy();
    }
  });
});

describe('dishSeed', () => {
  it('is deterministic per slug and varies between slugs', () => {
    expect(dishSeed('cremige-pasta')).toBe(dishSeed('cremige-pasta'));
    expect(dishSeed('cremige-pasta')).not.toBe(dishSeed('tomatensuppe'));
    expect(dishSeed('x')).toBeGreaterThanOrEqual(0);
    expect(dishSeed('x')).toBeLessThan(1);
  });
});
