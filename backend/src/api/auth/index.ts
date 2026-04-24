// Auth Routes
import { FastifyInstance } from 'fastify';
import { AuthUseCases } from '../../application/auth';
import { requireAuth } from '../../middleware/auth';

export async function authRoutes(fastify: FastifyInstance) {
  const authUseCases = new AuthUseCases();

  // Register
  fastify.post('/register', async (request, reply) => {
    try {
      const result = await authUseCases.register(request.body as any);
      return reply.status(201).send(result);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = request.body as { email: string; password: string };
      const result = await authUseCases.login(email, password);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(401).send({ error: error.message });
    }
  });

  // Refresh
  fastify.post('/refresh', async (request, reply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string };
      const result = await authUseCases.refresh(refreshToken);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(401).send({ error: error.message });
    }
  });

  // Me (Get current user)
  fastify.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const userId = (request as any).user.sub;
      const user = await authUseCases.me(userId);
      return reply.send(user);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
}