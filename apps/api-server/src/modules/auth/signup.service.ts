import { db, roles, userProfiles, userRoles, users, verificationTokens } from '@quiz/db';
import crypto from 'crypto';
import { eq, sql } from 'drizzle-orm';

import { AuditService } from '@/modules/auth/audit.service';
import { PasswordService } from '@/modules/auth/password.service';

export class SignupService {
  static async signup(email: string, password: string, name: string, ip?: string) {
    await AuditService.log({ action: 'signup_attempt', metadata: { email }, ip });

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser !== undefined) {
      await AuditService.log({ action: 'signup_failed', metadata: { reason: 'user_exists', email }, ip });
      throw new Error('User already exists');
    }

    const passwordHash = await PasswordService.hash(password);

    // Neon HTTP driver doesn't support transactions, so we do sequential inserts
    const [_user] = await db.insert(users).values({
      email,
      passwordHash,
    }).returning();

    await db.insert(userProfiles).values({
      userId: _user.id,
      name,
    });

    const userRole = await db.query.roles.findFirst({
      where: sql`${roles.name} = 'USER'`,
    });

    if (userRole !== undefined) {
      await db.insert(userRoles).values({
        userId: _user.id,
        roleId: userRole.id,
      });
    }

    const newUser = _user;

    await AuditService.log({ userId: newUser.id, action: 'signup_success', ip });
    return newUser;
  }

  static async verifyEmail(token: string, ip?: string) {
    const verifiedToken = await db.query.verificationTokens.findFirst({
      where: eq(verificationTokens.token, token),
    });

    if (verifiedToken === undefined || verifiedToken.expiresAt < new Date()) {
      await AuditService.log({ action: 'email_verification_failed', metadata: { reason: 'invalid_or_expired' }, ip });
      throw new Error('Invalid or expired verification _token');
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

    if (user === undefined) throw new Error('User not found');
    if (user.emailVerified === true) throw new Error('Email already verified');

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
}
