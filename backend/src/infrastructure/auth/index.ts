import jwt from 'jsonwebtoken';
import type { UserRole, AccessTokenPayload, RefreshTokenPayload } from '../../types';

export class TokenService {
  private static readonly ACCESS_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
  private static readonly REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production';
  private static readonly ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
  private static readonly REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

  static generateAccessToken(userId: string, email: string, role: UserRole): string {
    const payload: AccessTokenPayload = {
      sub: userId,
      email,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiry(this.ACCESS_EXPIRY),
    };

    return jwt.sign(payload, this.ACCESS_SECRET);
  }

  static generateRefreshToken(userId: string, tokenVersion: number): string {
    const payload: RefreshTokenPayload = {
      sub: userId,
      tokenVersion,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiry(this.REFRESH_EXPIRY),
    };

    return jwt.sign(payload, this.REFRESH_SECRET);
  }

  static verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, this.ACCESS_SECRET) as AccessTokenPayload;
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, this.REFRESH_SECRET) as RefreshTokenPayload;
  }

  private static parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 60 * 60 * 24,
    };

    return value * multipliers[unit];
  }
}
