// Recipe Routes
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RecipeUseCases } from '../../application/recipes';
import { optionalAuth, requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../types';

const recipeListQuerySchema = z.object({
  q: z.string().trim().optional(),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  difficulty: z.enum(['EINFACH', 'MITTEL', 'SCHWER', 'Einfach', 'Mittel', 'Schwer']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
  sort: z.enum(['newest', 'oldest', 'title_asc', 'title_desc']).optional(),
  maxTotalMinutes: z.coerce.number().int().min(1).optional(),
});

export async function recipeRoutes(fastify: FastifyInstance) {
  const recipeUseCases = new RecipeUseCases();

  // Get all recipes (public)
  fastify.get('/', { preHandler: optionalAuth }, async (request, reply) => {
    try {
      const userId = (request as any).user?.sub;
      const query = recipeListQuerySchema.parse(request.query ?? {});
      const result = await recipeUseCases.getAllRecipes(query, userId);
      return reply.send(result);
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid recipe query parameters' });
      }
      return reply.status(500).send({ error: error.message });
    }
  });

  // Get recipe by slug (public)
  fastify.get('/:slug', { preHandler: optionalAuth }, async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };
      const userId = (request as any).user?.sub;
      const recipe = await recipeUseCases.getRecipeBySlug(slug, userId);
      return reply.send(recipe);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });

  // Create recipe (authenticated)
  fastify.post('/', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const userId = (request as any).user.sub;
      const recipe = await recipeUseCases.createRecipe(request.body as any, userId);
      return reply.status(201).send(recipe);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Update recipe (authenticated with ownership check)
  fastify.patch('/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).user.sub;
      const userRole = (request as any).user.role;
      const recipe = await recipeUseCases.updateRecipe(id, request.body as any, userId, userRole);
      return reply.send(recipe);
    } catch (error: any) {
      const status = error.message.includes('permission') ? 403 : 404;
      return reply.status(status).send({ error: error.message });
    }
  });

  // Delete recipe (authenticated with ownership check)
  fastify.delete('/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).user.sub;
      const userRole = (request as any).user.role;
      const result = await recipeUseCases.deleteRecipe(id, userId, userRole);
      return reply.send(result);
    } catch (error: any) {
      const status = error.message.includes('permission') ? 403 : 404;
      return reply.status(status).send({ error: error.message });
    }
  });

  // Publish recipe (editor/admin only)
  fastify.patch('/:id/publish', {
    preHandler: [requireAuth, requireRole([UserRole.EDITOR, UserRole.ADMIN])],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).user.sub;
      const recipe = await recipeUseCases.publishRecipe(id, userId);
      return reply.send(recipe);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });

  // Archive recipe (editor/admin only)
  fastify.patch('/:id/archive', {
    preHandler: [requireAuth, requireRole([UserRole.EDITOR, UserRole.ADMIN])],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const recipe = await recipeUseCases.archiveRecipe(id);
      return reply.send(recipe);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
}
