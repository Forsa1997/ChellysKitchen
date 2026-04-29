// Auth Use Cases
import { getPrismaClient } from '../../infrastructure/database';
import { PasswordService } from '../../domain/services/PasswordService';
import { TokenService } from '../../infrastructure/auth';
import { registerSchema, loginSchema } from '../../domain/validators';

export class AuthUseCases {
  private prisma = getPrismaClient();

  async register(input: any) {
    // Validate input
    const validated = registerSchema.parse(input);

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate password strength
    const passwordValidation = PasswordService.validateStrength(validated.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Hash password
    const hashedPassword = await PasswordService.hash(validated.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        password: hashedPassword,
        role: (validated as any).role || 'MEMBER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = TokenService.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = TokenService.generateRefreshToken(user.id, 1);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    // Validate input
    const validated = loginSchema.parse({ email, password });

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await PasswordService.verify(validated.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = TokenService.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = TokenService.generateRefreshToken(user.id, 1);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = TokenService.verifyRefreshToken(refreshToken);

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const accessToken = TokenService.generateAccessToken(user.id, user.email, user.role);

      return {
        accessToken,
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}