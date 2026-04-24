// Recipe Entity
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
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  publishedBy?: string;
  archivedAt?: Date;
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

export interface UpdateRecipeInput {
  title?: string;
  shortDescription?: string;
  description?: string;
  img?: string;
  tag?: string;
  difficulty?: 'EINFACH' | 'MITTEL' | 'SCHWER';
  servings?: number;
  preparationTime?: number;
  cookingTime?: number;
  category?: string;
  ingredients?: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  steps?: Array<{
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