import { FastifyInstance } from 'fastify';

/**
 * Health check routes
 */
export async function healthRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'not_connected',
      version: '1.0.0',
      uptime: process.uptime(),
    };

    // Check database connection (will be implemented with Prisma)
    try {
      // TODO: Add Prisma health check
      // await prisma.$queryRaw`SELECT 1`;
      healthStatus.database = 'connected';
    } catch (error) {
      fastify.log.error('Database health check failed:', error);
      healthStatus.database = 'disconnected';
      healthStatus.status = 'degraded';
    }

    return reply.code(healthStatus.status === 'ok' ? 200 : 503).send(healthStatus);
  });

  // Readiness check
  fastify.get('/health/ready', async (request, reply) => {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  });

  // Liveness check
  fastify.get('/health/live', async (request, reply) => {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  });
}
