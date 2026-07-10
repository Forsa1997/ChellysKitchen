import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extractRecipeFromHtml } from './recipeHtmlFallback.mjs';

test('extractRecipeFromHtml reads schema.org microdata pages', () => {
  const html = `<!doctype html><html><head><title>Omas Seite</title></head><body>
    <div itemscope itemtype="https://schema.org/Recipe">
      <h1 itemprop="name">Omas Apfelkuchen</h1>
      <p itemprop="description">Der Klassiker vom Blech.</p>
      <img itemprop="image" src="https://example.com/kuchen.jpg" alt="">
      <span itemprop="recipeYield">12 Stücke</span>
      <time itemprop="prepTime" datetime="PT30M">30 Min.</time>
      <time itemprop="cookTime" datetime="PT1H">1 Std.</time>
      <ul>
        <li itemprop="recipeIngredient">500 g Mehl</li>
        <li itemprop="recipeIngredient">3 Eier</li>
        <li itemprop="recipeIngredient">1 Prise Salz</li>
      </ul>
      <div itemprop="recipeInstructions">
        <ol>
          <li>Teig kneten.</li>
          <li>Äpfel schälen.</li>
          <li>Backen.</li>
        </ol>
      </div>
    </div>
  </body></html>`;

  const recipe = extractRecipeFromHtml(html);
  assert.equal(recipe.title, 'Omas Apfelkuchen');
  assert.equal(recipe.shortDescription, 'Der Klassiker vom Blech.');
  assert.equal(recipe.servings, 12);
  assert.equal(recipe.preparationTime, 30);
  assert.equal(recipe.cookingTime, 60);
  assert.equal(recipe.img, 'https://example.com/kuchen.jpg');
  assert.deepEqual(recipe.ingredients, [
    { amount: 500, unit: 'g', name: 'Mehl' },
    { amount: 3, unit: '', name: 'Eier' },
    { amount: 1, unit: 'Prise', name: 'Salz' },
  ]);
  assert.deepEqual(recipe.steps.map((step) => step.instruction), [
    'Teig kneten.',
    'Äpfel schälen.',
    'Backen.',
  ]);
});

test('extractRecipeFromHtml reads microdata with the legacy "ingredients" itemprop and content attributes', () => {
  const html = `<article itemscope itemtype="http://schema.org/Recipe">
    <span itemprop="name">Pfannkuchen</span>
    <meta itemprop="prepTime" content="PT10M">
    <span itemprop="ingredients">250 ml Milch</span>
    <span itemprop="ingredients">2 Eier</span>
    <p itemprop="recipeInstructions">Alles verquirlen und ausbacken.</p>
  </article>`;

  const recipe = extractRecipeFromHtml(html);
  assert.equal(recipe.title, 'Pfannkuchen');
  assert.equal(recipe.preparationTime, 10);
  assert.deepEqual(recipe.ingredients, [
    { amount: 250, unit: 'ml', name: 'Milch' },
    { amount: 2, unit: '', name: 'Eier' },
  ]);
  assert.deepEqual(recipe.steps, [{ stepNumber: 1, instruction: 'Alles verquirlen und ausbacken.' }]);
});

test('extractRecipeFromHtml falls back to German headings with lists', () => {
  const html = `<!doctype html><html><head>
    <title>Blog | Schnelle Tomatensoße</title>
    <meta property="og:title" content="Schnelle Tomatensoße">
    <meta name="description" content="In 20 Minuten fertig.">
    <meta property="og:image" content="https://example.com/sosse.jpg">
  </head><body>
    <h1>Schnelle Tomatensoße</h1>
    <p>Reicht für 3 Portionen.</p>
    <h2>Zutaten</h2>
    <ul>
      <li>1 Dose Tomaten</li>
      <li>2 Zehen Knoblauch</li>
      <li>Salz &amp; Pfeffer</li>
    </ul>
    <h2>Zubereitung</h2>
    <ol>
      <li>Knoblauch anbraten.</li>
      <li>Tomaten dazu, 15&nbsp;Minuten köcheln.</li>
    </ol>
  </body></html>`;

  const recipe = extractRecipeFromHtml(html);
  assert.equal(recipe.title, 'Schnelle Tomatensoße');
  assert.equal(recipe.shortDescription, 'In 20 Minuten fertig.');
  assert.equal(recipe.servings, 3);
  assert.equal(recipe.img, 'https://example.com/sosse.jpg');
  assert.deepEqual(recipe.ingredients, [
    { amount: 1, unit: 'Dose', name: 'Tomaten' },
    { amount: 2, unit: 'Zehen', name: 'Knoblauch' },
    { amount: 0, unit: '', name: 'Salz & Pfeffer' },
  ]);
  assert.deepEqual(recipe.steps, [
    { stepNumber: 1, instruction: 'Knoblauch anbraten.' },
    { stepNumber: 2, instruction: 'Tomaten dazu, 15 Minuten köcheln.' },
  ]);
});

