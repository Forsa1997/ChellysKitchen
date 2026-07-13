// Shared family week plan: which recipe is cooked on which day. One plan for
// the whole family (like the shared notes), keyed by lowercase English day
// names. Each entry pins a recipe and the planned servings so the aggregated
// Bring! shopping list can scale amounts.

import type { Ingredient, Recipe, WeekDay, WeekPlan, WeekPlanEntry } from './types.mts';

export const WEEK_DAYS: readonly WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function isWeekDay(value: string): value is WeekDay {
  return (WEEK_DAYS as readonly string[]).includes(value);
}

export function createEmptyWeekPlan(): WeekPlan {
  const plan = {} as WeekPlan;
  for (const day of WEEK_DAYS) {
    plan[day] = [];
  }
  return plan;
}

function normalizeServings(value: unknown): number | null {
  const servings = Number(value);
  return Number.isFinite(servings) && servings >= 1 ? Math.round(servings) : null;
}

export function normalizeWeekPlan(raw: unknown): WeekPlan {
  const plan = createEmptyWeekPlan();
  if (!raw || typeof raw !== 'object') {
    return plan;
  }
  const record = raw as Record<string, unknown>;
  for (const day of WEEK_DAYS) {
    const entries = Array.isArray(record[day]) ? (record[day] as Array<Partial<WeekPlanEntry>>) : [];
    plan[day] = entries
      .filter((entry) => entry && typeof entry.recipeId === 'string')
      .map((entry) => ({ recipeId: entry.recipeId as string, servings: normalizeServings(entry.servings) }));
  }
  return plan;
}

export interface PlannedMeal {
  /** Only the scaling-relevant recipe fields are needed here. */
  recipe: Pick<Recipe, 'id' | 'servings' | 'ingredients'>;
  servings: number | null | undefined;
}

/**
 * Merge the ingredients of all planned meals into one shopping list.
 * Amounts are scaled from the recipe's base servings to the planned servings
 * and summed per (name, unit) pair, case-insensitively.
 */
export function aggregateWeekPlanIngredients(entries: PlannedMeal[]): Ingredient[] {
  const byKey = new Map<string, Ingredient>();

  for (const { recipe, servings } of entries) {
    const base = Math.max(Number(recipe.servings) || 1, 1);
    const target = normalizeServings(servings) ?? base;
    const scale = target / base;

    for (const ingredient of recipe.ingredients ?? []) {
      const name = String(ingredient.name ?? '').trim();
      if (!name) continue;
      const unit = String(ingredient.unit ?? '').trim();
      const amount = Number(ingredient.amount) > 0 ? Number(ingredient.amount) * scale : 0;

      const key = `${name.toLowerCase()}\u0000${unit.toLowerCase()}`;
      const existing = byKey.get(key);
      if (existing) {
        existing.amount += amount;
      } else {
        byKey.set(key, { name, amount, unit });
      }
    }
  }

  return [...byKey.values()].map((item) => ({ ...item, amount: Number(item.amount.toFixed(2)) }));
}
