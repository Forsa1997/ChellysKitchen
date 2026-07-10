// Import recipes from a photo (cookbook page, handwritten note, screenshot):
// the image is sent to the Anthropic Messages API (vision) and the extracted
// recipe is mapped onto the create-form shape — like the URL import, nothing
// is saved. Requires ANTHROPIC_API_KEY; ANTHROPIC_BASE_URL is honored by the
// SDK, which the end-to-end tests use to point at a mock server.

import { parseIngredientText } from './recipeImport.mjs';

const DEFAULT_MODEL = 'claude-opus-4-8';

// Structured output keeps the model answer machine-readable: the schema is
// enforced server-side, so parsing never has to fight prose or code fences.
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
  return Boolean(env.ANTHROPIC_API_KEY);
}

export function buildPhotoImportRequest({ mediaType, base64Data }, { model } = {}) {
  return {
    model: model ?? process.env.PHOTO_IMPORT_MODEL ?? DEFAULT_MODEL,
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
 * Map a Messages API response onto the recipe form shape.
 * Returns null when no recipe could be extracted (refusal, unparseable
 * answer, or the model reports the photo holds no recipe).
 */
export function parseExtractedRecipe(message) {
  if (!message || message.stop_reason === 'refusal') return null;
  const textBlock = (message.content ?? []).find((block) => block.type === 'text');
  if (!textBlock) return null;

  let parsed;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    return null;
  }
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

export async function extractRecipeFromPhoto({ mediaType, base64Data }, { client, model } = {}) {
  const response = await client.messages.create(
    buildPhotoImportRequest({ mediaType, base64Data }, { model }),
  );
  return parseExtractedRecipe(response);
}

let cachedClient = null;

/**
 * Lazily create the Anthropic client so the SDK is only loaded when the
 * feature is configured and actually used. Reads ANTHROPIC_API_KEY and
 * ANTHROPIC_BASE_URL from the environment.
 */
export async function getPhotoImportClient() {
  if (!cachedClient) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    // The user is waiting in the create form — cap the call well below the
    // SDK's 10-minute default.
    cachedClient = new Anthropic({ timeout: 120_000 });
  }
  return cachedClient;
}
