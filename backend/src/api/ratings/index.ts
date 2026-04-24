// Rating Routes
import { FastifyInstance } from 'fastify';
import { getPrismaClient } from '../../infrastructure/database';
import { requireAuth } from '../../middleware/auth';
import { createRatingSchema, updateRatingSchema } from '../../domain/validators';

export async function ratingRoutes(fastify: FastifyInstance) {
  const prisma = getPrismaClient();

  // Get ratings for a recipe (public)
  fastify.get('/recipes/:slug/rating', async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };

      const ratings = await prisma.rating.findMany({
        where: {
          recipe: {
            slug,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
          : 0;

      return reply.send({
        ratings,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: ratings.length,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Create rating for a recipe (authenticated)
  fastify.post('/recipes/:slug/rating', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };
      const userId = (request as any).user.sub;
      const validated = createRatingSchema.parse(request.body);

      // Find recipe
      const recipe = await prisma.recipe.findUnique({
        where: { slug },
      });

      if (!recipe) {
        return reply.status(404).send({ error: 'Recipe not found' });
      }

      // Check if user already rated this recipe
      const existingRating = await prisma.rating.findUnique({
        where: {
          userId_recipeId: {
            userId,
            recipeId: recipe.id,
          },
        },
      });

      if (existingRating) {
        // Update existing rating
        const updatedRating = await prisma.rating.update({
          where: { id: existingRating.id },
          data: { stars: validated.stars },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
        return reply.send(updatedRating);
      }

      // Create new rating
      const rating = await prisma.rating.create({
        data: {
          userId,
          recipeId: recipe.id,
          stars: validated.stars,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return reply.status(201).send(rating);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Delete rating for a recipe (authenticated)
  fastify.delete('/recipes/:slug/rating', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };
      const userId = (request as any).user.sub;

      // Find recipe
      const recipe = await prisma.recipe.findUnique({
        where: { slug },
      });

      if (!recipe) {
        return reply.status(404).send({ error: 'Recipe not found' });
      }

      // Find and delete rating
      const rating = await prisma.rating.findUnique({
        where: {
          userId_recipeId: {
            userId,
            recipeId: recipe.id,
          },
        },
      });

      if (!rating) {
        return reply.status(404).send({ error: 'Rating not found' });
      }

      await prisma.rating.delete({
        where: { id: rating.id },
      });

      return reply.send({ message: 'Rating deleted successfully' });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}