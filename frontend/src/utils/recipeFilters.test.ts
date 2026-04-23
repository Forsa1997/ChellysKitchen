import { describe, expect, it } from 'vitest';
import {
  filterRecipes,
  getIngredientText,
  getRecipeCategories,
  getStepText,
  getTotalDurationText,
} from './recipeFilters';

const sampleRecipes = [
  {
    id: '1',
    img: 'https://example.com/pasta.jpg',
    tag: 'Quick',
    title: 'Tomato Pasta',
    shortDescription: 'Fresh tomato sauce with basil',
    preparationTime: 10,
    cookingTime: 20,
    difficulty: 'Easy',
    servings: 2,
    ingredients: [{ name: 'Tomato', amount: 4, unit: 'pcs' }],
    steps: [{ stepNumber: 1, instruction: 'Cook pasta.' }],
    category: 'Cooking',
  },
  {
    id: '2',
    img: 'https://example.com/cake.jpg',
    tag: 'Sweet',
    title: 'Chocolate Cake',
    shortDescription: 'Fluffy cake with cocoa',
    preparationTime: 15,
    cookingTime: 35,
    difficulty: 'Medium',
    servings: 8,
    ingredients: [{ name: 'Flour', amount: 300, unit: 'g' }],
    steps: [{ stepNumber: 1, instruction: 'Mix ingredients.' }],
    category: 'Baking',
  },
];

describe('recipeFilters', () => {
  it('creates category filter options', () => {
    expect(getRecipeCategories(sampleRecipes)).toEqual(['all', 'Cooking', 'Baking']);
  });

  it('filters recipes by query and category', () => {
    expect(filterRecipes(sampleRecipes, 'cake', 'all').map(({ id }) => id)).toEqual(['2']);
    expect(filterRecipes(sampleRecipes, '', 'Cooking').map(({ id }) => id)).toEqual(['1']);
  });

  it('formats recipe display text helpers', () => {
    expect(getTotalDurationText(sampleRecipes[0])).toBe('30 Minuten • 2 Portionen');
    expect(getIngredientText(2, 'EL', 'Olivenöl')).toBe('2 EL Olivenöl');
    expect(getStepText(3, 'Servieren.')).toBe('3. Servieren.');
  });
});
