import { db, users, userProfiles, roles, userRoles, refreshTokens, verificationTokens } from '@quiz/db';
import { eq, sql, and } from 'drizzle-orm';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { SecurityService } from './security.service';
import { AuditService } from './audit.service';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export class AuthService {
  static async signup(email: string, password: string, name: string, ip?: string) {
    await AuditService.log({ action: 'signup_attempt', metadata: { email }, ip });

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      await AuditService.log({ action: 'signup_failed', metadata: { reason: 'user_exists', email }, ip });
      throw new Error('User already exists');
    }

    const passwordHash = await PasswordService.hash(password);

    // Neon HTTP driver doesn't support transactions, so we do sequential inserts
    const [user] = await db.insert(users).values({
      email,
      passwordHash,
    }).returning();

    await db.insert(userProfiles).values({
      userId: user.id,
      name,
    });

    const userRole = await db.query.roles.findFirst({
      where: sql`${roles.name} = 'USER'`,
    });

    if (userRole) {
      await db.insert(userRoles).values({
        userId: user.id,
        roleId: userRole.id,
      });
    }

    const newUser = user;

    await AuditService.log({ userId: newUser.id, action: 'signup_success', ip });
    return newUser;
  }

  static async login(email: string, password: string, ip: string = '0.0.0.0') {
    if (await SecurityService.isAccountLocked(email, ip)) {
      await AuditService.log({ action: 'login_locked', metadata: { email }, ip });
      throw new Error('Account temporarily locked. Try again later.');
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        userRoles: {
          with: { role: true }
        }
      }
    });

    if (!user || !(await PasswordService.compare(password, user.passwordHash))) {
      await SecurityService.trackLoginAttempt(ip, email, false);
      await AuditService.log({ action: 'login_failed', metadata: { email }, ip });
      throw new Error('Invalid credentials');
    }

    await SecurityService.trackLoginAttempt(ip, email, true);
    await AuditService.log({ userId: user.id, action: 'login_success', ip });

    const roleNames = user.userRoles.map(ur => ur.role.name);
    const isAdmin = roleNames.includes('ADMIN') || roleNames.includes('SUPER_ADMIN');

    const accessToken = await TokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: roleNames,
      isAdmin,
    });

    const refreshToken = await TokenService.generateRefreshToken(user.id, isAdmin);
    const refreshTokenHash = await TokenService.hashToken(refreshToken);

    await db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { user, accessToken, refreshToken, isAdmin };
  }

  static async refresh(token: string, ip?: string) {
    const decoded = jwt.decode(token) as any;
    const isAdmin = decoded?.isAdmin === true;

    let payload;
    try {
      payload = await TokenService.verifyRefreshToken(token, isAdmin);
    } catch {
      await AuditService.log({ action: 'refresh_failed', metadata: { reason: 'invalid_token' }, ip });
      throw new Error('Invalid refresh token');
    }

    const tokenHash = await TokenService.hashToken(token);

    const storedToken = await db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.token, tokenHash),
        eq(refreshTokens.revoked, false)
      ),
    });

    if (!storedToken) {
      await db.update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.userId, payload.userId));
      
      await AuditService.log({ 
        userId: payload.userId, 
        action: 'security_alert_token_reuse', 
        metadata: { ip, severity: 'critical' } 
      });
      throw new Error('Security Alert: Session compromised. All tokens revoked.');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new Error('Refresh token expired');
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
      with: {
        userRoles: {
          with: { role: true }
        }
      }
    });

    if (!user) throw new Error('User not found');
    const roleNames = user.userRoles.map(ur => ur.role.name);
    const isAdminNow = roleNames.includes('ADMIN') || roleNames.includes('SUPER_ADMIN');

    const newAccessToken = await TokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: roleNames,
      isAdmin: isAdminNow,
    });
    
    const newRefreshToken = await TokenService.generateRefreshToken(user.id, isAdminNow);
    const newRefreshTokenHash = await TokenService.hashToken(newRefreshToken);

    await db.update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.id, storedToken.id));

    await db.insert(refreshTokens).values({
      userId: user.id,
      token: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await AuditService.log({ userId: user.id, action: 'refresh_success', ip });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async logout(token: string, userId?: string, ip?: string) {
    const tokenHash = await TokenService.hashToken(token);
    
    await db.update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.token, tokenHash));

    await AuditService.log({ userId, action: 'logout_success', ip });
  }

  static async verifyEmail(token: string, ip?: string) {
    const verifiedToken = await db.query.verificationTokens.findFirst({
      where: eq(verificationTokens.token, token),
    });

    if (!verifiedToken || verifiedToken.expiresAt < new Date()) {
      await AuditService.log({ action: 'email_verification_failed', metadata: { reason: 'invalid_or_expired' }, ip });
      throw new Error('Invalid or expired verification token');
    }

    await db.update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, verifiedToken.userId));

    await db.delete(verificationTokens)
      .where(eq(verificationTokens.id, verifiedToken.id));

    await AuditService.log({ userId: verifiedToken.userId, action: 'email_verification_success', ip });
    return true; 
  }

  static async resendVerification(userId: string, ip?: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) throw new Error('User not found');
    if (user.emailVerified) throw new Error('Email already verified');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(verificationTokens).values({
      userId,
      token,
      expiresAt,
    });

    // In a real app, send email here.
    console.log(`[VERIFICATION EMAIL] To: ${user.email}, Link: /verify-email?token=${token}`);

    await AuditService.log({ userId, action: 'email_verification_resend_triggered', ip });
    return true;
  }
}
