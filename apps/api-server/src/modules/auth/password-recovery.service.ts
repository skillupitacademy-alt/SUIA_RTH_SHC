import { db, passwordResetTokens, users } from '@quiz/db';
import crypto from 'crypto';
import { and, eq, gt } from 'drizzle-orm';

import { AuditService } from '@/modules/auth/audit.service';
import { PasswordService } from '@/modules/auth/password.service';
import { EmailService } from '@/modules/email/EmailService';

export class PasswordRecoveryService {
  static async forgotPassword(email: string, ip?: string) {
    const cleanEmail = email.toLowerCase().trim();
    
    await AuditService.log({ action: 'auth_forgot_password_requested', metadata: { email_redacted: '***' }, ip });

    // 1. Check if user exists (with roles)
    const user = await db.query.users.findFirst({
      where: eq(users.email, cleanEmail),
      with: {
        userRoles: {
          with: { role: true }
        }
      }
    });

    // 2. Regardless of existence, return success (prevents enumeration)
    if (user === undefined) {
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
      ? process.env.NEXT_PUBLIC_ADMIN_URL
      : process.env.NEXT_PUBLIC_WEB_APP_URL;

    if (baseUrl === undefined || baseUrl === null || baseUrl === '') {
        throw new Error(`Environment variable ${isAdmin === true ? 'NEXT_PUBLIC_ADMIN_URL' : 'NEXT_PUBLIC_WEB_APP_URL'} is required for password reset`);
    }

    const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
    
    await EmailService.sendPasswordResetEmail(user.email, resetUrl);

    return true;
  }

  static async validateResetToken(token: string) {
    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    });

    return resetToken || null;
  }

  static async resetPassword(token: string, newPassword: string, ip?: string) {
    const validToken = await this.validateResetToken(token);

    if (validToken === null) {
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
