import { db, loginAttempts, users } from '@quiz/db';
import { eq, and, sql } from 'drizzle-orm';

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

export class SecurityService {
  static async trackLoginAttempt(ip: string, email: string, success: boolean) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) return;

    if (success) {
      // Clear attempts on success
      await db.delete(loginAttempts)
        .where(
          and(
            eq(loginAttempts.userId, user.id),
            eq(loginAttempts.ip, ip)
          )
        );
      return;
    }

    // Handle failure
    const existing = await db.query.loginAttempts.findFirst({
      where: and(
        eq(loginAttempts.userId, user.id),
        eq(loginAttempts.ip, ip)
      ),
    });

    if (existing) {
      const newAttempts = existing.attempts + 1;
      const lockedUntil = newAttempts >= MAX_ATTEMPTS 
        ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000) 
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
        userId: user.id,
        ip,
        attempts: 1,
      });
    }
  }

  static async isAccountLocked(email: string, ip: string): Promise<boolean> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) return false;

    const attempt = await db.query.loginAttempts.findFirst({
      where: and(
        eq(loginAttempts.userId, user.id),
        eq(loginAttempts.ip, ip)
      ),
    });

    if (!attempt || !attempt.lockedUntil) return false;

    if (attempt.lockedUntil < new Date()) {
      // Lock expired
      return false;
    }

    return true;
  }
}
