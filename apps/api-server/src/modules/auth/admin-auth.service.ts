import { db, users, refreshTokens } from '@quiz/db';
import { eq } from "drizzle-orm";
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { SecurityService } from './security.service';
import { AuditService } from './audit.service';

export class AdminAuthService {
  static async login(email: string, password: string, ip: string = '0.0.0.0') {
    const cleanEmail = email.trim();

    // 1. Check Lockout
    if (await SecurityService.isAccountLocked(cleanEmail, ip)) {
      await AuditService.log({ action: 'admin_login_locked', metadata: { email: cleanEmail }, ip });
      throw new Error('Account access restricted. Contact Governance.');
    }

    // 2. Find User with Roles
    const _user = await db.query.users.findFirst({
      where: eq(users.email, cleanEmail),
      with: {
        profile: true,
        userRoles: {
          with: { role: true }
        }
      }
    });
    
    if (_user === undefined) {
      await SecurityService.trackLoginAttempt(ip, cleanEmail, false);
      throw new Error('Access Denied');
    }

    // 3. Validate Credentials
    const isPasswordMatch = await PasswordService.compare(password, _user.passwordHash);

    if (isPasswordMatch === false) {
      await SecurityService.trackLoginAttempt(ip, cleanEmail, false);
      await AuditService.log({ action: 'admin_login_failed', metadata: { email: cleanEmail, reason: 'credentials' }, ip });
      throw new Error('Access Denied');
    }

    // 4. Validate Admin Role (Governance Check)
    const roleNames = _user.userRoles.map(ur => ur.role.name);
    const isAdmin = roleNames.includes('ADMIN') || roleNames.includes('SUPER_ADMIN');

    if (isAdmin === false) {
      await SecurityService.trackLoginAttempt(ip, cleanEmail, false);
      await AuditService.log({ userId: _user.id, action: 'admin_access_violation', metadata: { email: cleanEmail, role: roleNames }, ip });
      throw new Error('Unauthorized: Governance Privileges Required');
    }

    // 5. Success
    await SecurityService.trackLoginAttempt(ip, cleanEmail, true);
    await AuditService.log({ userId: _user.id, action: 'admin_login_success', ip });

    // 6. Generate Admin-Scoped Tokens
    const accessToken = await TokenService.generateAccessToken({
      userId: _user.id,
      email: _user.email,
      roles: roleNames,
      isAdmin: true,
    });

    const refreshToken = await TokenService.generateRefreshToken(_user.id, true);
    const refreshTokenHash = await TokenService.hashToken(refreshToken);

    await db.insert(refreshTokens).values({
      userId: _user.id,
      token: refreshTokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    return { _user: { id: _user.id, email: _user.email, profile: _user.profile }, accessToken, refreshToken };
  }
}
