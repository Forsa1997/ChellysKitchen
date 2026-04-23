export type UserRole = 'guest' | 'member' | 'editor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
}

export interface Recipe {
  id: string;
  img: string;
  tag: string;
  title: string;
  shortDescription: string;
  preparationTime: number;
  cookingTime: number;
  difficulty: string;
  servings: number;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  category: string;
}
