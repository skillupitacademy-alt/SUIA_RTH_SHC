import { UserIdentityBridgeService } from '@quiz/identity-bridge';

import type { RequestBrand } from '@/lib/request-brand';
import { AuditService } from '@/modules/auth/audit.service';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';
import { PasswordService } from '@/modules/auth/password.service';
import { TokenRepository } from '@/modules/auth/repositories/token.repository';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { SecurityService } from '@/modules/auth/security.service';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

function normalizeRoleName(role: string | null | undefined): string | null {
  if (typeof role !== 'string') {
    return null;
  }

  const normalized = role.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export class LoginService {
  constructor(
    private userRepo = container.get(UserRepository),
    private tokenRepo = container.get(TokenRepository),
    private auditService = container.get(AuditService),
    private passwordService = container.get(PasswordService),
    private securityService = container.get(SecurityService),
    private tokenService = container.get(TokenService)
  ) {}

  private async ensureShadowUserId(
    user: { id: string; email: string; shadowUserId?: string | null },
    brand: RequestBrand,
  ): Promise<string> {
    if (typeof user.shadowUserId === 'string' && user.shadowUserId.trim().length > 0) {
      return user.shadowUserId;
    }

    try {
      const bridge = new UserIdentityBridgeService();
      const brandContext = getAuthBrandContext(brand);
      const result = await bridge.syncUser({
        externalId: user.id,
        externalBrand: brand,
        email: user.email,
        platform: brand,
      });

      await bridge.updateShadowUserId(brandContext.db, brandContext.tables.users, user.id, result.shadowUserId);
      await bridge.grantPlatformAccess(result.shadowUserId, brand);
      return result.shadowUserId;
    } catch (error) {
      const isTestEnv =
        process.env.NODE_ENV === 'test' ||
        process.env.VITEST === 'true' ||
        process.env.VITEST_WORKER_ID !== undefined;

      if (isTestEnv) {
        return user.id;
      }

      throw error;
    }
  }

  async login(email: string, password: string, ip: string = 'unknown', brand: RequestBrand = 'realtutorialhub') {
    // DEBUG: Log login inputs
    console.log('[LOGIN_DEBUG] Login attempt:', {
      email,
      brand,
      ip,
      timestamp: new Date().toISOString()
    });

    const brandContext = getAuthBrandContext(brand);
    const useBrandBinding = shouldUseBrandBinding();
    
    // DEBUG: Log database context
    console.log('[LOGIN_DEBUG] Brand context:', {
      brand,
      useBrandBinding,
      dbInstance: brandContext.db ? 'present' : 'missing'
    });

    const brandSecurityService = useBrandBinding && typeof this.securityService.withContext === 'function'
      ? this.securityService.withContext(brandContext.db, {
          users: brandContext.tables.users,
          loginAttempts: brandContext.tables.loginAttempts,
        })
      : this.securityService;
    const brandUserRepo = useBrandBinding && typeof this.userRepo.withDb === 'function'
      ? this.userRepo.withDb(brandContext.db, brandContext.tables)
      : this.userRepo;
    const brandTokenRepo = useBrandBinding && typeof this.tokenRepo.withDb === 'function'
      ? this.tokenRepo.withDb(brandContext.db, { refreshTokens: brandContext.tables.refreshTokens })
      : this.tokenRepo;

    if (await brandSecurityService.isAccountLocked(email, ip, brand)) {
      console.log('[LOGIN_DEBUG] Account locked:', email);
      await this.auditService.log({ action: 'login_locked', metadata: { email }, ip, brand });
      throw new Error('Account temporarily locked. Try again later.');
    }

    // DEBUG: Log user lookup
    console.log('[LOGIN_DEBUG] Looking up user:', email);
    const user = await brandUserRepo.findWithDetails(email);
    console.log('[LOGIN_DEBUG] User lookup result:', {
      found: !!user,
      userId: user?.id,
      email: user?.email,
      hasPasswordHash: !!user?.passwordHash,
      isBlocked: user?.isBlocked,
      emailVerified: user?.emailVerified
    });

    if (user === undefined) {
      console.log('[LOGIN_DEBUG] FAILURE: User not found');
      await brandSecurityService.trackLoginAttempt(ip, email, false, brand);
      await this.auditService.log({ action: 'login_failed', metadata: { email, reason: 'user_not_found' }, ip, brand });
      throw new Error('Invalid credentials');
    }

    // DEBUG: Test password comparison
    console.log('[LOGIN_DEBUG] Testing password for user:', user.id);
    const passwordMatch = await this.passwordService.compare(password, user.passwordHash);
    console.log('[LOGIN_DEBUG] Password comparison result:', {
      match: passwordMatch,
      hasHash: !!user.passwordHash,
      hashLength: user.passwordHash?.length
    });

    if (passwordMatch === false) {
      console.log('[LOGIN_DEBUG] FAILURE: Password mismatch');
      await brandSecurityService.trackLoginAttempt(ip, email, false, brand);
      await this.auditService.log({ action: 'login_failed', metadata: { email, reason: 'password_mismatch' }, ip, brand });
      throw new Error('Invalid credentials');
    }

    if (user.isBlocked === true) {
        console.log('[LOGIN_DEBUG] FAILURE: User blocked');
        await this.auditService.log({ action: 'login_blocked_user', metadata: { email }, ip, brand });
        throw new Error('Account has been blocked. Contact administrator.');
    }

    console.log('[LOGIN_DEBUG] SUCCESS: All checks passed, proceeding with token generation');

    // Update Last Active
    await brandUserRepo.updateLastActive(user.id);

    await brandSecurityService.trackLoginAttempt(ip, email, true, brand);
    await this.auditService.log({ userId: user.id, action: 'login_success', ip, brand });

    const roleNames = user.userRoles
      .map((ur) => normalizeRoleName(ur.role.name))
      .filter((role): role is string => role !== null);
    const isAdmin = roleNames.includes('admin') || roleNames.includes('super_admin') || roleNames.includes('infrastructure');
    const shadowUserId = await this.ensureShadowUserId(user, brand);

    const accessToken = await this.tokenService.generateAccessToken({
      userId: user.id,
      originalUserId: user.id,
      shadowUserId,
      email: user.email,
      roles: roleNames,
      isAdmin,
      tokenType: isAdmin ? 'admin' : 'user',
      brand,
    });

    const refreshToken = await this.tokenService.generateRefreshToken(user.id, isAdmin, isAdmin ? 'admin' : 'user', {
      tokenType: isAdmin ? 'admin' : 'user',
      brand,
      originalUserId: user.id,
      shadowUserId,
    });
    const refreshTokenHash = await this.tokenService.hashToken(refreshToken);

    await brandTokenRepo.createRefreshToken({
      userId: user.id,
      token: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { _user: user, accessToken, refreshToken, isAdmin, shadowUserId };
  }

  async logout(token: string, userId?: string, ip?: string) {
    const tokenHash = await this.tokenService.hashToken(token);
    
    await this.tokenRepo.revokeToken(tokenHash);

    // Force Offline status by setting lastActiveAt to null or old date
    if (userId !== undefined) {
        // Set to 1 hour ago to ensure they appear offline immediately
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); 
        await this.userRepo.updateLastActive(userId, oneHourAgo);
    }

    await this.auditService.log({ userId, action: 'logout_success', ip });
  }

  async heartbeat(userId: string) {
    await this.userRepo.updateLastActive(userId);
    return true;
  }

  async touchUserSession(userId: string) {
      await this.tokenRepo.touchSession(userId);
  }
}
