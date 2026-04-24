import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole, AccessTokenPayload } from '../types';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: AccessTokenPayload;
  }
}

/**
 * Require authentication middleware
 * Verifies JWT token and attaches user payload to request
 */
export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'No valid authorization token provided',
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token using Fastify JWT
    const decoded = request.server.jwt.verify<AccessTokenPayload>(token);

    request.user = decoded;
  } catch (error) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Require specific role middleware
 * Checks if authenticated user has one of the required roles
 */
export const requireRole = (roles: UserRole[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }
  };
};

/**
 * Require minimum role middleware
 * Checks if authenticated user has at least the specified role level
 */
export const requireMinRole = (minRole: UserRole) => {
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.GUEST]: 0,
    [UserRole.MEMBER]: 1,
    [UserRole.EDITOR]: 2,
    [UserRole.ADMIN]: 3,
  };

  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const userLevel = roleHierarchy[request.user.role];
    const requiredLevel = roleHierarchy[minRole];

    if (userLevel < requiredLevel) {
      return reply.status(403).send({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }
  };
};

/**
 * Optional authentication middleware
 * Attaches user payload if token is valid, but doesn't require it
 */
export const optionalAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = request.server.jwt.verify<AccessTokenPayload>(token);
      request.user = decoded;
    }
  } catch (error) {
    // Ignore errors - authentication is optional
  }
};
