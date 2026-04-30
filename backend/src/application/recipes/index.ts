// Recipe Use Cases
import { getPrismaClient } from '../../infrastructure/database';
import { SlugService } from '../../domain/services/SlugService';
import { createRecipeSchema, updateRecipeSchema } from '../../domain/validators';

export class RecipeUseCases {
  private prisma = getPrismaClient();

  async getAllRecipes(params: any = {}, userId?: string) {
    const { search, q, category, difficulty, status } = params;
    const searchTerm = search ?? q;
    const page = Math.max(Number(params.page) || 1, 1);
    const requestedLimit = Number(params.pageSize ?? params.limit) || 10;
    const limit = Math.min(Math.max(requestedLimit, 1), 50);

    const andConditions: any[] = [];

    if (searchTerm) {
      andConditions.push({
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { shortDescription: { contains: searchTerm, mode: 'insensitive' } },
        ],
      });
    }

    if (category) {
      andConditions.push({ category });
    }

    if (difficulty) {
      const difficultyMap: Record<string, string> = {
        EINFACH: 'EINFACH',
        MITTEL: 'MITTEL',
        SCHWER: 'SCHWER',
        Einfach: 'EINFACH',
        Mittel: 'MITTEL',
        Schwer: 'SCHWER',
      };
      const mappedDifficulty = difficultyMap[difficulty];
      if (mappedDifficulty) {
        andConditions.push({ difficulty: mappedDifficulty });
      }
    }

    if (userId) {
      andConditions.push({
        OR: [{ status: 'PUBLISHED' }, { createdById: userId }],
      });
      if (status) {
        andConditions.push({ status });
      }
    } else {
      andConditions.push({ OR: [{ status: 'PUBLISHED' }] });
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

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
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
        q: searchTerm ?? '',
        category: category ?? 'all',
        sort: 'newest',
        difficulty: difficulty ?? 'all',
        maxTotalMinutes: null,
      },
    };
  }

  async getRecipeBySlug(slug: string, userId?: string) {
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

    const canView = recipe.status === 'PUBLISHED' || (userId && recipe.createdById === userId);
    if (!canView) {
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
    if (Object.prototype.hasOwnProperty.call(input, 'status')) {
      throw new Error('Recipe status updates are not allowed in this endpoint');
    }

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
        status: undefined,
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
