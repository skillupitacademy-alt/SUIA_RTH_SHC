import { db, refreshTokens, roles, userProfiles, userRoles, users } from '@quiz/db';
import { eq } from "drizzle-orm";

import { container } from '@/modules/core/container';

import { AuditService } from './audit.service';
import { PasswordService } from './password.service';
import { SecurityService } from './security.service';
import { TokenService } from './token.service';
import type { RequestBrand } from '@/lib/request-brand';

export class AdminAuthService {
  static async login(email: string, password: string, ip: string = 'unknown', requestedAudience: string = 'admin', brand: RequestBrand = 'realtutorialhub') {
    const cleanEmail = email.trim();

    // 1. Check Lockout
    if (await container.get(SecurityService).isAccountLocked(cleanEmail, ip, brand)) {
      await container.get(AuditService).log({ action: 'admin_login_locked', metadata: { email: cleanEmail }, ip });
      throw new Error('Account access restricted. Contact Governance.');
    }

    // 2. Find User with Roles
    const _usersWithRoles = await db.select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        name: userProfiles.name,
        roleName: roles.name
    })
    .from(users)
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .leftJoin(userRoles, eq(users.id, userRoles.userId))
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(users.email, cleanEmail));
    
    if (_usersWithRoles.length === 0) {
      await container.get(SecurityService).trackLoginAttempt(ip, cleanEmail, false, brand);
      throw new Error('Access Denied');
    }

    const user = _usersWithRoles[0];

    // 3. Validate Credentials
    const isPasswordMatch = await container.get(PasswordService).compare(password, user.passwordHash);

    if (isPasswordMatch === false) {
      await container.get(SecurityService).trackLoginAttempt(ip, cleanEmail, false, brand);
      await container.get(AuditService).log({ action: 'admin_login_failed', metadata: { email: cleanEmail, reason: 'credentials' }, ip });
      throw new Error('Access Denied');
    }

    const roleNames = _usersWithRoles.map(r => r.roleName).filter((name): name is string => name !== null);
    const isAdmin = roleNames.includes('ADMIN') || roleNames.includes('SUPER_ADMIN') || roleNames.includes('INFRASTRUCTURE');

    if (isAdmin === false) {
      await container.get(SecurityService).trackLoginAttempt(ip, cleanEmail, false, brand);
      await container.get(AuditService).log({ userId: user.id, action: 'admin_access_violation', metadata: { email: cleanEmail, role: roleNames }, ip });
      throw new Error('Unauthorized: Governance Privileges Required');
    }

    // Portal Defense: Ensure 'infra' audience is only granted to users with the INFRASTRUCTURE role
    if (requestedAudience === 'infra' && !roleNames.includes('INFRASTRUCTURE')) {
        await container.get(AuditService).log({ userId: user.id, action: 'admin_audience_violation', metadata: { email: cleanEmail, requestedAud: requestedAudience }, ip });
        throw new Error('Access Denied: Infrastructure privileges required for this portal');
    }

    // 5. Success
    await container.get(SecurityService).trackLoginAttempt(ip, cleanEmail, true, brand);
    await container.get(AuditService).log({ userId: user.id, action: 'admin_login_success', ip });

    // 6. Generate Admin-Scoped Tokens with Portal Identity
    const accessToken = await container.get(TokenService).generateAccessToken({
      userId: user.id,
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
    });
    const refreshTokenHash = await container.get(TokenService).hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours absolute limit

    await db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshTokenHash,
      expiresAt,
    });

    const primaryRole = roleNames[0]?.toLowerCase() ?? 'admin';

    return { 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name ?? 'Admin', 
        isAdmin: true,
        role: primaryRole
      }, 
      accessToken, 
      refreshToken,
      expiresAt: expiresAt.toISOString()
    };
  }
}
