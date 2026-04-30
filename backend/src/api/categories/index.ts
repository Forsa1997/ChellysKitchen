// Category Routes
import { FastifyInstance } from 'fastify';
import { getPrismaClient } from '../../infrastructure/database';
import { requireAuth, requireRole } from '../../middleware/auth';
import { createCategorySchema, updateCategorySchema } from '../../domain/validators';
import { UserRole } from '../../types';

export async function categoryRoutes(fastify: FastifyInstance) {
  const prisma = getPrismaClient();

  // Get all categories (public)
  fastify.get('/', async (_request, reply) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
      });
      return reply.send({ categories });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Get category by slug (public)
  fastify.get('/:slug', async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };
      const category = await prisma.category.findUnique({
        where: { slug },
      });

      if (!category) {
        return reply.status(404).send({ error: 'Category not found' });
      }

      return reply.send(category);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Create category (admin only)
  fastify.post('/', {
    preHandler: [requireAuth, requireRole([UserRole.ADMIN])],
  }, async (request, reply) => {
    try {
      const validated = createCategorySchema.parse(request.body) as {
        name: string;
        slug: string;
        description?: string;
        icon?: string;
      };
      const category = await prisma.category.create({
        data: {
          name: validated.name,
          slug: validated.slug,
          description: validated.description,
          icon: validated.icon,
        },
      });
      return reply.status(201).send(category);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Update category (admin only)
  fastify.patch('/:id', {
    preHandler: [requireAuth, requireRole([UserRole.ADMIN])],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const validated = updateCategorySchema.parse(request.body);
      const category = await prisma.category.update({
        where: { id },
        data: validated,
      });
      return reply.send(category);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });

  // Delete category (admin only)
  fastify.delete('/:id', {
    preHandler: [requireAuth, requireRole([UserRole.ADMIN])],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await prisma.category.delete({
        where: { id },
      });
      return reply.send({ message: 'Category deleted successfully' });
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
}
