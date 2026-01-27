import { db, users, refreshTokens } from '@quiz/db';
import { eq, sql } from 'drizzle-orm';
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
    console.log(`>>> [AdminAuthService] Attempting login for: ${cleanEmail}`);
    
    const user = await db.query.users.findFirst({
      where: eq(users.email, cleanEmail),
      with: {
        profile: true,
        userRoles: {
          with: { role: true }
        }
      }
    });
    
    if (!user) {
      console.log(`>>> [AdminAuthService] User NOT FOUND in database for: ${cleanEmail}`);
      await SecurityService.trackLoginAttempt(ip, cleanEmail, false);
      throw new Error('Access Denied');
    }

    console.log(`>>> [AdminAuthService] User found. Hashed password in DB: ${user.passwordHash}`);

    // 3. Validate Credentials
    const isPasswordMatch = await PasswordService.compare(password, user.passwordHash);
    console.log(`>>> [AdminAuthService] Password Match Result: ${isPasswordMatch}`);

    if (!isPasswordMatch) {
      console.log(`>>> [AdminAuthService] Password mismatch for: ${cleanEmail}`);
      await SecurityService.trackLoginAttempt(ip, cleanEmail, false);
      await AuditService.log({ action: 'admin_login_failed', metadata: { email: cleanEmail, reason: 'credentials' }, ip });
      throw new Error('Access Denied');
    }

    // 4. Validate Admin Role (Governance Check)
    const roleNames = user.userRoles.map(ur => ur.role.name);
    const isAdmin = roleNames.includes('ADMIN') || roleNames.includes('SUPER_ADMIN');
    console.log(`>>> [AdminAuthService] User Roles: ${roleNames.join(', ')}`);
    console.log(`>>> [AdminAuthService] Is Admin: ${isAdmin}`);

    if (!isAdmin) {
      console.log(`>>> [AdminAuthService] Access Violation: User ${cleanEmail} has no admin roles.`);
      await SecurityService.trackLoginAttempt(ip, cleanEmail, false);
      await AuditService.log({ userId: user.id, action: 'admin_access_violation', metadata: { email: cleanEmail, role: roleNames }, ip });
      throw new Error('Unauthorized: Governance Privileges Required');
    }

    // 5. Success
    await SecurityService.trackLoginAttempt(ip, cleanEmail, true);
    await AuditService.log({ userId: user.id, action: 'admin_login_success', ip });

    // 6. Generate Admin-Scoped Tokens
    console.log(`>>> [AdminAuthService] Generating tokens...`);
    const accessToken = await TokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: roleNames,
      isAdmin: true,
    });

    const refreshToken = await TokenService.generateRefreshToken(user.id, true);
    console.log(`>>> [AdminAuthService] Tokens generated. Refreshing tokens in DB...`);
    const refreshTokenHash = await TokenService.hashToken(refreshToken);

    await db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    console.log(`>>> [AdminAuthService] Login Successful for: ${cleanEmail}`);

    return { user: { id: user.id, email: user.email, profile: user.profile }, accessToken, refreshToken };
  }
}
