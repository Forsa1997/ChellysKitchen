// Zod Validation Schemas
import { z } from 'zod';

// User Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['GUEST', 'MEMBER', 'EDITOR', 'ADMIN']).optional(),
});

// Recipe Schemas
export const createRecipeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters'),
  description: z.string().optional(),
  img: z.string().url('Invalid image URL').optional(),
  tag: z.string().optional(),
  difficulty: z.enum(['EINFACH', 'MITTEL', 'SCHWER']),
  servings: z.number().int().min(1, 'Servings must be at least 1'),
  preparationTime: z.number().int().min(0, 'Preparation time must be positive'),
  cookingTime: z.number().int().min(0, 'Cooking time must be positive'),
  category: z.string().min(1, 'Category is required'),
  ingredients: z.array(
    z.object({
      name: z.string().min(1, 'Ingredient name is required'),
      amount: z.number().positive('Amount must be positive'),
      unit: z.string().min(1, 'Unit is required'),
    })
  ).min(1, 'At least one ingredient is required'),
  steps: z.array(
    z.object({
      stepNumber: z.number().int().positive('Step number must be positive'),
      instruction: z.string().min(1, 'Instruction is required'),
    })
  ).min(1, 'At least one step is required'),
  nutritionalValues: z.object({
    calories: z.number().int().min(0).optional(),
    protein: z.number().min(0).optional(),
    carbohydrates: z.number().min(0).optional(),
    fat: z.number().min(0).optional(),
  }).optional(),
});

export const updateRecipeSchema = createRecipeSchema.partial();

export const recipeQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.enum(['EINFACH', 'MITTEL', 'SCHWER']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
});

// Rating Schemas
export const createRatingSchema = z.object({
  stars: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
});

export const updateRatingSchema = z.object({
  stars: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
});

// Category Schemas
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
});