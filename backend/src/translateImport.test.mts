import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ImportedRecipe } from './recipeImport.mts';
import {
  buildGeminiTranslationRequest,
  looksGerman,
  translateImportedRecipe,
} from './translateImport.mts';

const ENGLISH_RECIPE: ImportedRecipe = {
  title: 'Creamy Tomato Soup',
  shortDescription: 'A quick weeknight soup.',
  servings: 4,
  preparationTime: 10,
  cookingTime: 25,
  img: 'https://example.com/soup.jpg',
  ingredients: [
    { amount: 800, unit: 'g', name: 'canned tomatoes' },
    { amount: 1, unit: '', name: 'onion, finely chopped' },
  ],
  steps: [
    { stepNumber: 1, instruction: 'Sauté the onion until soft.' },
    { stepNumber: 2, instruction: 'Add the tomatoes and simmer.' },
  ],
};

const GERMAN_RECIPE: ImportedRecipe = {
  title: 'Linsensuppe',
  shortDescription: 'Ein deftiger Klassiker.',
  servings: 4,
  preparationTime: 15,
  cookingTime: 40,
  ingredients: [{ amount: 250, unit: 'g', name: 'Linsen' }],
  steps: [{ stepNumber: 1, instruction: 'Alles zusammen weich kochen und abschmecken.' }],
};

const TRANSLATION = {
  title: 'Cremige Tomatensuppe',
  shortDescription: 'Eine schnelle Suppe für den Feierabend.',
  ingredients: [
    { amount: 800, unit: 'g', name: 'Dosentomaten' },
    { amount: 1, unit: '', name: 'Zwiebel, fein gehackt' },
  ],
  steps: ['Die Zwiebel glasig anbraten.', 'Die Tomaten dazugeben und köcheln lassen.'],
};

function geminiInteractionWith(payload: unknown) {
  return {
    id: 'interaction_test',
    status: 'completed',
    steps: [
      { type: 'user_input', content: [] },
      {
        type: 'model_output',
        content: [{ type: 'text', text: JSON.stringify(payload) }],
      },
    ],
  };
}

test('looksGerman recognizes German recipes via umlauts or common words', () => {
  assert.equal(looksGerman(GERMAN_RECIPE), true);

  // No umlauts, but unmistakably German wording.
  assert.equal(
    looksGerman({
      ...GERMAN_RECIPE,
      title: 'Nudeln in Tomatensauce',
      shortDescription: '',
      ingredients: [{ amount: 500, unit: 'g', name: 'Nudeln' }],
      steps: [{ stepNumber: 1, instruction: 'Nudeln kochen und die Sauce dazu geben.' }],
    }),
    true,
  );

  assert.equal(looksGerman(ENGLISH_RECIPE), false);
});

test('buildGeminiTranslationRequest sends the recipe as stateless structured-JSON request', () => {
  const request = buildGeminiTranslationRequest(ENGLISH_RECIPE, { model: 'gemini-test-model' });

  assert.equal(request.model, 'gemini-test-model');
  assert.equal(request.store, false);
  assert.equal(request.response_format.type, 'text');
  assert.equal(request.response_format.mime_type, 'application/json');
  assert.equal(request.response_format.schema.type, 'object');

  const text = request.input.find((entry) => entry.type === 'text') as { type: string; text: string };
  assert.match(text.text, /ins Deutsche/i);
  assert.match(text.text, /Creamy Tomato Soup/);
  assert.match(text.text, /canned tomatoes/);

  assert.equal(buildGeminiTranslationRequest(ENGLISH_RECIPE).model, 'gemini-3.5-flash');
  assert.equal(
    buildGeminiTranslationRequest(ENGLISH_RECIPE, { env: { RECIPE_TRANSLATE_MODEL: 'gemini-env-model' } }).model,
    'gemini-env-model',
  );
});

test('translateImportedRecipe skips Gemini without an API key', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return { ok: true, status: 200, json: async () => geminiInteractionWith(TRANSLATION) };
  };

  const result = await translateImportedRecipe(ENGLISH_RECIPE, { env: {}, fetchImpl });

  assert.equal(calls, 0);
  assert.equal(result.translated, false);
  assert.deepEqual(result.recipe, ENGLISH_RECIPE);
});

