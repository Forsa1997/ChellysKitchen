import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildRecipeJsonLd, formatIngredientLine, renderBringHtml } from './bringExport.mts';

const recipe = {
  id: 'r1',
  slug: 'cremige-pasta',
  title: 'Cremige Pasta mit Spinat und Lachs',
  shortDescription: 'Cremige Pasta in Weißweinsauce',
  servings: 4,
  preparationTime: 15,
  cookingTime: 20,
  ingredients: [
    { name: 'Tagliatelle', amount: 500, unit: 'g' },
    { name: 'Sahne', amount: 200, unit: 'ml' },
  ],
};

test('formatIngredientLine renders amount, unit and name', () => {
  assert.equal(formatIngredientLine({ name: 'Mehl', amount: 250, unit: 'g' }, 1), '250 g Mehl');
});

test('formatIngredientLine scales and trims trailing decimals', () => {
  assert.equal(formatIngredientLine({ name: 'Sahne', amount: 200, unit: 'ml' }, 0.5), '100 ml Sahne');
  // Thirds get rounded to something readable instead of 66.66666...
  assert.equal(formatIngredientLine({ name: 'Milch', amount: 200, unit: 'ml' }, 1 / 3), '66.67 ml Milch');
});

test('formatIngredientLine copes with missing unit or amount', () => {
  assert.equal(formatIngredientLine({ name: 'Salz', amount: 1, unit: '' }, 1), '1 Salz');
  assert.equal(formatIngredientLine({ name: 'Pfeffer nach Geschmack', amount: 0, unit: '' }, 1), 'Pfeffer nach Geschmack');
});

test('buildRecipeJsonLd produces a schema.org Recipe with scaled ingredients', () => {
  const jsonLd = buildRecipeJsonLd(recipe, { servings: 2 });

  assert.equal(jsonLd['@context'], 'https://schema.org');
  assert.equal(jsonLd['@type'], 'Recipe');
  assert.equal(jsonLd.name, recipe.title);
  assert.equal(jsonLd.recipeYield, '2');
  assert.deepEqual(jsonLd.recipeIngredient, ['250 g Tagliatelle', '100 ml Sahne']);
});

test('buildRecipeJsonLd falls back to the recipe servings', () => {
  const jsonLd = buildRecipeJsonLd(recipe, {});
  assert.equal(jsonLd.recipeYield, '4');
  assert.deepEqual(jsonLd.recipeIngredient, ['500 g Tagliatelle', '200 ml Sahne']);
});

test('buildRecipeJsonLd ignores invalid servings values', () => {
  for (const servings of [0, -3, NaN, 'abc']) {
    const jsonLd = buildRecipeJsonLd(recipe, { servings });
    assert.equal(jsonLd.recipeYield, '4', `servings=${servings} falls back`);
  }
});

test('renderBringHtml embeds the JSON-LD and escapes script-breaking content', () => {
  const hostile = {
    ...recipe,
    title: 'Böses Rezept </script><script>alert(1)</script>',
    ingredients: [{ name: '</script>Zutat', amount: 1, unit: 'g' }],
  };
  const html = renderBringHtml(hostile, { servings: 4 });

  assert.match(html, /<script type="application\/ld\+json">/);
  assert.ok(!html.includes('</script><script>alert(1)'), 'raw closing script tag must be escaped');
  assert.match(html, /schema\.org/);
});
