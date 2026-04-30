// Recipe Use Cases
import { getPrismaClient } from '../../infrastructure/database';
import { SlugService } from '../../domain/services/SlugService';
import { createRecipeSchema, updateRecipeSchema } from '../../domain/validators';

export class RecipeUseCases {
  private prisma = getPrismaClient();

  async getAllRecipes(params: any = {}) {
    const { search, category, difficulty, status, page = 1, limit = 10 } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (status) {
      where.status = status;
    } else {
      // Default to published recipes for public access
      where.status = 'PUBLISHED';
    }

    const [recipes, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
          ratings: true,
        },
      }),
      this.prisma.recipe.count({ where }),
    ]);

    return {
      data: recipes,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRecipeBySlug(slug: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { slug },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
        updatedBy: {
          select: { id: true, name: true },
        },
        ratings: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    return recipe;
  }

  async createRecipe(input: any, userId: string) {
    const normalizedInput = {
      ...input,
      preparationTime: input.preparationTime ?? input.preparationTimeMinutes,
      steps: input.steps ?? (typeof input.instructions === 'string'
        ? input.instructions.split('\n').map((instruction: string, index: number) => ({ stepNumber: index + 1, instruction: instruction.trim() })).filter((step: any) => step.instruction)
        : input.instructions),
    };

    const validated = createRecipeSchema.parse(normalizedInput);

    // Generate unique slug
    const existingRecipes = await this.prisma.recipe.findMany({
      select: { slug: true },
    });
    const existingSlugs = existingRecipes.map((r: any) => r.slug);
    const slug = SlugService.generateUnique(validated.title, existingSlugs);

    const recipe = await this.prisma.recipe.create({
      data: {
        slug,
        title: validated.title,
        shortDescription: validated.shortDescription,
        description: validated.description,
        img: validated.img,
        tag: validated.tag,
        difficulty: validated.difficulty,
        servings: validated.servings,
        preparationTime: validated.preparationTime,
        cookingTime: validated.cookingTime,
        category: validated.category,
        ingredients: validated.ingredients,
        steps: validated.steps,
        nutritionalValues: validated.nutritionalValues,
        createdById: userId,
        status: 'PUBLISHED',
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return recipe;
  }

  async updateRecipe(id: string, input: any, userId: string, userRole: string) {
    const validated = updateRecipeSchema.parse(input);

    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    // Check ownership or admin/editor role
    if (recipe.createdById !== userId && userRole !== 'ADMIN' && userRole !== 'EDITOR') {
      throw new Error('You do not have permission to update this recipe');
    }

    const updatedRecipe = await this.prisma.recipe.update({
      where: { id },
      data: {
        ...validated,
        updatedById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return updatedRecipe;
  }

  async deleteRecipe(id: string, userId: string, userRole: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    // Check ownership or admin role
    if (recipe.createdById !== userId && userRole !== 'ADMIN') {
      throw new Error('You do not have permission to delete this recipe');
    }

    await this.prisma.recipe.delete({
      where: { id },
    });

    return { message: 'Recipe deleted successfully' };
  }

  async publishRecipe(id: string, userId: string) {
    const recipe = await this.prisma.recipe.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedBy: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return recipe;
  }

  async archiveRecipe(id: string) {
    const recipe = await this.prisma.recipe.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
      },
    });

    return recipe;
  }
}