test('translateImportedRecipe leaves German recipes untouched without calling Gemini', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return { ok: true, status: 200, json: async () => geminiInteractionWith(TRANSLATION) };
  };

  const result = await translateImportedRecipe(GERMAN_RECIPE, {
    env: { GEMINI_API_KEY: 'gemini-secret' },
    fetchImpl,
  });

  assert.equal(calls, 0);
  assert.equal(result.translated, false);
  assert.deepEqual(result.recipe, GERMAN_RECIPE);
});

test('translateImportedRecipe translates foreign recipes via Gemini', async () => {
  const calls: any[] = [];
  const fetchImpl = async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return { ok: true, status: 200, json: async () => geminiInteractionWith(TRANSLATION) };
  };

  const result = await translateImportedRecipe(ENGLISH_RECIPE, {
    env: { GEMINI_API_KEY: 'gemini-secret', GEMINI_BASE_URL: 'http://127.0.0.1:9/v1beta' },
    fetchImpl,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://127.0.0.1:9/v1beta/interactions');
  assert.equal((calls[0].init.headers as Record<string, string>)['x-goog-api-key'], 'gemini-secret');

  assert.equal(result.translated, true);
  assert.equal(result.recipe.title, 'Cremige Tomatensuppe');
  assert.equal(result.recipe.shortDescription, 'Eine schnelle Suppe für den Feierabend.');
  assert.deepEqual(result.recipe.ingredients, [
    { amount: 800, unit: 'g', name: 'Dosentomaten' },
    { amount: 1, unit: '', name: 'Zwiebel, fein gehackt' },
  ]);
  assert.deepEqual(result.recipe.steps, [
    { stepNumber: 1, instruction: 'Die Zwiebel glasig anbraten.' },
    { stepNumber: 2, instruction: 'Die Tomaten dazugeben und köcheln lassen.' },
  ]);

  // Non-text fields survive translation untouched.
  assert.equal(result.recipe.servings, ENGLISH_RECIPE.servings);
  assert.equal(result.recipe.preparationTime, ENGLISH_RECIPE.preparationTime);
  assert.equal(result.recipe.cookingTime, ENGLISH_RECIPE.cookingTime);
  assert.equal(result.recipe.img, ENGLISH_RECIPE.img);
});

test('translateImportedRecipe keeps original fields when the translation is incomplete', async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => geminiInteractionWith({
      title: '   ',
      shortDescription: '',
      // Wrong number of ingredients: do not trust a list the model reshaped.
      ingredients: [{ amount: 800, unit: 'g', name: 'Dosentomaten' }],
      steps: [],
    }),
  });

  const result = await translateImportedRecipe(ENGLISH_RECIPE, {
    env: { GEMINI_API_KEY: 'gemini-secret' },
    fetchImpl,
  });

  assert.equal(result.translated, true);
  assert.equal(result.recipe.title, ENGLISH_RECIPE.title);
  assert.equal(result.recipe.shortDescription, ENGLISH_RECIPE.shortDescription);
  assert.deepEqual(result.recipe.ingredients, ENGLISH_RECIPE.ingredients);
  assert.deepEqual(result.recipe.steps, ENGLISH_RECIPE.steps);
});

test('translateImportedRecipe falls back to the original recipe on Gemini failures', async () => {
  const httpError = await translateImportedRecipe(ENGLISH_RECIPE, {
    env: { GEMINI_API_KEY: 'gemini-secret' },
    fetchImpl: async () => ({ ok: false, status: 500, json: async () => ({}) }),
  });
  assert.equal(httpError.translated, false);
  assert.deepEqual(httpError.recipe, ENGLISH_RECIPE);

  const brokenJson = await translateImportedRecipe(ENGLISH_RECIPE, {
    env: { GEMINI_API_KEY: 'gemini-secret' },
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => geminiInteractionWith('kein json-objekt') }),
  });
  assert.equal(brokenJson.translated, false);
  assert.deepEqual(brokenJson.recipe, ENGLISH_RECIPE);

  const networkError = await translateImportedRecipe(ENGLISH_RECIPE, {
    env: { GEMINI_API_KEY: 'gemini-secret' },
    fetchImpl: async () => { throw new Error('offline'); },
  });
  assert.equal(networkError.translated, false);
  assert.deepEqual(networkError.recipe, ENGLISH_RECIPE);
});
