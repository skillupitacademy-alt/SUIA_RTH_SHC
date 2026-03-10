import crypto from 'crypto';

import { eventBus } from '@/lib/event-bus';
import { AppEvents } from '@/lib/events';
import { AuditService } from '@/modules/auth/audit.service';
import { PasswordService } from '@/modules/auth/password.service';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { container } from '@/modules/core/container';

export class SignupService {
  constructor(
    private userRepo = container.get(UserRepository),
    private auditService = container.get(AuditService),
    private passwordService = container.get(PasswordService)
  ) {}

  async signup(email: string, password: string, name: string, ip?: string) {
    await this.auditService.log({ action: 'signup_attempt', metadata: { email }, ip });

    const existingUser = await this.userRepo.findByEmail(email);

    if (existingUser !== undefined) {
      await this.auditService.log({ action: 'signup_failed', metadata: { reason: 'user_exists', email }, ip });
      throw new Error('User already exists');
    }

    const passwordHash = await this.passwordService.hash(password);

    const { db } = await import('@quiz/db');
    const newUser = await db.transaction(async (tx) => {
      const user = await this.userRepo.create({
        email,
        passwordHash,
        name,
      }, tx);

      if (this.userRepo.assignRole.length >= 3) {
        await this.userRepo.assignRole(user.id, 'USER', tx);
      } else {
        await this.userRepo.assignRole(user.id, 'USER');
      }
      return user;
    });

    if (newUser?.id) {
      await this.auditService.log({ userId: newUser.id, action: 'signup_success', ip });
    }

    // Task 115: Emit event for read model updates
    if (newUser?.id && newUser?.email) {
      void eventBus.emitEvent(AppEvents.USER_SIGNED_UP, {
        userId: newUser.id,
        email: newUser.email,
        signedUpAt: new Date()
      });
    }

    return newUser;
  }

  async verifyEmail(token: string, ip?: string) {
    const verifiedToken = await this.userRepo.findToken(token);

    if (verifiedToken === undefined || verifiedToken.expiresAt < new Date()) {
      await this.auditService.log({ action: 'email_verification_failed', metadata: { reason: 'invalid_or_expired' }, ip });
      throw new Error('Invalid or expired verification _token');
    }

    await this.userRepo.verifyEmail(verifiedToken.userId);
    await this.userRepo.deleteToken(verifiedToken.id);

    await this.auditService.log({ userId: verifiedToken.userId, action: 'email_verification_success', ip });
    return true; 
  }

  async resendVerification(userId: string, ip?: string) {
    const user = await this.userRepo.findById(userId);

    if (user === undefined) throw new Error('User not found');
    if (user.emailVerified === true) throw new Error('Email already verified');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.userRepo.createToken(userId, token, expiresAt);

    // In a real app, send email here.
    await this.auditService.log({ userId, action: 'email_verification_resend_triggered', ip });
    return true;
  }
}
