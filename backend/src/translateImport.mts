// Translate URL-imported recipes to German. The photo import already lets
// Gemini translate while reading the image; pages imported via URL arrive in
// their original language, so this module sends non-German results through
// the same Gemini Interactions API. Translation is best-effort: without a
// GEMINI_API_KEY, for already-German recipes and on any Gemini failure the
// import proceeds with the untranslated recipe.

import {
  DEFAULT_GEMINI_BASE_URL,
  DEFAULT_GEMINI_MODEL,
  extractGeminiOutputText,
  type FetchLike,
  type GeminiInteraction,
} from './photoImport.mts';
import type { ImportedRecipe } from './recipeImport.mts';
import type { Ingredient, RecipeStep } from './types.mts';

const REQUEST_TIMEOUT_MS = 60_000;

// Frequent German words that are not also common English/French/Italian/
// Spanish words — enough of them in a recipe means it needs no translation.
const GERMAN_WORDS = new Set([
  'und', 'oder', 'mit', 'ohne', 'das', 'dem', 'den', 'der', 'die',
  'ein', 'eine', 'einen', 'einem', 'einer', 'nicht', 'noch', 'dann',
  'danach', 'dazu', 'zum', 'zur', 'etwa', 'sowie', 'werden', 'wird',
  'minuten', 'stunde', 'stunden', 'hitze', 'topf', 'pfanne', 'ofen',
  'geben', 'lassen', 'kochen', 'backen', 'schneiden', 'braten',
  'zutaten', 'zubereitung', 'salz', 'pfeffer', 'zwiebel', 'zwiebeln',
  'knoblauch', 'mehl', 'zucker', 'wasser', 'nach', 'gut', 'alles',
]);

/**
 * Heuristic language check on all human-readable recipe text. Umlauts/ß or
 * a couple of unmistakably German words mean the recipe is already German.
 */
export function looksGerman(recipe: ImportedRecipe): boolean {
  const text = [
    recipe.title,
    recipe.shortDescription,
    ...recipe.ingredients.map((ingredient) => ingredient.name),
    ...recipe.steps.map((step) => step.instruction),
  ].join(' ');

  if (/[äöüß]/i.test(text)) return true;

  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  let hits = 0;
  for (const word of words) {
    if (GERMAN_WORDS.has(word)) {
      hits += 1;
      if (hits >= 2) return true;
    }
  }
  return false;
}

// Same structured-output approach as the photo import: schema-valid answers
// stay machine-readable, application-side merging still validates the values.
const TRANSLATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'shortDescription', 'ingredients', 'steps'],
  properties: {
    title: { type: 'string' },
    shortDescription: { type: 'string' },
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

const PROMPT = `Das folgende JSON ist ein Kochrezept in einer fremden Sprache.
Übersetze alle menschenlesbaren Texte vollständig und inhaltlich
originalgetreu ins Deutsche.

Regeln:
- Übersetze title, shortDescription, die Zutatennamen und die Schritte.
- Mengen (amount) unverändert übernehmen, niemals umrechnen.
- Einheiten (unit) in übliche deutsche Kurzformen übersetzen (z. B. EL, TL,
  Tasse, Stk), ohne die Menge anzupassen; leere Einheiten bleiben leer.
- Anzahl und Reihenfolge der Zutaten und Schritte exakt beibehalten.
- Kulinarische Eigennamen (z. B. Gerichtnamen wie "Ratatouille") dürfen
  bleiben, wenn sie im Deutschen gebräuchlich sind.

Rezept:`;

export interface TranslateOptions {
  fetchImpl?: FetchLike;
  env?: NodeJS.ProcessEnv;
  model?: string;
}

export function buildGeminiTranslationRequest(
  recipe: ImportedRecipe,
  { model, env = process.env }: { model?: string; env?: NodeJS.ProcessEnv } = {},
) {
  const payload = {
    title: recipe.title,
    shortDescription: recipe.shortDescription,
    ingredients: recipe.ingredients,
    steps: recipe.steps.map((step) => step.instruction),
  };
  return {
    model: model ?? env.RECIPE_TRANSLATE_MODEL ?? DEFAULT_GEMINI_MODEL,
    store: false,
    input: [
      { type: 'text', text: `${PROMPT}\n${JSON.stringify(payload, null, 2)}` },
    ],
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: TRANSLATION_SCHEMA,
    },
  };
}

function normalizeIngredients(entries: unknown, original: Ingredient[]): Ingredient[] {
  if (!Array.isArray(entries) || entries.length !== original.length) return original;
  const normalized: Ingredient[] = [];
  for (const [index, entry] of entries.entries()) {
    const record = (entry ?? {}) as { amount?: unknown; unit?: unknown; name?: unknown };
    const name = String(record.name ?? '').trim();
    if (!name) return original;
    normalized.push({
      // A converted amount would silently corrupt the recipe — keep the
      // original number and only accept the translated unit and name.
      amount: original[index].amount,
      unit: String(record.unit ?? '').trim(),
      name,
    });
  }
  return normalized;
}

function normalizeSteps(entries: unknown, original: RecipeStep[]): RecipeStep[] {
  const instructions = (Array.isArray(entries) ? entries : [])
    .map((entry) => String(entry ?? '').trim())
    .filter(Boolean);
  if (instructions.length !== original.length) return original;
  return instructions.map((instruction, index) => ({ stepNumber: index + 1, instruction }));
}

/** Merge a schema-valid translation onto the recipe, field by field with fallbacks. */
function applyTranslation(recipe: ImportedRecipe, parsed: Record<string, unknown>): ImportedRecipe {
  const title = String(parsed.title ?? '').trim();
  const shortDescription = String(parsed.shortDescription ?? '').trim();
  return {
    ...recipe,
    title: title || recipe.title,
    shortDescription: shortDescription || recipe.shortDescription,
    ingredients: normalizeIngredients(parsed.ingredients, recipe.ingredients),
    steps: normalizeSteps(parsed.steps, recipe.steps),
  };
}

export interface TranslationResult {
  recipe: ImportedRecipe;
  translated: boolean;
}

/**
 * Translate a non-German imported recipe to German via Gemini. Returns the
 * unchanged recipe (translated: false) when no GEMINI_API_KEY is configured,
 * when the recipe already looks German, or when Gemini fails — a failed
 * translation must never fail the import itself.
 */
export async function translateImportedRecipe(
  recipe: ImportedRecipe,
  { fetchImpl = fetch, env = process.env, model }: TranslateOptions = {},
): Promise<TranslationResult> {
  if (!env.GEMINI_API_KEY || looksGerman(recipe)) {
    return { recipe, translated: false };
  }

  try {
    const baseUrl = (env.GEMINI_BASE_URL ?? DEFAULT_GEMINI_BASE_URL).replace(/\/$/, '');
    const response = await fetchImpl(`${baseUrl}/interactions`, {
      method: 'POST',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY,
      },
      body: JSON.stringify(buildGeminiTranslationRequest(recipe, { model, env })),
    });
    if (!response.ok) {
      throw new Error(`Gemini antwortete mit HTTP ${response.status}.`);
    }
    const parsed: unknown = JSON.parse(extractGeminiOutputText(await response.json() as GeminiInteraction));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Gemini hat keine Übersetzung geliefert.');
    }
    return { recipe: applyTranslation(recipe, parsed as Record<string, unknown>), translated: true };
  } catch {
    return { recipe, translated: false };
  }
}
