import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  extractRecipeFromHtml,
  extractRecipeJsonLd,
  isAllowedImportUrl,
  mapJsonLdToRecipe,
  parseIngredientText,
  parseIsoDurationToMinutes,
} from './recipeImport.mts';

function pageWith(jsonLd: unknown) {
  return `<!doctype html><html><head>
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    </head><body>Hallo</body></html>`;
}

test('extractRecipeJsonLd finds a plain Recipe object', () => {
  const recipe = extractRecipeJsonLd(pageWith({ '@type': 'Recipe', name: 'Kuchen' }));
  assert.equal(recipe?.name, 'Kuchen');
});

test('extractRecipeJsonLd finds recipes in arrays and @graph containers', () => {
  const inArray = extractRecipeJsonLd(pageWith([{ '@type': 'WebSite' }, { '@type': 'Recipe', name: 'A' }]));
  assert.equal(inArray?.name, 'A');

  const inGraph = extractRecipeJsonLd(pageWith({ '@graph': [{ '@type': 'Article' }, { '@type': ['Thing', 'Recipe'], name: 'B' }] }));
  assert.equal(inGraph?.name, 'B');
});

test('extractRecipeJsonLd survives broken scripts and returns null without a recipe', () => {
  const html = `<script type="application/ld+json">{kaputt</script>
    <script type="application/ld+json">{"@type":"Recipe","name":"Trotzdem"}</script>`;
  assert.equal(extractRecipeJsonLd(html)?.name, 'Trotzdem');
  assert.equal(extractRecipeJsonLd('<html><body>nix</body></html>'), null);
});

test('parseIsoDurationToMinutes handles hours and minutes', () => {
  assert.equal(parseIsoDurationToMinutes('PT45M'), 45);
  assert.equal(parseIsoDurationToMinutes('PT1H30M'), 90);
  assert.equal(parseIsoDurationToMinutes('P0DT2H'), 120);
  assert.equal(parseIsoDurationToMinutes('quatsch'), undefined);
  assert.equal(parseIsoDurationToMinutes(undefined), undefined);
});

test('parseIngredientText splits amount, unit and name', () => {
  assert.deepEqual(parseIngredientText('200 g Mehl'), { amount: 200, unit: 'g', name: 'Mehl' });
  assert.deepEqual(parseIngredientText('1,5 EL Honig'), { amount: 1.5, unit: 'EL', name: 'Honig' });
  assert.deepEqual(parseIngredientText('3 Eier'), { amount: 3, unit: '', name: 'Eier' });
  assert.deepEqual(parseIngredientText('1/2 TL Zimt'), { amount: 0.5, unit: 'TL', name: 'Zimt' });
  assert.deepEqual(parseIngredientText('Salz'), { amount: 0, unit: '', name: 'Salz' });
});

test('mapJsonLdToRecipe maps the common schema.org fields', () => {
  const mapped = mapJsonLdToRecipe({
    '@type': 'Recipe',
    name: 'Linsensuppe',
    description: 'Wärmt von innen.',
    recipeYield: '4 Portionen',
    prepTime: 'PT15M',
    cookTime: 'PT40M',
    image: ['https://example.com/suppe.jpg'],
    recipeIngredient: ['250 g Linsen', 'Salz'],
    recipeInstructions: [
      { '@type': 'HowToStep', text: 'Linsen waschen.' },
      'Alles kochen.',
    ],
  });

  assert.equal(mapped.title, 'Linsensuppe');
  assert.equal(mapped.shortDescription, 'Wärmt von innen.');
  assert.equal(mapped.servings, 4);
  assert.equal(mapped.preparationTime, 15);
  assert.equal(mapped.cookingTime, 40);
  assert.equal(mapped.img, 'https://example.com/suppe.jpg');
  assert.deepEqual(mapped.ingredients, [
    { amount: 250, unit: 'g', name: 'Linsen' },
    { amount: 0, unit: '', name: 'Salz' },
  ]);
  assert.deepEqual(mapped.steps, [
    { stepNumber: 1, instruction: 'Linsen waschen.' },
    { stepNumber: 2, instruction: 'Alles kochen.' },
  ]);
});

test('mapJsonLdToRecipe unwraps HowToSection blocks and ImageObject images', () => {
  const mapped = mapJsonLdToRecipe({
    '@type': 'Recipe',
    name: 'Torte',
    image: { '@type': 'ImageObject', url: 'https://example.com/torte.jpg' },
    recipeInstructions: [
      {
        '@type': 'HowToSection',
        itemListElement: [
          { '@type': 'HowToStep', text: 'Teig anrühren.' },
          { '@type': 'HowToStep', text: 'Backen.' },
        ],
      },
    ],
  });

  assert.equal(mapped.img, 'https://example.com/torte.jpg');
  assert.deepEqual(mapped.steps.map((step) => step.instruction), ['Teig anrühren.', 'Backen.']);
});

test('mapJsonLdToRecipe applies sensible defaults', () => {
  const mapped = mapJsonLdToRecipe({ '@type': 'Recipe', name: 'Minimal' });
  assert.equal(mapped.servings, 2);
  assert.equal(mapped.preparationTime, 0);
  assert.equal(mapped.cookingTime, 0);
  assert.deepEqual(mapped.ingredients, []);
  assert.deepEqual(mapped.steps, []);
  assert.equal(mapped.img, undefined);
});

