// Recipe Use Cases
import { getPrismaClient } from '../../infrastructure/database';
import { SlugService } from '../../domain/services/SlugService';
import { createRecipeSchema, updateRecipeSchema } from '../../domain/validators';

export class RecipeUseCases {
  private prisma = getPrismaClient();

  async getAllRecipes(params: any = {}, currentUserId?: string) {
    const {
      search,
      q,
      category,
      difficulty,
      status,
      page = 1,
      pageSize,
      limit = 10,
    } = params;
    const searchTerm = search ?? q;
    const resolvedPage = Number(page) || 1;
    const resolvedLimit = Number(pageSize ?? limit) || 10;

    const where: any = {};

    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { shortDescription: { contains: searchTerm, mode: 'insensitive' } },
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
      // Public listing shows published recipes.
      // Authenticated users additionally see their own drafts/archived recipes.
      where.OR = currentUserId
        ? [{ status: 'PUBLISHED' }, { createdById: currentUserId }]
        : [{ status: 'PUBLISHED' }];
    }

    const [recipes, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        skip: (resolvedPage - 1) * resolvedLimit,
        take: resolvedLimit,
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
        page: resolvedPage,
        pageSize: resolvedLimit,
        total,
        totalPages: Math.ceil(total / resolvedLimit),
        q: searchTerm ?? '',
        category: category ?? 'all',
        sort: 'newest',
        difficulty: difficulty ?? 'all',
        maxTotalMinutes: null,
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
    const validated = createRecipeSchema.parse(input);

    // Generate unique slug
    const existingRecipes = await this.prisma.recipe.findMany({
      select: { slug: true },
    });
    const existingSlugs = existingRecipes.map((r: any) => r.slug);
    const slug = SlugService.generateUnique(validated.title, existingSlugs);

    const recipe = await this.prisma.recipe.create({
      data: {
        ...validated,
        slug,
        createdById: userId,
        status: 'DRAFT',
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