test('extractRecipeFromHtml understands English headings and paragraph steps', () => {
  const html = `<html><head><title>Pancakes</title></head><body>
    <h1>Fluffy Pancakes</h1>
    <h3>Ingredients</h3>
    <ul><li>2 cups flour</li><li>1 egg</li></ul>
    <h3>Instructions</h3>
    <p>Mix everything.</p>
    <p>Fry in butter.</p>
    <h3>Notes</h3>
    <p>Keeps for two days.</p>
  </body></html>`;

  const recipe = extractRecipeFromHtml(html);
  assert.equal(recipe.title, 'Fluffy Pancakes');
  assert.equal(recipe.ingredients.length, 2);
  assert.deepEqual(recipe.steps.map((step) => step.instruction), ['Mix everything.', 'Fry in butter.']);
});

test('extractRecipeFromHtml decodes numeric and named entities', () => {
  const html = `<html><body>
    <h1>Gem&uuml;sepfanne s&#252;&#xDF;-sauer</h1>
    <h2>Zutaten</h2>
    <ul><li>1 Paprika (gr&ouml;&szlig;er)</li></ul>
    <h2>Zubereitung</h2>
    <ol><li>Anbraten &amp; servieren.</li></ol>
  </body></html>`;

  const recipe = extractRecipeFromHtml(html);
  assert.equal(recipe.title, 'Gemüsepfanne süß-sauer');
  assert.equal(recipe.ingredients[0].name, 'Paprika (größer)');
  assert.equal(recipe.steps[0].instruction, 'Anbraten & servieren.');
});

test('extractRecipeFromHtml ignores scripts, styles and nested markup in list items', () => {
  const html = `<html><body>
    <script>var zutaten = ['<li>fake</li>'];</script>
    <style>li { color: red; }</style>
    <h1>Salat</h1>
    <h2>Zutaten</h2>
    <ul><li><span class="amount">100</span> <b>g</b> Feta</li></ul>
    <h2>Zubereitung</h2>
    <ol><li>Alles <em>gut</em> mischen.</li></ol>
  </body></html>`;

  const recipe = extractRecipeFromHtml(html);
  assert.deepEqual(recipe.ingredients, [{ amount: 100, unit: 'g', name: 'Feta' }]);
  assert.deepEqual(recipe.steps, [{ stepNumber: 1, instruction: 'Alles gut mischen.' }]);
});

test('extractRecipeFromHtml returns null when the page has no recognizable recipe', () => {
  assert.equal(extractRecipeFromHtml('<html><body><h1>Impressum</h1><p>Kein Rezept.</p></body></html>'), null);
  assert.equal(extractRecipeFromHtml(''), null);
  // A heading alone is not enough - without ingredients or steps there is nothing to prefill.
  assert.equal(
    extractRecipeFromHtml('<html><body><h1>Kuchen</h1><h2>Zutaten</h2><p>folgt bald</p></body></html>'),
    null,
  );
});

test('extractRecipeFromHtml applies the same defaults as the JSON-LD mapper', () => {
  const html = `<html><body>
    <h1>Minimal</h1>
    <h2>Zutaten</h2>
    <ul><li>Salz</li></ul>
  </body></html>`;

  const recipe = extractRecipeFromHtml(html);
  assert.equal(recipe.servings, 2);
  assert.equal(recipe.preparationTime, 0);
  assert.equal(recipe.cookingTime, 0);
  assert.equal(recipe.img, undefined);
  assert.deepEqual(recipe.steps, []);
});
