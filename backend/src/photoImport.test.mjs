import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildPhotoImportRequest,
  extractRecipeFromPhoto,
  isPhotoImportConfigured,
  parseExtractedRecipe,
} from './photoImport.mjs';

function messageWith(payload, { stopReason = 'end_turn' } = {}) {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    stop_reason: stopReason,
    content: [{ type: 'text', text: JSON.stringify(payload) }],
  };
}

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

test('isPhotoImportConfigured requires an API key', () => {
  assert.equal(isPhotoImportConfigured({}), false);
  assert.equal(isPhotoImportConfigured({ ANTHROPIC_API_KEY: '' }), false);
  assert.equal(isPhotoImportConfigured({ ANTHROPIC_API_KEY: 'sk-test' }), true);
});

test('buildPhotoImportRequest embeds the image and asks for structured JSON', () => {
  const request = buildPhotoImportRequest(
    { mediaType: 'image/jpeg', base64Data: 'QUJD' },
    { model: 'claude-opus-4-8' },
  );

  assert.equal(request.model, 'claude-opus-4-8');
  assert.equal(request.output_config.format.type, 'json_schema');

  const [message] = request.messages;
  assert.equal(message.role, 'user');
  const image = message.content.find((block) => block.type === 'image');
  assert.deepEqual(image.source, { type: 'base64', media_type: 'image/jpeg', data: 'QUJD' });
  const text = message.content.find((block) => block.type === 'text');
  assert.ok(text.text.length > 0);
});

test('parseExtractedRecipe maps a full model answer onto the form shape', () => {
  const recipe = parseExtractedRecipe(messageWith(FULL_RECIPE));

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
});

test('parseExtractedRecipe normalizes messy values', () => {
  const recipe = parseExtractedRecipe(messageWith({
    containsRecipe: true,
    title: '  Suppe  ',
    shortDescription: 42,
    servings: 0,
    preparationTime: -5,
    cookingTime: 'zehn',
    ingredients: [
      '250 g Linsen', // plain line instead of an object
      { amount: '1,5', unit: 'EL', name: ' Öl ' },
      { amount: 1, unit: 'Prise', name: '' }, // no name -> dropped
    ],
    steps: ['Kochen.', '', { instruction: 'Abschmecken.' }],
  }));

  assert.equal(recipe.title, 'Suppe');
  assert.equal(recipe.shortDescription, '');
  assert.equal(recipe.servings, 2); // fallback default
  assert.equal(recipe.preparationTime, 0);
  assert.equal(recipe.cookingTime, 0);
  assert.deepEqual(recipe.ingredients, [
    { amount: 250, unit: 'g', name: 'Linsen' },
    { amount: 1.5, unit: 'EL', name: 'Öl' },
  ]);
  assert.deepEqual(recipe.steps, [
    { stepNumber: 1, instruction: 'Kochen.' },
    { stepNumber: 2, instruction: 'Abschmecken.' },
  ]);
});

test('parseExtractedRecipe returns null when the photo holds no recipe', () => {
  assert.equal(parseExtractedRecipe(messageWith({ containsRecipe: false })), null);
  assert.equal(
    parseExtractedRecipe(messageWith({ containsRecipe: true, title: '', ingredients: [], steps: [] })),
    null,
  );
});

test('parseExtractedRecipe returns null on refusals and unparseable answers', () => {
  assert.equal(parseExtractedRecipe(messageWith({}, { stopReason: 'refusal' })), null);
  assert.equal(
    parseExtractedRecipe({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'kein json' }] }),
    null,
  );
  assert.equal(parseExtractedRecipe({ stop_reason: 'end_turn', content: [] }), null);
});

test('extractRecipeFromPhoto sends the request through the client and parses the answer', async () => {
  const calls = [];
  const client = {
    messages: {
      create: async (params) => {
        calls.push(params);
        return messageWith(FULL_RECIPE);
      },
    },
  };

  const recipe = await extractRecipeFromPhoto(
    { mediaType: 'image/png', base64Data: 'QUJD' },
    { client, model: 'test-model' },
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].model, 'test-model');
  assert.equal(calls[0].messages[0].content.find((b) => b.type === 'image').source.media_type, 'image/png');
  assert.equal(recipe.title, 'Omas Apfelkuchen');
});
