// API Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'GUEST' | 'MEMBER' | 'EDITOR' | 'ADMIN';
  createdAt: string;
  updatedAt?: string;
}

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description?: string;
  img?: string;
  tag?: string;
  difficulty: 'EINFACH' | 'MITTEL' | 'SCHWER';
  servings: number;
  preparationTime: number;
  cookingTime: number;
  category: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
  }>;
  nutritionalValues?: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
  };
  createdById: string;
  updatedById?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishedBy?: string;
  archivedAt?: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  ratings?: Rating[];
  averageRating?: number;
}

export interface Rating {
  id: string;
  userId: string;
  recipeId: string;
  stars: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RecipeListResponse {
  recipes: Recipe[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RecipeQueryParams {
  search?: string;
  category?: string;
  difficulty?: 'EINFACH' | 'MITTEL' | 'SCHWER';
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  page?: number;
  limit?: number;
}

export interface CreateRecipeInput {
  title: string;
  shortDescription: string;
  description?: string;
  img?: string;
  tag?: string;
  difficulty: 'EINFACH' | 'MITTEL' | 'SCHWER';
  servings: number;
  preparationTime: number;
  cookingTime: number;
  category: string;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
  }>;
  nutritionalValues?: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
  };
}

export interface UpdateRecipeInput extends Partial<CreateRecipeInput> {}

export interface CreateRatingInput {
  stars: number;
}

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}