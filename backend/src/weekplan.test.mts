import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  WEEK_DAYS,
  aggregateWeekPlanIngredients,
  createEmptyWeekPlan,
  normalizeWeekPlan,
} from './weekplan.mts';

const pasta = {
  id: 'r1',
  servings: 4,
  ingredients: [
    { name: 'Tagliatelle', amount: 500, unit: 'g' },
    { name: 'Sahne', amount: 200, unit: 'ml' },
    { name: 'Salz', amount: 0, unit: '' },
  ],
};

const auflauf = {
  id: 'r2',
  servings: 2,
  ingredients: [
    { name: 'Sahne', amount: 100, unit: 'ml' },
    { name: 'Kartoffeln', amount: 600, unit: 'g' },
  ],
};

test('createEmptyWeekPlan covers all seven days', () => {
  const plan = createEmptyWeekPlan();
  assert.deepEqual(Object.keys(plan), WEEK_DAYS);
  assert.ok(WEEK_DAYS.every((day) => Array.isArray(plan[day]) && plan[day].length === 0));
});

test('normalizeWeekPlan drops malformed entries and unknown days', () => {
  const plan = normalizeWeekPlan({
    monday: [{ recipeId: 'r1', servings: 4 }, { nope: true }, null, { recipeId: 42 }],
    caturday: [{ recipeId: 'r9', servings: 2 }],
    friday: 'kein-array',
  });

  assert.deepEqual(plan.monday, [{ recipeId: 'r1', servings: 4 }]);
  assert.deepEqual(plan.friday, []);
  assert.equal('caturday' in plan, false);
});

test('normalizeWeekPlan tolerates missing input and bad servings', () => {
  assert.deepEqual(normalizeWeekPlan(undefined), createEmptyWeekPlan());

  const plan = normalizeWeekPlan({ tuesday: [{ recipeId: 'r1', servings: -3 }] });
  assert.deepEqual(plan.tuesday, [{ recipeId: 'r1', servings: null }]);
});

test('aggregateWeekPlanIngredients sums the same ingredient across recipes', () => {
  const list = aggregateWeekPlanIngredients([
    { recipe: pasta, servings: 4 },
    { recipe: auflauf, servings: 2 },
  ]);

  const sahne = list.find((item) => item.name === 'Sahne');
  assert.deepEqual(sahne, { name: 'Sahne', amount: 300, unit: 'ml' });
  assert.ok(list.some((item) => item.name === 'Tagliatelle' && item.amount === 500));
  assert.ok(list.some((item) => item.name === 'Kartoffeln' && item.amount === 600));
});

test('aggregateWeekPlanIngredients scales by the planned servings', () => {
  const list = aggregateWeekPlanIngredients([{ recipe: pasta, servings: 2 }]);
  assert.deepEqual(list.find((item) => item.name === 'Tagliatelle'), {
    name: 'Tagliatelle',
    amount: 250,
    unit: 'g',
  });
});

test('aggregateWeekPlanIngredients falls back to the recipe servings', () => {
  const list = aggregateWeekPlanIngredients([{ recipe: pasta, servings: null }]);
  assert.equal(list.find((item) => item.name === 'Sahne').amount, 200);
});

test('aggregateWeekPlanIngredients keeps different units apart and merges case-insensitively', () => {
  const list = aggregateWeekPlanIngredients([
    { recipe: { id: 'a', servings: 1, ingredients: [{ name: 'Milch', amount: 200, unit: 'ml' }] }, servings: 1 },
    { recipe: { id: 'b', servings: 1, ingredients: [{ name: 'milch', amount: 1, unit: 'l' }] }, servings: 1 },
    { recipe: { id: 'c', servings: 1, ingredients: [{ name: 'MILCH', amount: 100, unit: 'ml' }] }, servings: 1 },
  ]);

  assert.equal(list.length, 2);
  assert.deepEqual(list.find((item) => item.unit === 'ml'), { name: 'Milch', amount: 300, unit: 'ml' });
  assert.deepEqual(list.find((item) => item.unit === 'l'), { name: 'milch', amount: 1, unit: 'l' });
});

test('aggregateWeekPlanIngredients keeps amount-less ingredients like Salz', () => {
  const list = aggregateWeekPlanIngredients([{ recipe: pasta, servings: 8 }]);
  assert.deepEqual(list.find((item) => item.name === 'Salz'), { name: 'Salz', amount: 0, unit: '' });
});
