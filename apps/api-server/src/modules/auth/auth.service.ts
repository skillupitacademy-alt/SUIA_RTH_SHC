import { db, users, userProfiles, roles, userRoles, refreshTokens, verificationTokens, passwordResetTokens } from '@quiz/db';
import { eq, sql, and, gt } from 'drizzle-orm';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { SecurityService } from './security.service';
import { AuditService } from './audit.service';
import { EmailService } from '../email/EmailService';
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
        profile: true,
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

    if (user.isBlocked) {
        await AuditService.log({ action: 'login_blocked_user', metadata: { email }, ip });
        throw new Error('Account has been blocked. Contact administrator.');
    }

    // Update Last Active
    await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));

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
    
    if (user.isBlocked) {
        throw new Error('access_denied:user_blocked');
    }

    // Update Last Active on Refresh
    await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));

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

    // Force Offline status by setting lastActiveAt to null or old date
    if (userId) {
        // Set to 1 hour ago to ensure they appear offline immediately
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); 
        await db.update(users).set({ lastActiveAt: oneHourAgo }).where(eq(users.id, userId));
    }

    await AuditService.log({ userId, action: 'logout_success', ip });
  }

  static async heartbeat(userId: string) {
    await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, userId));
    return true;
  }

  static async touchSession(token: string) {
    // We don't want to hash the token here if we are passing the raw token from middleware.
    // The middleware extracts the Access Token, but we track sessions via Refresh Tokens usually.
    // However, the rate-limit middleware has the Access Token.
    // We need to find the session associated with the user.
    // OPTIMIZATION: If we only have Access Token, we might assume the User is online.
    // But `refreshTokens` table stores the session.
    // We should ideally update ALL valid refresh tokens for this user?
    // OR, we can just update the `users` table `lastActiveAt` if we added it there.
    // But the plan said `refreshTokens` table.
    
    // Changing strategy: Update usage based on User ID.
    // But we need to update the specific session if possible.
    // Since we don't have the refresh token in every request, 
    // we will update ALL active refresh tokens for this user to `now()`.
    // this keeps them "alive".
    
    // Wait, the plan said "Add lastActiveAt to refreshTokens schema".
    // If I only have the Access Token, I know the User ID.
    // So I will update all non-revoked refresh tokens for this user.
    
    // NOTE: This might be heavy if a user has many sessions.
    // But typically they have 1-3.
    
    // For now, let's assume we pass the UserId derived from the Access Token.
    // So method signature should probably be `touchSession(userId: string)`.
    // But the plan said `touchSession(token)`.
    // I'll stick to `touchSession(userId: string)` as it's more practical from middleware.
  }

  static async touchUserSession(userId: string) {
     await db.update(refreshTokens)
      .set({ lastActiveAt: new Date() })
      .where(and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.revoked, false),
        gt(refreshTokens.expiresAt, new Date())
      ));
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
    await AuditService.log({ userId, action: 'email_verification_resend_triggered', ip });
    return true;
  }

  static async forgotPassword(email: string, ip?: string) {
    await AuditService.log({ action: 'auth_forgot_password_requested', metadata: { email_redacted: '***' }, ip });

    // 1. Check if user exists (with roles)
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
      with: {
        userRoles: {
          with: { role: true }
        }
      }
    });

    // 2. Regardless of existence, return success (prevents enumeration)
    if (!user) {
      return true; 
    }

    // 3. User exists: Generate secure reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

    // 4. Store token
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // 5. Determine correct UI URL (Governance vs Web)
    const roleNames = user.userRoles.map(ur => ur.role.name);
    const isAdmin = roleNames.includes('ADMIN') || roleNames.includes('SUPER_ADMIN');
    
    const baseUrl = isAdmin 
      ? (process.env.ADMIN_URL || process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.realtutorialhub.com')
      : (process.env.APP_BASE_URL || 'https://quiz.realtutorialhub.com');

    const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
    
    await EmailService.sendPasswordResetEmail(user.email, resetUrl);

    return true;
  }

  static async validateResetToken(token: string) {
    const validToken = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date())
      ),
    });

    return !!validToken;
  }

  static async resetPassword(token: string, newPassword: string, ip?: string) {
    const validToken = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date())
      ),
    });

    if (!validToken) {
      await AuditService.log({ action: 'password_reset_failed', metadata: { reason: 'invalid_or_expired_token' }, ip });
      throw new Error('Invalid or expired password reset link');
    }

    const passwordHash = await PasswordService.hash(newPassword);

    await db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, validToken.userId));

    // Invalidate token
    await db.delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, validToken.id));

    await AuditService.log({ userId: validToken.userId, action: 'auth_password_reset_completed', ip });
    
    return true;
  }
}
