import crypto from 'crypto';

import type { RequestBrand } from '@/lib/request-brand';
import { AuditService } from '@/modules/auth/audit.service';
import { PasswordService } from '@/modules/auth/password.service';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { container } from '@/modules/core/container';
import { EmailService } from '@/modules/email/EmailService';

export class PasswordRecoveryService {
  constructor(
    private userRepo = container.get(UserRepository),
    private auditService = container.get(AuditService),
    private passwordService = container.get(PasswordService)
  ) {}

  async forgotPassword(email: string, ip?: string, brand: RequestBrand = 'realtutorialhub') {
    const cleanEmail = email.toLowerCase().trim();
    
    await this.auditService.log({ action: 'auth_forgot_password_requested', metadata: { email_redacted: '***' }, ip });

    // 1. Check if user exists (with roles)
    const user = await this.userRepo.findWithDetails(cleanEmail);

    // 2. Regardless of existence, return success (prevents enumeration)
    if (user === undefined) {
      return true; 
    }

    // 3. User exists: Generate secure reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

    // 4. Store token
    await this.userRepo.createResetToken(user.id, token, expiresAt);

    // 5. Determine correct UI URL from deployment config
    const baseUrl = brand === 'realtutorialhub'
      ? 'https://user.realtutorialhub.com'
      : 'https://user.skillupitacademy.com';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    await EmailService.sendPasswordResetEmail(user.email, resetUrl, brand);

    return true;
  }

  async validateResetToken(token: string) {
    const resetToken = await this.userRepo.findResetToken(token);
    return resetToken || null;
  }

  async resetPassword(token: string, newPassword: string, ip?: string, brand: RequestBrand = 'realtutorialhub') {
    // brand reserved for future audit logging
    void brand;
    const validToken = await this.validateResetToken(token);

    if (validToken === null) {
      await this.auditService.log({ action: 'password_reset_failed', metadata: { reason: 'invalid_or_expired_token' }, ip });
      throw new Error('Invalid or expired password reset link');
    }

    const passwordHash = await this.passwordService.hash(newPassword);

    await this.userRepo.updatePassword(validToken.userId, passwordHash);

    // Invalidate token
    await this.userRepo.deleteResetToken(validToken.id);

    await this.auditService.log({ userId: validToken.userId, action: 'auth_password_reset_completed', ip, brand });
    
    return true;
  }
}
