import { db, users, refreshTokens } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { SecurityService } from './security.service';
import { AuditService } from './audit.service';

export class AdminAuthService {
  static async login(email: string, password: string, ip: string = '0.0.0.0') {
    // 1. Check Lockout
    if (await SecurityService.isAccountLocked(email, ip)) {
      await AuditService.log({ action: 'admin_login_locked', metadata: { email }, ip });
      throw new Error('Account access restricted. Contact Governance.');
    }

    // 2. Find User with Roles
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        profile: true,
        userRoles: {
          with: { role: true }
        }
      }
    });
    console.log('>>> [AdminAuthService] User found:', !!user);

    // 3. Validate Credentials
    if (!user || !(await PasswordService.compare(password, user.passwordHash))) {
      await SecurityService.trackLoginAttempt(ip, email, false);
      await AuditService.log({ action: 'admin_login_failed', metadata: { email, reason: 'credentials' }, ip });
      throw new Error('Access Denied');
    }

    // 4. Validate Admin Role (Governance Check)
    const roleNames = user.userRoles.map(ur => ur.role.name);
    const isAdmin = roleNames.includes('ADMIN') || roleNames.includes('SUPER_ADMIN');

    if (!isAdmin) {
      // Critical: User credentials correct, but not an admin. 
      await SecurityService.trackLoginAttempt(ip, email, false); // Count as failure
      await AuditService.log({ userId: user.id, action: 'admin_access_violation', metadata: { email, role: roleNames }, ip });
      throw new Error('Unauthorized: Governance Privileges Required');
    }

    // 5. Success
    await SecurityService.trackLoginAttempt(ip, email, true);
    await AuditService.log({ userId: user.id, action: 'admin_login_success', ip });

    // 6. Generate Admin-Scoped Tokens
    const accessToken = await TokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: roleNames,
      isAdmin: true, // Explicit
    });

    const refreshToken = await TokenService.generateRefreshToken(user.id, true);
    const refreshTokenHash = await TokenService.hashToken(refreshToken);

    await db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { user, accessToken, refreshToken };
  }
}
