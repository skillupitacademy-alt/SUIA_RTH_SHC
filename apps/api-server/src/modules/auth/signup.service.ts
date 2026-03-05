import crypto from 'crypto';

import { AuditService } from '@/modules/auth/audit.service';
import { PasswordService } from '@/modules/auth/password.service';
import { UserRepository } from '@/modules/auth/repositories/user.repository';

const userRepo = new UserRepository();

export class SignupService {
  static async signup(email: string, password: string, name: string, ip?: string) {
    await AuditService.log({ action: 'signup_attempt', metadata: { email }, ip });

    const existingUser = await userRepo.findByEmail(email);

    if (existingUser !== undefined) {
      await AuditService.log({ action: 'signup_failed', metadata: { reason: 'user_exists', email }, ip });
      throw new Error('User already exists');
    }

    const passwordHash = await PasswordService.hash(password);

    // Neon HTTP driver doesn't support transactions, so we do sequential inserts
    const newUser = await userRepo.create({
      email,
      passwordHash,
      name,
    });

    await userRepo.assignRole(newUser.id, 'USER');

    await AuditService.log({ userId: newUser.id, action: 'signup_success', ip });
    return newUser;
  }

  static async verifyEmail(token: string, ip?: string) {
    const verifiedToken = await userRepo.findToken(token);

    if (verifiedToken === undefined || verifiedToken.expiresAt < new Date()) {
      await AuditService.log({ action: 'email_verification_failed', metadata: { reason: 'invalid_or_expired' }, ip });
      throw new Error('Invalid or expired verification _token');
    }

    await userRepo.verifyEmail(verifiedToken.userId);
    await userRepo.deleteToken(verifiedToken.id);

    await AuditService.log({ userId: verifiedToken.userId, action: 'email_verification_success', ip });
    return true; 
  }

  static async resendVerification(userId: string, ip?: string) {
    const user = await userRepo.findById(userId);

    if (user === undefined) throw new Error('User not found');
    if (user.emailVerified === true) throw new Error('Email already verified');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await userRepo.createToken(userId, token, expiresAt);

    // In a real app, send email here.
    await AuditService.log({ userId, action: 'email_verification_resend_triggered', ip });
    return true;
  }
}
