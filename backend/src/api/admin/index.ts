// Admin Routes
import { FastifyInstance } from 'fastify';
import { UserUseCases } from '../../application/users';
import { requireAuth, requireRole } from '../../middleware/auth';

export async function adminRoutes(fastify: FastifyInstance) {
  const userUseCases = new UserUseCases();

  // Get all users (admin only)
  fastify.get('/users', {
    preHandler: [requireAuth, requireRole(['ADMIN'])],
  }, async (request, reply) => {
    try {
      const { page = 1, limit = 10 } = request.query as { page?: number; limit?: number };
      const result = await userUseCases.getAllUsers(page, limit);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Update user role (admin only)
  fastify.patch('/users/:id/role', {
    preHandler: [requireAuth, requireRole(['ADMIN'])],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { role } = request.body as { role: 'GUEST' | 'MEMBER' | 'EDITOR' | 'ADMIN' };
      const user = await userUseCases.updateUserRole(id, role);
      return reply.send(user);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });

  // Delete user (admin only)
  fastify.delete('/users/:id', {
    preHandler: [requireAuth, requireRole(['ADMIN'])],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await userUseCases.deleteUser(id);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
}