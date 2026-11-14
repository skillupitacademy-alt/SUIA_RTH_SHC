import { db, ssoSessions, users } from '@quiz/db-people';
import bcrypt from 'bcryptjs';
import { and, eq, isNull } from 'drizzle-orm';

import { ApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { AuditService } from '@/modules/auth/audit.service';
import { type AdminTokenPayload, TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

/**
 * Typed domain error for absent/deleted SHC administrator account.
 * 🔒 SECURITY (R5-17): Enables typed 404 error classification without relying on exception text inspection.
 */
export class UserNotFoundError extends Error {
  constructor(message: string = 'User not found') {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

export class ShcSessionInvalidError extends Error {
  constructor() {
    super('Administrator session is no longer valid');
    this.name = 'ShcSessionInvalidError';
  }
}

/**
 * SkillHub Core Authentication Service
 * 
 * Handles authentication for SHC infrastructure admins who manage
 * shared services (Exam Engine, Tutorial Engine, Placement, etc.)
 * used by RTH and SUI.
 * 
 * Uses people_db (cross-platform identity database) instead of
 * brand-specific databases.
 */
export class SHCAuthService {
  private logInstance = logger.child({ module: 'shc-auth' });

  /**
   * Login for SHC admins
   * 
   * @param email - Admin email
   * @param password - Admin password
   * @param ip - Client IP address
   * @returns User info and tokens
   */
  async login(email: string, password: string, ip: string = 'unknown') {
    const cleanEmail = email.trim().toLowerCase();

    this.logInstance.info({ email: cleanEmail, ip }, 'SHC admin login attempt');

    // Query people_db for user
    const userResult = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, cleanEmail),
          eq(users.platform, 'skillhubcore'),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (userResult.length === 0) {
      await container.get(AuditService).log({
        action: 'shc_login_failed',
        metadata: { email: cleanEmail, reason: 'user_not_found' },
        ip,
        brand: 'skillhubcore',
      });
      throw new Error('Invalid credentials');
    }

    const user = userResult[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      await container.get(AuditService).log({
        userId: user.id,
        action: 'shc_login_failed',
        metadata: { email: cleanEmail, reason: 'invalid_password' },
        ip,
        brand: 'skillhubcore',
      });
      throw new Error('Invalid credentials');
    }

    // Check if user is admin or super_admin
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';

    if (!isAdmin) {
      await container.get(AuditService).log({
        userId: user.id,
        action: 'shc_login_failed',
        metadata: { email: cleanEmail, reason: 'insufficient_permissions', role: user.role },
        ip,
        brand: 'skillhubcore',
      });
      throw new Error('Access denied: Admin privileges required');
    }

    // Check if account is active
    if (!user.isActive) {
      await container.get(AuditService).log({
        userId: user.id,
        action: 'shc_login_failed',
        metadata: { email: cleanEmail, reason: 'account_inactive' },
        ip,
        brand: 'skillhubcore',
      });
      throw new Error('Account is inactive');
    }

    // Generate tokens
    const tokenService = container.get(TokenService);

    const refreshToken = await tokenService.generateRefreshToken(
      user.id,
      true,
      'shc-admin',
      {
        tokenType: 'admin', brand: 'skillhubcore',
        originalUserId: user.id, shadowUserId: user.id,
      }
    );
    const sessionBinding = await tokenService.hashToken(refreshToken);
    const accessToken = await tokenService.generateAccessToken({
      userId: user.id,
      originalUserId: user.id,
      shadowUserId: user.id,
      email: user.email,
      roles: [user.role],
      isAdmin: true,
      tokenType: 'admin',
      brand: 'skillhubcore',
      aud: 'shc-admin',
      sessionBinding,
    });
    // SHC principals belong to PeopleDB. Persist only the credential digest in
    // its existing session store before returning either credential.
    try {
      await db.insert(ssoSessions).values({
        userId: user.id, platform: 'skillhubcore', jwtFamily: sessionBinding,
      });
    } catch {
      throw new ApiError(503, 'Administrator session storage unavailable');
    }

    await container.get(AuditService).log({
      userId: user.id,
      action: 'shc_login_success',
      ip,
      brand: 'skillhubcore',
      metadata: { role: user.role },
    });

    this.logInstance.info(
      { userId: user.id, email: user.email, role: user.role },
      'SHC admin login successful'
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        platform: user.platform,
        isAdmin: true,
        onboardingCompleted: true, // SHC admins don't need onboarding
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Get current SHC admin user info
   * 
   * @param userId - User ID from token
   * @returns User info
   */
  async me(userId: string) {
    const userResult = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.platform, 'skillhubcore'),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (userResult.length === 0) {
      throw new UserNotFoundError('User not found');
    }

    const user = userResult[0];

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      platform: user.platform,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async requireSession(payload: Pick<AdminTokenPayload, 'userId' | 'sessionBinding'>): Promise<void> {
    if (typeof payload.userId !== 'string' || payload.userId.trim().length === 0 ||
        typeof payload.sessionBinding !== 'string' || !/^[a-f0-9]{64}$/.test(payload.sessionBinding)) {
      throw new ShcSessionInvalidError();
    }
    const sessions = await db.select({ id: ssoSessions.id }).from(ssoSessions).where(and(
      eq(ssoSessions.userId, payload.userId),
      eq(ssoSessions.platform, 'skillhubcore'),
      eq(ssoSessions.jwtFamily, payload.sessionBinding),
      isNull(ssoSessions.revokedAt), isNull(ssoSessions.deletedAt),
    )).limit(1).catch(() => { throw new ApiError(503, 'Administrator session storage unavailable'); });
    if (sessions.length !== 1) throw new ShcSessionInvalidError();
  }

  /**
   * Logout SHC admin
   * 
   * @param payload - Verified SHC administrator and issued session binding
   * @param ip - Client IP
   */
  async logout(payload: Pick<AdminTokenPayload, 'userId' | 'sessionBinding'>, ip?: string) {
    if (typeof payload.userId !== 'string' || payload.userId.trim().length === 0 ||
        typeof payload.sessionBinding !== 'string' || !/^[a-f0-9]{64}$/.test(payload.sessionBinding)) {
      throw new ShcSessionInvalidError();
    }
    // Revocation failures propagate. Other sessions and brands are untouched.
    await db.update(ssoSessions).set({ revokedAt: new Date() }).where(and(
      eq(ssoSessions.userId, payload.userId),
      eq(ssoSessions.platform, 'skillhubcore'),
      eq(ssoSessions.jwtFamily, payload.sessionBinding),
      isNull(ssoSessions.revokedAt), isNull(ssoSessions.deletedAt),
    )).catch(() => { throw new ApiError(503, 'Administrator session storage unavailable'); });
    try {
      await container.get(AuditService).log({
        userId: payload.userId, action: 'shc_logout', ip, brand: 'skillhubcore',
      });
    } catch {
      this.logInstance.warn('SHC logout audit unavailable after session revocation');
    }
  }
}
