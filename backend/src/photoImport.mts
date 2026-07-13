// Import recipes from a photo (cookbook page, handwritten note, screenshot).
// Gemini receives the image and returns structured JSON which is normalized
// onto the create-form shape. Nothing is saved by this module.

import { parseIngredientText, type ImportedRecipe } from './recipeImport.mts';
import type { Ingredient, RecipeStep } from './types.mts';

const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';
const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const REQUEST_TIMEOUT_MS = 120_000;

export interface PhotoInput {
  mediaType: string;
  base64Data: string;
}

export interface PhotoImportOptions {
  fetchImpl?: typeof fetch;
  env?: NodeJS.ProcessEnv;
  model?: string;
}

// Structured output keeps the answer machine-readable. Application-side
// normalization still validates the values because a schema-valid response
// can contain semantically incomplete recipe data.
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
vollständig und inhaltlich originalgetreu. Wenn das Rezept ganz oder teilweise
in einer anderen Sprache vorliegt, übersetze alle menschenlesbaren Inhalte
vollständig ins Deutsche.

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

export function isPhotoImportConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.GEMINI_API_KEY);
}

function toMinutes(value: unknown): number {
  const minutes = Math.round(Number(value));
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
}

function normalizeIngredient(entry: unknown): Ingredient | null {
  if (typeof entry === 'string') {
    return parseIngredientText(entry);
  }
  if (!entry || typeof entry !== 'object') return null;
  const record = entry as { amount?: unknown; unit?: unknown; name?: unknown };
  const amount = Number(String(record.amount ?? 0).replace(',', '.'));
  return {
    amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
    unit: String(record.unit ?? '').trim(),
    name: String(record.name ?? '').trim(),
  };
}

function normalizeStep(entry: unknown): string {
  const instruction = typeof entry === 'string'
    ? entry
    : String((entry as { instruction?: unknown } | null | undefined)?.instruction ?? '');
  return instruction.trim();
}

function normalizeParsedRecipe(parsed: Record<string, unknown>): ImportedRecipe | null {
  if (parsed.containsRecipe === false) return null;

  const title = String(parsed.title ?? '').trim();
  const ingredients = (Array.isArray(parsed.ingredients) ? parsed.ingredients : [])
    .map((entry) => normalizeIngredient(entry))
    .filter((ingredient): ingredient is Ingredient => Boolean(ingredient?.name));
  const steps: RecipeStep[] = (Array.isArray(parsed.steps) ? parsed.steps : [])
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

export function buildGeminiPhotoImportRequest(
  { mediaType, base64Data }: PhotoInput,
  { model }: { model?: string } = {},
) {
  return {
    model: model ?? process.env.PHOTO_IMPORT_MODEL ?? DEFAULT_GEMINI_MODEL,
    store: false,
    input: [
      { type: 'image', data: base64Data, mime_type: mediaType },
      { type: 'text', text: PROMPT },
    ],
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: RECIPE_SCHEMA,
    },
  };
}

interface GeminiContentEntry {
  type?: unknown;
  text?: unknown;
}

interface GeminiStep {
  type?: unknown;
  content?: GeminiContentEntry[];
}

export interface GeminiInteraction {
  status?: unknown;
  steps?: GeminiStep[];
}

/**
 * Parse the final text output of a Gemini Interactions API response.
 * Returns null only for a valid response which contains no usable recipe.
 */
export function parseGeminiRecipeResponse(interaction: GeminiInteraction | null | undefined): ImportedRecipe | null {
  if (!interaction || interaction.status !== 'completed') {
    throw new Error('Gemini hat die Anfrage nicht abgeschlossen.');
  }

  const modelOutput = [...(interaction.steps ?? [])]
    .reverse()
    .find((step) => step.type === 'model_output');
  const text = (modelOutput?.content ?? [])
    .filter((entry) => entry.type === 'text' && typeof entry.text === 'string')
    .map((entry) => entry.text)
    .join('');
  if (!text) {
    throw new Error('Gemini hat keine verwertbare Antwort geliefert.');
  }

  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Gemini hat kein Rezeptobjekt geliefert.');
  }
  return normalizeParsedRecipe(parsed as Record<string, unknown>);
}

export async function extractRecipeViaGemini(
  { mediaType, base64Data }: PhotoInput,
  { fetchImpl = fetch, env = process.env, model }: PhotoImportOptions = {},
): Promise<ImportedRecipe | null> {
  const baseUrl = (env.GEMINI_BASE_URL ?? DEFAULT_GEMINI_BASE_URL).replace(/\/$/, '');
  const response = await fetchImpl(`${baseUrl}/interactions`, {
    method: 'POST',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY ?? '',
    },
    body: JSON.stringify(buildGeminiPhotoImportRequest({ mediaType, base64Data }, { model })),
  });
  if (!response.ok) {
    throw new Error(`Gemini antwortete mit HTTP ${response.status}.`);
  }
  return parseGeminiRecipeResponse(await response.json() as GeminiInteraction);
}

export async function extractRecipeFromPhoto(
  { mediaType, base64Data }: PhotoInput,
  { env = process.env, fetchImpl = fetch }: PhotoImportOptions = {},
): Promise<ImportedRecipe | null> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('Der Foto-Import ist nicht konfiguriert.');
  }
  return extractRecipeViaGemini({ mediaType, base64Data }, { env, fetchImpl });
}
