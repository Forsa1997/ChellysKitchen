import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { healthRoutes } from './api/health';
import { authRoutes } from './api/auth';
import { recipeRoutes } from './api/recipes';
import { categoryRoutes } from './api/categories';
import { ratingRoutes } from './api/ratings';
import { adminRoutes } from './api/admin';

// Load environment variables
dotenv.config();

// Create Fastify instance
const fastify: FastifyInstance = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register plugins
const registerPlugins = async () => {
  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  });

  // CORS configuration
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // JWT configuration
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  });
};

// Register routes
const registerRoutes = async () => {
  // Health routes
  await fastify.register(healthRoutes);

  // Root endpoint
  fastify.get('/', async () => {
    return {
      name: 'Chellys Kitchen API',
      version: '1.0.0',
      description: 'Backend API for Chellys Kitchen recipe management',
      endpoints: {
        health: '/health',
        healthReady: '/health/ready',
        healthLive: '/health/live',
        api: '/api',
      },
    };
  });

  // Register API routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(recipeRoutes, { prefix: '/api/recipes' });
  await fastify.register(categoryRoutes, { prefix: '/api/categories' });
  await fastify.register(ratingRoutes, { prefix: '/api' });
  await fastify.register(adminRoutes, { prefix: '/api/admin' });
};

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '4000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await registerPlugins();
    await registerRoutes();

    await fastify.listen({ port, host });

    fastify.log.info(`Server is running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async () => {
  fastify.log.info('Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
start();
