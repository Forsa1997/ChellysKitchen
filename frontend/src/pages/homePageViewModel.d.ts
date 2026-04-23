import type { Recipe } from '../types/domain';

export function formatCategoryLabel(category: string): string;
export function filterRecipes(recipes: Recipe[], query: string, category: string): Recipe[];
