// Domain Types

export enum UserRole {
  GUEST = 'GUEST',
  MEMBER = 'MEMBER',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
}

export enum RecipeStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum RecipeDifficulty {
  EINFACH = 'EINFACH',
  MITTEL = 'MITTEL',
  SCHWER = 'SCHWER',
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}

export interface UserUpdateInput {
  name?: string;
  password?: string;
  role?: UserRole;
}

// Recipe Types
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
  preparationTime: number;
  cookingTime: number;
  category: string;
  status: RecipeStatus;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  nutritionalValues?: NutritionalValues;
  createdById: string;
  updatedById?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;
}

export interface RecipeCreateInput {
  title: string;
  shortDescription: string;
  description?: string;
  img?: string;
  tag?: string;
  difficulty: RecipeDifficulty;
  servings: number;
  preparationTime: number;
  cookingTime: number;
  category: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  nutritionalValues?: NutritionalValues;
}

export interface RecipeUpdateInput {
  title?: string;
  shortDescription?: string;
  description?: string;
  img?: string;
  tag?: string;
  difficulty?: RecipeDifficulty;
  servings?: number;
  preparationTime?: number;
  cookingTime?: number;
  category?: string;
  ingredients?: Ingredient[];
  steps?: RecipeStep[];
  nutritionalValues?: NutritionalValues;
  status?: RecipeStatus;
}

// Rating Types
export interface Rating {
  id: string;
  userId: string;
  recipeId: string;
  stars: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RatingCreateInput {
  recipeId: string;
  stars: number;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryCreateInput {
  name: string;
  description?: string;
  icon?: string;
}

// Auth Types
export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password'>;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request Types
export interface AuthenticatedRequest {
  user: AccessTokenPayload;
}
