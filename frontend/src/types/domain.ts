/**
 * Domain Types for Chellys Kitchen
 * These types are aligned with the backend schema and API client
 */

// ============================================================================
// Enums
// ============================================================================

export type UserRole = 'GUEST' | 'MEMBER' | 'EDITOR' | 'ADMIN';
export type RecipeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type RecipeDifficulty = 'EINFACH' | 'MITTEL' | 'SCHWER';

// ============================================================================
// User
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Recipe
// ============================================================================

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
}

export interface NutritionalValues {
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
}

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description?: string;
  img?: string;
  tag?: string;
  difficulty: RecipeDifficulty;
  servings: number;
  preparationTime: number; // in minutes
  cookingTime: number; // in minutes
  category: string;
  status: RecipeStatus;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  nutritionalValues?: NutritionalValues;
  createdBy: {
    id: string;
    name: string;
  };
  updatedBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
  averageRating?: number;
  totalRatings?: number;
}

// ============================================================================
// Rating
// ============================================================================

export interface Rating {
  id: string;
  userId: string;
  recipeId: string;
  stars: number; // 1-5
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Category
// ============================================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}
