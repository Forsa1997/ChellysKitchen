// Import recipes from a photo (cookbook page, handwritten note, screenshot).
// The image goes to a vision model which returns the recipe as structured
// JSON; the result is mapped onto the create-form shape — like the URL
// import, nothing is saved.
//
// Provider chain: OpenAI first (OPENAI_API_KEY), Anthropic as fallback
// (ANTHROPIC_API_KEY). The fallback only kicks in on technical failures
// (API unreachable, broken answer) — a clean "no recipe on this photo"
// answer is final and does not trigger a second, paid call. Both base URLs
// are overridable (OPENAI_BASE_URL / ANTHROPIC_BASE_URL), which the
// end-to-end tests use to point at a mock server.

import { parseIngredientText } from './recipeImport.mjs';

const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-4-8';
const DEFAULT_OPENAI_MODEL = 'gpt-5.1';
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
// The user is waiting in the create form — cap calls well below the
// providers' multi-minute defaults.
const REQUEST_TIMEOUT_MS = 120_000;

// Structured output keeps the model answer machine-readable: the schema is
// enforced provider-side, so parsing never has to fight prose or code
// fences. Every property is required and additionalProperties is false —
// both Anthropic structured outputs and OpenAI strict mode demand that.
const RECIPE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'containsRecipe', 'title', 'shortDescription', 'servings',
    'preparationTime', 'cookingTime', 'ingredients', 'steps',
  ],
  properties: {
    containsRecipe: {
      type: 'boolean',
      description: 'false, wenn auf dem Foto kein Rezept zu erkennen ist',
    },
    title: { type: 'string' },
    shortDescription: { type: 'string' },
    servings: { type: 'integer' },
    preparationTime: { type: 'integer', description: 'Vorbereitungszeit in Minuten' },
    cookingTime: { type: 'integer', description: 'Koch-/Backzeit in Minuten' },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['amount', 'unit', 'name'],
        properties: {
          amount: { type: 'number' },
          unit: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
    steps: { type: 'array', items: { type: 'string' } },
  },
};

const PROMPT = `Auf dem Bild ist ein Rezept zu sehen — z. B. eine Kochbuchseite,
ein handgeschriebener Zettel oder ein Bildschirmfoto. Extrahiere das Rezept
vollständig und originalgetreu (Sprache des Rezepts beibehalten, Deutsch bevorzugen).

Regeln:
- containsRecipe: false, wenn kein Rezept erkennbar ist (dann alle anderen Felder leer/0).
- Zutaten einzeln mit Menge (Zahl), Einheit (z. B. g, kg, ml, l, EL, TL, Stk, Prise —
  leer lassen, wenn keine Einheit dasteht) und Name. Unleserliche Mengen als 0.
- servings: Portionsangabe vom Foto, sonst 2.
- preparationTime/cookingTime in Minuten, unbekannt = 0.
- steps: die Zubereitungsschritte in Reihenfolge, ein Schritt pro Eintrag,
  als vollständige Sätze.
- shortDescription: ein kurzer Satz, was das Gericht ist (aus dem Foto oder
  neutral abgeleitet).`;

export function isPhotoImportConfigured(env = process.env) {
  return Boolean(env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY);
}

// ---------------------------------------------------------------------------
// Shared normalization: both providers answer with the same JSON schema.
// ---------------------------------------------------------------------------

function toMinutes(value) {
  const minutes = Math.round(Number(value));
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
}

function normalizeIngredient(entry) {
  if (typeof entry === 'string') {
    return parseIngredientText(entry);
  }
  if (!entry || typeof entry !== 'object') return null;
  const amount = Number(String(entry.amount ?? 0).replace(',', '.'));
  return {
    amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
    unit: String(entry.unit ?? '').trim(),
    name: String(entry.name ?? '').trim(),
  };
}

function normalizeStep(entry) {
  const instruction = typeof entry === 'string' ? entry : String(entry?.instruction ?? '');
  return instruction.trim();
}

/**
 * Map the parsed schema JSON onto the recipe form shape.
 * Returns null when the model reports the photo holds no recipe.
 */
function normalizeParsedRecipe(parsed) {
  if (!parsed || typeof parsed !== 'object' || parsed.containsRecipe === false) return null;

  const title = String(parsed.title ?? '').trim();
  const ingredients = (Array.isArray(parsed.ingredients) ? parsed.ingredients : [])
    .map((entry) => normalizeIngredient(entry))
    .filter((ingredient) => ingredient?.name);
  const steps = (Array.isArray(parsed.steps) ? parsed.steps : [])
    .map((entry) => normalizeStep(entry))
    .filter(Boolean)
    .map((instruction, index) => ({ stepNumber: index + 1, instruction }));

  if (!title && ingredients.length === 0 && steps.length === 0) return null;

  const servings = Math.round(Number(parsed.servings));
  return {
    title,
    shortDescription: typeof parsed.shortDescription === 'string' ? parsed.shortDescription.trim() : '',
    servings: Number.isFinite(servings) && servings >= 1 ? servings : 2,
    preparationTime: toMinutes(parsed.preparationTime),
    cookingTime: toMinutes(parsed.cookingTime),
    ingredients,
    steps,
  };
}