test('extractRecipeFromHtml parses a German page with Zutaten/Zubereitung headings', () => {
  const html = `<!doctype html><html><head>
    <title>Omas Kartoffelsuppe | kochblog.de</title>
    <meta property="og:image" content="https://example.com/suppe.jpg">
    <meta name="description" content="Deftige Suppe wie früher.">
    </head><body>
    <h1>Omas Kartoffelsuppe</h1>
    <p>Reicht für 4 Portionen.</p>
    <h2>Zutaten</h2>
    <ul>
      <li>500 g Kartoffeln</li>
      <li>1 Zwiebel</li>
      <li>Salz &amp; Pfeffer</li>
    </ul>
    <h2>Zubereitung</h2>
    <ol>
      <li>Kartoffeln schälen und würfeln.</li>
      <li>Alles weich kochen und pürieren.</li>
    </ol>
    </body></html>`;

  const recipe = extractRecipeFromHtml(html);
  assert.equal(recipe!.title, 'Omas Kartoffelsuppe');
  assert.equal(recipe!.shortDescription, 'Deftige Suppe wie früher.');
  assert.equal(recipe!.servings, 4);
  assert.equal(recipe!.img, 'https://example.com/suppe.jpg');
  assert.deepEqual(recipe!.ingredients, [
    { amount: 500, unit: 'g', name: 'Kartoffeln' },
    { amount: 1, unit: '', name: 'Zwiebel' },
    { amount: 0, unit: '', name: 'Salz & Pfeffer' },
  ]);
  assert.deepEqual(recipe!.steps, [
    { stepNumber: 1, instruction: 'Kartoffeln schälen und würfeln.' },
    { stepNumber: 2, instruction: 'Alles weich kochen und pürieren.' },
  ]);
});

test('extractRecipeFromHtml prefers microdata itemprops when present', () => {
  const html = `<html><body>
    <h1 itemprop="name">Microdata-Nudeln</h1>
    <span itemprop="recipeIngredient">200 g Nudeln</span>
    <span itemprop="recipeIngredient">1 EL Olivenöl</span>
    <li itemprop="recipeInstructions">Nudeln kochen.</li>
    <li itemprop="recipeInstructions">Öl darüber geben.</li>
    </body></html>`;

  const recipe = extractRecipeFromHtml(html);
  assert.equal(recipe!.title, 'Microdata-Nudeln');
  assert.deepEqual(recipe!.ingredients, [
    { amount: 200, unit: 'g', name: 'Nudeln' },
    { amount: 1, unit: 'EL', name: 'Olivenöl' },
  ]);
  assert.deepEqual(recipe!.steps.map((step) => step.instruction), [
    'Nudeln kochen.',
    'Öl darüber geben.',
  ]);
});

test('extractRecipeFromHtml falls back to paragraphs when steps are not a list', () => {
  const html = `<html><body>
    <h1>Pfannkuchen</h1>
    <h3>Ingredients</h3>
    <ul><li>2 Eier</li><li>250 ml Milch</li></ul>
    <h3>Directions</h3>
    <p>Alles verrühren.</p>
    <p>In der Pfanne ausbacken.</p>
    <h3>Tipps</h3>
    <p>Mit Zimt servieren.</p>
    </body></html>`;

  const recipe = extractRecipeFromHtml(html);
  assert.equal(recipe!.title, 'Pfannkuchen');
  assert.equal(recipe!.servings, 2);
  assert.deepEqual(recipe!.steps.map((step) => step.instruction), [
    'Alles verrühren.',
    'In der Pfanne ausbacken.',
  ]);
});

test('extractRecipeFromHtml decodes umlaut and numeric HTML entities', () => {
  const html = `<html><body><h1>Gr&uuml;ne So&szlig;e</h1>
    <h2>Zutaten</h2><ul><li>1 Bund Petersilie</li><li>&frac12; Zitrone</li></ul>
    <h2>Zubereitung</h2><ol><li>Kr&auml;uter hacken &#8211; fertig.</li></ol>
    </body></html>`;

  const recipe = extractRecipeFromHtml(html);
  assert.equal(recipe!.title, 'Grüne Soße');
  assert.equal(recipe!.ingredients[1].name, '½ Zitrone');
  assert.equal(recipe!.steps[0].instruction, 'Kräuter hacken – fertig.');
});

test('extractRecipeFromHtml uses title/og fallbacks and returns null without ingredients', () => {
  const noRecipe = extractRecipeFromHtml('<html><body><h1>Blogpost</h1><p>Nur Text.</p></body></html>');
  assert.equal(noRecipe, null);

  const withoutH1 = extractRecipeFromHtml(`<html><head>
    <meta property="og:title" content="Schneller Salat">
    </head><body>
    <h2>Zutaten</h2><ul><li>1 Gurke</li></ul>
    </body></html>`);
  assert.equal(withoutH1!.title, 'Schneller Salat');
  assert.deepEqual(withoutH1!.ingredients, [{ amount: 1, unit: '', name: 'Gurke' }]);
  assert.deepEqual(withoutH1!.steps, []);
});

test('isAllowedImportUrl blocks private targets and non-http protocols', () => {
  assert.equal(isAllowedImportUrl('https://www.chefkoch.de/rezepte/123'), true);
  assert.equal(isAllowedImportUrl('http://example.com/x'), true);
  assert.equal(isAllowedImportUrl('ftp://example.com/x'), false);
  assert.equal(isAllowedImportUrl('file:///etc/passwd'), false);
  assert.equal(isAllowedImportUrl('kein url'), false);
  for (const host of ['localhost', '127.0.0.1', '10.0.0.5', '192.168.1.1', '172.16.3.4', '169.254.1.1', '[::1]', 'drucker.local']) {
    assert.equal(isAllowedImportUrl(`http://${host}/seite`), false, `${host} must be blocked`);
  }
});
