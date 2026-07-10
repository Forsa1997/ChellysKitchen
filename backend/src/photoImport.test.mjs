import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildOpenAiPhotoImportRequest,
  buildPhotoImportRequest,
  extractRecipeFromPhoto,
  extractRecipeViaOpenAi,
  isPhotoImportConfigured,
  parseExtractedRecipe,
  parseOpenAiRecipeResponse,
} from './photoImport.mjs';

function anthropicMessageWith(payload, { stopReason = 'end_turn' } = {}) {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    stop_reason: stopReason,
    content: [{ type: 'text', text: JSON.stringify(payload) }],
  };
}

function openAiResponseWith(payload, { refusal = null } = {}) {
  return {
    id: 'chatcmpl_test',
    choices: [{
      index: 0,
      finish_reason: 'stop',
      message: { role: 'assistant', content: refusal ? null : JSON.stringify(payload), refusal },
    }],
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

test('isPhotoImportConfigured accepts either provider key', () => {
  assert.equal(isPhotoImportConfigured({}), false);
  assert.equal(isPhotoImportConfigured({ ANTHROPIC_API_KEY: '', OPENAI_API_KEY: '' }), false);
  assert.equal(isPhotoImportConfigured({ ANTHROPIC_API_KEY: 'sk-test' }), true);
  assert.equal(isPhotoImportConfigured({ OPENAI_API_KEY: 'sk-openai' }), true);
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

test('buildOpenAiPhotoImportRequest embeds the image as data URL with a strict schema', () => {
  const request = buildOpenAiPhotoImportRequest(
    { mediaType: 'image/jpeg', base64Data: 'QUJD' },
    { model: 'gpt-5.1' },
  );

  assert.equal(request.model, 'gpt-5.1');
  // Without an explicit model (and no PHOTO_IMPORT_OPENAI_MODEL in the test
  // env) the default applies.
  assert.equal(buildOpenAiPhotoImportRequest({ mediaType: 'image/jpeg', base64Data: 'QUJD' }).model, 'gpt-5.5');
  assert.equal(request.response_format.type, 'json_schema');
  assert.equal(request.response_format.json_schema.strict, true);

  const [message] = request.messages;
  assert.equal(message.role, 'user');
  const image = message.content.find((block) => block.type === 'image_url');
  assert.equal(image.image_url.url, 'data:image/jpeg;base64,QUJD');
  const text = message.content.find((block) => block.type === 'text');
  assert.ok(text.text.length > 0);
});

test('parseExtractedRecipe maps a full model answer onto the form shape', () => {
  const recipe = parseExtractedRecipe(anthropicMessageWith(FULL_RECIPE));

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
  const recipe = parseExtractedRecipe(anthropicMessageWith({
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
  assert.equal(parseExtractedRecipe(anthropicMessageWith({ containsRecipe: false })), null);
  assert.equal(
    parseExtractedRecipe(anthropicMessageWith({ containsRecipe: true, title: '', ingredients: [], steps: [] })),
    null,
  );
});

test('parseExtractedRecipe throws on refusals and unparseable answers', () => {
  // A broken provider answer must throw so the caller can fall back to the
  // next provider — only a clean "no recipe" answer returns null.
  assert.throws(() => parseExtractedRecipe(anthropicMessageWith({}, { stopReason: 'refusal' })));
  assert.throws(() => parseExtractedRecipe({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'kein json' }] }));
  assert.throws(() => parseExtractedRecipe({ stop_reason: 'end_turn', content: [] }));
});

test('parseOpenAiRecipeResponse mirrors the Anthropic contract', () => {
  const recipe = parseOpenAiRecipeResponse(openAiResponseWith(FULL_RECIPE));
  assert.equal(recipe.title, 'Omas Apfelkuchen');
  assert.deepEqual(recipe.steps[1], { stepNumber: 2, instruction: 'Äpfel schälen und backen.' });

  assert.equal(parseOpenAiRecipeResponse(openAiResponseWith({ containsRecipe: false })), null);
  assert.throws(() => parseOpenAiRecipeResponse(openAiResponseWith({}, { refusal: 'Nein.' })));
  assert.throws(() => parseOpenAiRecipeResponse({ choices: [] }));
  assert.throws(() => parseOpenAiRecipeResponse({
    choices: [{ message: { role: 'assistant', content: 'kein json' } }],
  }));
});

test('extractRecipeViaOpenAi posts to the configured base URL with the API key', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      json: async () => openAiResponseWith(FULL_RECIPE),
    };
  };

  const recipe = await extractRecipeViaOpenAi(
    { mediaType: 'image/png', base64Data: 'QUJD' },
    {
      fetchImpl,
      env: { OPENAI_API_KEY: 'sk-openai', OPENAI_BASE_URL: 'http://127.0.0.1:9/v1' },
    },
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://127.0.0.1:9/v1/chat/completions');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer sk-openai');
  assert.equal(recipe.title, 'Omas Apfelkuchen');
});

test('extractRecipeViaOpenAi throws on HTTP errors', async () => {
  const fetchImpl = async () => ({ ok: false, status: 500, json: async () => ({}) });
  await assert.rejects(() => extractRecipeViaOpenAi(
    { mediaType: 'image/png', base64Data: 'QUJD' },
    { fetchImpl, env: { OPENAI_API_KEY: 'sk-openai' } },
  ));
});

test('extractRecipeFromPhoto asks OpenAI first and skips Anthropic on success', async () => {
  let anthropicCalled = false;
  const fetchImpl = async () => ({ ok: true, status: 200, json: async () => openAiResponseWith(FULL_RECIPE) });
  const anthropicClient = {
    messages: { create: async () => { anthropicCalled = true; return anthropicMessageWith(FULL_RECIPE); } },
  };

  const recipe = await extractRecipeFromPhoto(
    { mediaType: 'image/png', base64Data: 'QUJD' },
    { env: { OPENAI_API_KEY: 'sk-openai', ANTHROPIC_API_KEY: 'sk-ant' }, fetchImpl, anthropicClient },
  );

  assert.equal(recipe.title, 'Omas Apfelkuchen');
  assert.equal(anthropicCalled, false);
});

test('extractRecipeFromPhoto falls back to Anthropic when OpenAI fails', async () => {
  const fetchImpl = async () => ({ ok: false, status: 503, json: async () => ({}) });
  const anthropicClient = {
    messages: { create: async () => anthropicMessageWith(FULL_RECIPE) },
  };

  const recipe = await extractRecipeFromPhoto(
    { mediaType: 'image/png', base64Data: 'QUJD' },
    { env: { OPENAI_API_KEY: 'sk-openai', ANTHROPIC_API_KEY: 'sk-ant' }, fetchImpl, anthropicClient },
  );

  assert.equal(recipe.title, 'Omas Apfelkuchen');
});

test('extractRecipeFromPhoto does not fall back when OpenAI cleanly finds no recipe', async () => {
  let anthropicCalled = false;
  const fetchImpl = async () => ({ ok: true, status: 200, json: async () => openAiResponseWith({ containsRecipe: false }) });
  const anthropicClient = {
    messages: { create: async () => { anthropicCalled = true; return anthropicMessageWith(FULL_RECIPE); } },
  };

  const recipe = await extractRecipeFromPhoto(
    { mediaType: 'image/png', base64Data: 'QUJD' },
    { env: { OPENAI_API_KEY: 'sk-openai', ANTHROPIC_API_KEY: 'sk-ant' }, fetchImpl, anthropicClient },
  );

  assert.equal(recipe, null);
  assert.equal(anthropicCalled, false);
});

test('extractRecipeFromPhoto works with Anthropic alone and rethrows when all providers fail', async () => {
  const anthropicClient = {
    messages: { create: async () => anthropicMessageWith(FULL_RECIPE) },
  };
  const recipe = await extractRecipeFromPhoto(
    { mediaType: 'image/png', base64Data: 'QUJD' },
    { env: { ANTHROPIC_API_KEY: 'sk-ant' }, anthropicClient },
  );
  assert.equal(recipe.title, 'Omas Apfelkuchen');

  const failingFetch = async () => ({ ok: false, status: 500, json: async () => ({}) });
  const failingClient = { messages: { create: async () => { throw new Error('down'); } } };
  await assert.rejects(() => extractRecipeFromPhoto(
    { mediaType: 'image/png', base64Data: 'QUJD' },
    {
      env: { OPENAI_API_KEY: 'sk-openai', ANTHROPIC_API_KEY: 'sk-ant' },
      fetchImpl: failingFetch,
      anthropicClient: failingClient,
    },
  ));
});
