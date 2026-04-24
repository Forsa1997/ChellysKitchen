// User Use Cases
import { getPrismaClient } from '../../infrastructure/database';
import { PasswordService } from '../../domain/services/PasswordService';
import { updateUserSchema } from '../../domain/validators';
import type { UpdateUserInput } from '../../domain/entities';

export class UserUseCases {
  private prisma = getPrismaClient();

  async getAllUsers(page: number = 1, limit: number = 10) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              recipesCreated: true,
            },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        recipesCreated: {
          where: { status: 'PUBLISHED' },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateUser(id: string, input: UpdateUserInput) {
    // Validate input
    const validated = updateUserSchema.parse(input);

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Hash password if provided
    let hashedPassword;
    if (validated.password) {
      const passwordValidation = PasswordService.validateStrength(validated.password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join(', '));
      }
      hashedPassword = await PasswordService.hash(validated.password);
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...validated,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async updateUserRole(id: string, role: 'GUEST' | 'MEMBER' | 'EDITOR' | 'ADMIN') {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async deleteUser(id: string) {
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }
}