// ---------------------------------------------------------------------------
// OpenAI (primary)
// ---------------------------------------------------------------------------

export function buildOpenAiPhotoImportRequest({ mediaType, base64Data }, { model } = {}) {
  return {
    model: model ?? process.env.PHOTO_IMPORT_OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL,
    max_completion_tokens: 16000,
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'rezept_extraktion', strict: true, schema: RECIPE_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64Data}` } },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  };
}

/**
 * Map an OpenAI chat-completions answer onto the recipe form shape.
 * Returns null for a clean "no recipe" answer; throws on refusals or
 * broken answers so the caller can fall back to the next provider.
 */
export function parseOpenAiRecipeResponse(json) {
  const message = json?.choices?.[0]?.message;
  if (!message || message.refusal || typeof message.content !== 'string') {
    throw new Error('OpenAI hat keine verwertbare Antwort geliefert.');
  }
  return normalizeParsedRecipe(JSON.parse(message.content));
}

export async function extractRecipeViaOpenAi(
  { mediaType, base64Data },
  { fetchImpl = fetch, env = process.env, model } = {},
) {
  const baseUrl = (env.OPENAI_BASE_URL ?? DEFAULT_OPENAI_BASE_URL).replace(/\/$/, '');
  const response = await fetchImpl(`${baseUrl}/chat/completions`, {
    method: 'POST',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(buildOpenAiPhotoImportRequest({ mediaType, base64Data }, { model })),
  });
  if (!response.ok) {
    throw new Error(`OpenAI antwortete mit HTTP ${response.status}.`);
  }
  return parseOpenAiRecipeResponse(await response.json());
}

// ---------------------------------------------------------------------------
// Anthropic (fallback)
// ---------------------------------------------------------------------------

export function buildPhotoImportRequest({ mediaType, base64Data }, { model } = {}) {
  return {
    model: model ?? process.env.PHOTO_IMPORT_MODEL ?? DEFAULT_ANTHROPIC_MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: { format: { type: 'json_schema', schema: RECIPE_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  };
}

/**
 * Map an Anthropic Messages API answer onto the recipe form shape.
 * Returns null for a clean "no recipe" answer; throws on refusals or
 * broken answers (same contract as the OpenAI parser).
 */
export function parseExtractedRecipe(message) {
  if (!message || message.stop_reason === 'refusal') {
    throw new Error('Anthropic hat die Anfrage abgelehnt.');
  }
  const textBlock = (message.content ?? []).find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('Anthropic hat keine verwertbare Antwort geliefert.');
  }
  return normalizeParsedRecipe(JSON.parse(textBlock.text));
}

export async function extractRecipeViaAnthropic({ mediaType, base64Data }, { client, model } = {}) {
  const response = await client.messages.create(
    buildPhotoImportRequest({ mediaType, base64Data }, { model }),
  );
  return parseExtractedRecipe(response);
}

let cachedAnthropicClient = null;

/**
 * Lazily create the Anthropic client so the SDK is only loaded when the
 * fallback is configured and actually used. Reads ANTHROPIC_API_KEY and
 * ANTHROPIC_BASE_URL from the environment.
 */
export async function getPhotoImportClient() {
  if (!cachedAnthropicClient) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    cachedAnthropicClient = new Anthropic({ timeout: REQUEST_TIMEOUT_MS });
  }
  return cachedAnthropicClient;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

/**
 * Try the configured providers in order (OpenAI, then Anthropic). A clean
 * "no recipe" answer (null) is final; only technical failures move on to
 * the next provider. Throws the last error when every provider fails.
 */
export async function extractRecipeFromPhoto(
  { mediaType, base64Data },
  { env = process.env, fetchImpl = fetch, anthropicClient } = {},
) {
  const providers = [];
  if (env.OPENAI_API_KEY) {
    providers.push(() => extractRecipeViaOpenAi({ mediaType, base64Data }, { fetchImpl, env }));
  }
  if (env.ANTHROPIC_API_KEY) {
    providers.push(async () => extractRecipeViaAnthropic(
      { mediaType, base64Data },
      { client: anthropicClient ?? await getPhotoImportClient() },
    ));
  }

  let lastError = new Error('Der Foto-Import ist nicht konfiguriert.');
  for (const run of providers) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
