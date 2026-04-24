// Category Entity
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  icon?: string;
}