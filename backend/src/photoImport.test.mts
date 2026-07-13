import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildGeminiPhotoImportRequest,
  extractRecipeFromPhoto,
  extractRecipeViaGemini,
  isPhotoImportConfigured,
  parseGeminiRecipeResponse,
} from './photoImport.mts';

const FULL_RECIPE = {
  containsRecipe: true,
  title: 'Omas Apfelkuchen',
  shortDescription: 'Vom handgeschriebenen Zettel.',
  servings: 8,
  preparationTime: 30,
  cookingTime: 45,
  ingredients: [
    { amount: 200, unit: 'g', name: 'Mehl' },
    { amount: 3, unit: '', name: 'Äpfel' },
  ],
  steps: ['Teig kneten.', 'Äpfel schälen und backen.'],
};

function geminiInteractionWith(payload) {
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

test('isPhotoImportConfigured requires a Gemini API key', () => {
  assert.equal(isPhotoImportConfigured({}), false);
  assert.equal(isPhotoImportConfigured({ GEMINI_API_KEY: '' }), false);
  assert.equal(isPhotoImportConfigured({ GEMINI_API_KEY: 'gemini-test' }), true);
});

test('buildGeminiPhotoImportRequest embeds the image and requests stateless structured JSON', () => {
  const request = buildGeminiPhotoImportRequest(
    { mediaType: 'image/jpeg', base64Data: 'QUJD' },
    { model: 'gemini-test-model' },
  );

  assert.equal(request.model, 'gemini-test-model');
  assert.equal(request.store, false);
  assert.equal(request.response_format.type, 'text');
  assert.equal(request.response_format.mime_type, 'application/json');
  assert.equal(request.response_format.schema.type, 'object');

  const image = request.input.find((entry) => entry.type === 'image');
  assert.deepEqual(image, { type: 'image', data: 'QUJD', mime_type: 'image/jpeg' });
  const text = request.input.find((entry) => entry.type === 'text');
  assert.ok(text.text.length > 0);
  assert.match(text.text, /übersetze.+vollständig ins Deutsche/is);

  assert.equal(
    buildGeminiPhotoImportRequest({ mediaType: 'image/jpeg', base64Data: 'QUJD' }).model,
    'gemini-3.5-flash',
  );
});

test('parseGeminiRecipeResponse maps and normalizes the final model output', () => {
  const recipe = parseGeminiRecipeResponse(geminiInteractionWith(FULL_RECIPE));

  assert.equal(recipe.title, 'Omas Apfelkuchen');
  assert.equal(recipe.shortDescription, 'Vom handgeschriebenen Zettel.');
  assert.equal(recipe.servings, 8);
  assert.equal(recipe.preparationTime, 30);
  assert.equal(recipe.cookingTime, 45);
  assert.deepEqual(recipe.ingredients, [
    { amount: 200, unit: 'g', name: 'Mehl' },
    { amount: 3, unit: '', name: 'Äpfel' },
  ]);
  assert.deepEqual(recipe.steps, [
    { stepNumber: 1, instruction: 'Teig kneten.' },
    { stepNumber: 2, instruction: 'Äpfel schälen und backen.' },
  ]);

  const messy = parseGeminiRecipeResponse(geminiInteractionWith({
    containsRecipe: true,
    title: '  Suppe  ',
    shortDescription: 42,
    servings: 0,
    preparationTime: -5,
    cookingTime: 'zehn',
    ingredients: [
      '250 g Linsen',
      { amount: '1,5', unit: 'EL', name: ' Öl ' },
      { amount: 1, unit: 'Prise', name: '' },
    ],
    steps: ['Kochen.', '', { instruction: 'Abschmecken.' }],
  }));
  assert.equal(messy.title, 'Suppe');
  assert.equal(messy.shortDescription, '');
  assert.equal(messy.servings, 2);
  assert.equal(messy.preparationTime, 0);
  assert.equal(messy.cookingTime, 0);
  assert.deepEqual(messy.ingredients, [
    { amount: 250, unit: 'g', name: 'Linsen' },
    { amount: 1.5, unit: 'EL', name: 'Öl' },
  ]);
  assert.deepEqual(messy.steps, [
    { stepNumber: 1, instruction: 'Kochen.' },
    { stepNumber: 2, instruction: 'Abschmecken.' },
  ]);
});

test('parseGeminiRecipeResponse returns null for no recipe and rejects broken answers', () => {
  assert.equal(parseGeminiRecipeResponse(geminiInteractionWith({ containsRecipe: false })), null);
  assert.equal(
    parseGeminiRecipeResponse(geminiInteractionWith({
      containsRecipe: true,
      title: '',
      ingredients: [],
      steps: [],
    })),
    null,
  );
  assert.throws(() => parseGeminiRecipeResponse({ status: 'failed', steps: [] }));
  assert.throws(() => parseGeminiRecipeResponse({ status: 'completed', steps: [] }));
  assert.throws(() => parseGeminiRecipeResponse(geminiInteractionWith('kein json')));
});

test('extractRecipeViaGemini posts to the configured API with the Gemini key', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      json: async () => geminiInteractionWith(FULL_RECIPE),
    };
  };

  const recipe = await extractRecipeViaGemini(
    { mediaType: 'image/png', base64Data: 'QUJD' },
    {
      fetchImpl,
      env: {
        GEMINI_API_KEY: 'gemini-secret',
        GEMINI_BASE_URL: 'http://127.0.0.1:9/v1beta',
      },
    },
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://127.0.0.1:9/v1beta/interactions');
  assert.equal(calls[0].init.headers['x-goog-api-key'], 'gemini-secret');
  assert.equal(recipe.title, 'Omas Apfelkuchen');
});

test('extractRecipeViaGemini throws on HTTP errors', async () => {
  const fetchImpl = async () => ({ ok: false, status: 500, json: async () => ({}) });
  await assert.rejects(() => extractRecipeViaGemini(
    { mediaType: 'image/png', base64Data: 'QUJD' },
    { fetchImpl, env: { GEMINI_API_KEY: 'gemini-secret' } },
  ));
});

test('extractRecipeFromPhoto uses Gemini as its only provider', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return { ok: true, status: 200, json: async () => geminiInteractionWith(FULL_RECIPE) };
  };

  const recipe = await extractRecipeFromPhoto(
    { mediaType: 'image/png', base64Data: 'QUJD' },
    {
      env: {
        GEMINI_API_KEY: 'gemini-secret',
      },
      fetchImpl,
    },
  );

  assert.equal(recipe.title, 'Omas Apfelkuchen');
  assert.equal(calls, 1);
});

test('extractRecipeFromPhoto rejects missing Gemini configuration', async () => {
  await assert.rejects(
    () => extractRecipeFromPhoto(
      { mediaType: 'image/png', base64Data: 'QUJD' },
      { env: {} },
    ),
    /nicht konfiguriert/i,
  );
});
