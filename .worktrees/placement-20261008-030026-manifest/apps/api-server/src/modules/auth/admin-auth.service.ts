import { UserIdentityBridgeService } from '@quiz/identity-bridge';
import { eq } from 'drizzle-orm';

import type { RequestBrand } from '@/lib/request-brand';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';
import { container } from '@/modules/core/container';

import { AuditService } from './audit.service';
import { PasswordService } from './password.service';
import { SecurityService } from './security.service';
import { TokenService } from './token.service';

type AdminUserRow = {
  id: string;
  email: string;
  shadowUserId: unknown;
  passwordHash: string;
  name: string | null;
  roleName: string | null;
};

function normalizeRoleName(role: string | null | undefined): string | null {
  if (typeof role !== 'string') {
    return null;
  }

  const normalized = role.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export class AdminAuthService {
  static async login(email: string, password: string, ip: string = 'unknown', requestedAudience: string = 'admin', brand: RequestBrand = 'realtutorialhub') {
    const cleanEmail = email.trim();
    const brandContext = getAuthBrandContext(brand);
    const useBrandBinding = shouldUseBrandBinding();
    const securityService = useBrandBinding && typeof container.get(SecurityService).withContext === 'function'
      ? container.get(SecurityService).withContext(brandContext.db, {
          users: brandContext.tables.users,
          loginAttempts: brandContext.tables.loginAttempts,
        })
      : container.get(SecurityService);

    // 1. Check Lockout
    if (await securityService.isAccountLocked(cleanEmail, ip, brand)) {
      await container.get(AuditService).log({ action: 'admin_login_locked', metadata: { email: cleanEmail }, ip, brand });
      throw new Error('Account access restricted. Contact Governance.');
    }

    // 2. Find User with Roles
    const usersWithRoles = await brandContext.db.select({
        id: brandContext.tables.users.id,
        email: brandContext.tables.users.email,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        shadowUserId: (brandContext.tables.users as any).shadowUserId,
        passwordHash: brandContext.tables.users.passwordHash,
        name: brandContext.tables.userProfiles.name,
        roleName: brandContext.tables.roles.name
    })
    .from(brandContext.tables.users)
    .leftJoin(brandContext.tables.userProfiles, eq(brandContext.tables.users.id, brandContext.tables.userProfiles.userId))
    .leftJoin(brandContext.tables.userRoles, eq(brandContext.tables.users.id, brandContext.tables.userRoles.userId))
    .leftJoin(brandContext.tables.roles, eq(brandContext.tables.userRoles.roleId, brandContext.tables.roles.id))
    .where(eq(brandContext.tables.users.email, cleanEmail));
    
    if (usersWithRoles.length === 0) {
      await securityService.trackLoginAttempt(ip, cleanEmail, false, brand);
      throw new Error('Access Denied');
    }

    const typedUsersWithRoles = usersWithRoles as AdminUserRow[];
    const user = typedUsersWithRoles[0];

    // 3. Validate Credentials
    const isPasswordMatch = await container.get(PasswordService).compare(password, user.passwordHash);

    if (isPasswordMatch === false) {
      await securityService.trackLoginAttempt(ip, cleanEmail, false, brand);
      await container.get(AuditService).log({ action: 'admin_login_failed', metadata: { email: cleanEmail, reason: 'credentials' }, ip, brand });
      throw new Error('Access Denied');
    }

    const roleNames = typedUsersWithRoles
      .map((row) => normalizeRoleName(row.roleName))
      .filter((name: string | null): name is string => name !== null);
    const isAdmin = roleNames.includes('admin') || roleNames.includes('super_admin') || roleNames.includes('infrastructure');

    if (isAdmin === false) {
      await securityService.trackLoginAttempt(ip, cleanEmail, false, brand);
      await container.get(AuditService).log({ userId: user.id, action: 'admin_access_violation', metadata: { email: cleanEmail, role: roleNames }, ip, brand });
      throw new Error('Unauthorized: Governance Privileges Required');
    }

    // Portal Defense: Ensure 'infra' audience is only granted to users with the INFRASTRUCTURE role
    if (requestedAudience === 'infra' && roleNames.includes('infrastructure') === false) {
        await container.get(AuditService).log({ userId: user.id, action: 'admin_audience_violation', metadata: { email: cleanEmail, requestedAud: requestedAudience }, ip, brand });
        throw new Error('Access Denied: Infrastructure privileges required for this portal');
    }

    // 5. Success
    await securityService.trackLoginAttempt(ip, cleanEmail, true, brand);
    await container.get(AuditService).log({ userId: user.id, action: 'admin_login_success', ip, brand });
    let shadowUserId = typeof user.shadowUserId === 'string' && user.shadowUserId.trim().length > 0 ? user.shadowUserId : undefined;
    if (shadowUserId === undefined) {
      const bridge = new UserIdentityBridgeService();
      const result = await bridge.syncUser({
        externalId: user.id,
        externalBrand: brand,
        email: user.email,
        platform: brand,
        role: roleNames.includes('super_admin') ? 'super_admin' : roleNames.includes('admin') ? 'admin' : 'student',
      });
      await bridge.updateShadowUserId(brandContext.db, brandContext.tables.users, user.id, result.shadowUserId);
      await bridge.grantPlatformAccess(result.shadowUserId, brand);
      shadowUserId = result.shadowUserId;
    }

    // 6. Generate Admin-Scoped Tokens with Portal Identity
    const accessToken = await container.get(TokenService).generateAccessToken({
      userId: user.id,
      originalUserId: user.id,
      shadowUserId,
      email: user.email,
      roles: roleNames,
      isAdmin: true,
      aud: requestedAudience,
      tokenType: 'admin',
      brand,
    });

    const refreshToken = await container.get(TokenService).generateRefreshToken(user.id, true, requestedAudience, {
      tokenType: 'admin',
      brand,
      originalUserId: user.id,
      shadowUserId,
    });
    const refreshTokenHash = await container.get(TokenService).hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours absolute limit

    await brandContext.db.insert(brandContext.tables.refreshTokens).values({
      userId: user.id,
      token: refreshTokenHash,
      expiresAt,
    });

    const primaryRole = roleNames[0] ?? 'admin';

    return { 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name ?? 'Admin', 
        isAdmin: true,
        role: primaryRole,
        shadowUserId,
      }, 
      accessToken, 
      refreshToken,
      expiresAt: expiresAt.toISOString()
    };
  }
}
