import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { generateToken, JWTPayload } from '../utils/jwt';
import { createError } from '../middleware/error-handler';
import { randomBytes } from 'crypto';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, name } = input;

    // Validate email format
    if (!this.isValidEmail(email)) {
      throw createError('Invalid email format', 400);
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw createError(passwordValidation.errors.join(', '), 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw createError('Email already registered', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'user',
        emailVerified: false,
      },
    });

    // Create free subscription
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'free',
        status: 'active',
        maxProjects: 1,
        maxTeamMembers: 1,
        maxAICallsPerMonth: 10,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create session
    const sessionToken = this.generateSessionToken();
    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: this.getSessionExpiry(),
      },
    });

    // Store session in Redis
    await this.storeSessionInRedis(sessionToken, user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    // Compare password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw createError('Invalid credentials', 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create session
    const sessionToken = this.generateSessionToken();
    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: this.getSessionExpiry(),
      },
    });

    // Store session in Redis
    await this.storeSessionInRedis(sessionToken, user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Logout user
   */
  async logout(sessionToken: string): Promise<void> {
    // Remove from Redis
    await redis.del(`session:${sessionToken}`);

    // Delete session from database
    await prisma.session.deleteMany({
      where: { token: sessionToken },
    });
  }

  /**
   * Get user from token
   */
  async getUserFromToken(token: string): Promise<JWTPayload | null> {
    try {
      const payload = await this.verifyToken(token);
      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate session token
   */
  async validateSession(sessionToken: string): Promise<boolean> {
    // Check Redis first (fast)
    const userId = await redis.get(`session:${sessionToken}`);
    if (userId) {
      return true;
    }

    // Check database
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
    });

    if (!session) {
      return false;
    }

    // Check expiry
    if (session.expiresAt < new Date()) {
      // Expired - delete it
      await this.logout(sessionToken);
      return false;
    }

    // Valid - store in Redis for next time
    await this.storeSessionInRedis(sessionToken, session.userId);
    return true;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  private async verifyToken(token: string): Promise<JWTPayload> {
    const { verifyToken } = await import('../utils/jwt');
    return verifyToken(token);
  }

  private generateSessionToken(): string {
    return randomBytes(32).toString('hex');
  }

  private getSessionExpiry(): Date {
    const expiryDays = 7; // 7 days
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + expiryDays);
    return expiry;
  }

  private async storeSessionInRedis(
    sessionToken: string,
    userId: string
  ): Promise<void> {
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
    await redis.setex(`session:${sessionToken}`, ttl, userId);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const authService = new AuthService();
