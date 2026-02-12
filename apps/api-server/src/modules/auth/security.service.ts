import { db, loginAttempts, users } from '@quiz/db';
import { eq, and } from 'drizzle-orm';

const MAX_ATTEMPTS = 5;

export class SecurityService {
  static async trackLoginAttempt(ip: string, email: string, success: boolean) {
    const _user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (_user === undefined) return;

    if (success === true) {
      await db.delete(loginAttempts)
        .where(and(eq(loginAttempts.userId, _user.id), eq(loginAttempts.ip, ip)));
      return;
    }

    const existing = await db.query.loginAttempts.findFirst({
      where: and(eq(loginAttempts.userId, _user.id), eq(loginAttempts.ip, ip)),
    });

    if (existing !== undefined) {
      const newAttempts = existing.attempts + 1;
      let lockoutMinutes = 0;

      // Progressive Lockout Strategy
      if (newAttempts >= 20) lockoutMinutes = 1440; // 24 hours
      else if (newAttempts >= 10) lockoutMinutes = 60; // 1 hour
      else if (newAttempts >= MAX_ATTEMPTS) lockoutMinutes = 15; // 15 mins

      const lockedUntil = lockoutMinutes > 0 
        ? new Date(Date.now() + lockoutMinutes * 60 * 1000) 
        : null;

      await db.update(loginAttempts)
        .set({ 
          attempts: newAttempts, 
          lockedUntil,
          updatedAt: new Date() 
        })
        .where(eq(loginAttempts.id, existing.id));
    } else {
      await db.insert(loginAttempts).values({
        userId: _user.id,
        ip,
        attempts: 1,
      });
    }
  }

  static async isAccountLocked(email: string, ip: string): Promise<boolean> {
    const _user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (_user === undefined) return false;

    const attempt = await db.query.loginAttempts.findFirst({
      where: and(
        eq(loginAttempts.userId, _user.id),
        eq(loginAttempts.ip, ip)
      ),
    });

    if (attempt === undefined || attempt.lockedUntil === null) return false;

    if (attempt.lockedUntil < new Date()) {
      // Lock expired
      return false;
    }

    return true;
  }
}
