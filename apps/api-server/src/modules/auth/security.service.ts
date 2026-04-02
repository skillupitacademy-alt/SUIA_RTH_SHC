import { db, loginAttempts, users } from '@quiz/db';
import { and,eq } from 'drizzle-orm';

import type { BrandAuthTables } from '@/modules/auth/brand-db';
import type { RequestBrand } from '@/lib/request-brand';
import { EmailService } from '@/modules/email/EmailService';

const MAX_ATTEMPTS = 5;

export class SecurityService {
  constructor(
    private dbInstance = db,
    private tables: Pick<BrandAuthTables, 'users' | 'loginAttempts'> = { users, loginAttempts },
  ) {}

  withDb(dbClient: typeof db): this {
    return new SecurityService(dbClient, this.tables) as this;
  }

  withContext(dbClient: typeof db, tables: Pick<BrandAuthTables, 'users' | 'loginAttempts'>): this {
    return new SecurityService(dbClient, tables) as this;
  }

  async trackLoginAttempt(ip: string, email: string, success: boolean, brand: RequestBrand = 'realtutorialhub') {
    const _user = await this.dbInstance.query.users.findFirst({
      where: eq(this.tables.users.email, email),
    });

    if (_user === undefined) return;

    if (success === true) {
      await this.dbInstance.delete(loginAttempts)
        .where(and(eq(this.tables.loginAttempts.userId, _user.id), eq(this.tables.loginAttempts.ip, ip), eq(this.tables.loginAttempts.brand, brand)));
      return;
    }

    const existing = await this.dbInstance.query.loginAttempts.findFirst({
      where: and(eq(this.tables.loginAttempts.userId, _user.id), eq(this.tables.loginAttempts.ip, ip), eq(this.tables.loginAttempts.brand, brand)),
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

      await this.dbInstance.update(this.tables.loginAttempts)
        .set({ 
          attempts: newAttempts, 
          lockedUntil,
          updatedAt: new Date() 
        })
        .where(eq(this.tables.loginAttempts.id, existing.id));

      if (lockedUntil !== null && (existing.lockedUntil === null || existing.lockedUntil < lockedUntil)) {
        await EmailService.sendAccountLockout(_user.email, brand);
      }
    } else {
      await this.dbInstance.insert(this.tables.loginAttempts).values({
        userId: _user.id,
        brand,
        ip,
        attempts: 1,
      });
    }
  }

  async isAccountLocked(email: string, ip: string, brand: RequestBrand = 'realtutorialhub'): Promise<boolean> {
    const _user = await this.dbInstance.query.users.findFirst({
      where: eq(this.tables.users.email, email),
    });

    if (_user === undefined) return false;

    const attempt = await this.dbInstance.query.loginAttempts.findFirst({
      where: and(
        eq(loginAttempts.userId, _user.id),
        eq(this.tables.loginAttempts.userId, _user.id),
        eq(this.tables.loginAttempts.ip, ip),
        eq(this.tables.loginAttempts.brand, brand)
      ),
    });

    if (attempt === undefined || attempt.lockedUntil === null) return false;

    if (attempt.lockedUntil < new Date()) {
      // Lock expired
      await this.dbInstance.delete(this.tables.loginAttempts)
        .where(and(
          eq(this.tables.loginAttempts.userId, _user.id),
          eq(this.tables.loginAttempts.ip, ip),
          eq(this.tables.loginAttempts.brand, brand)
        ));
      return false;
    }

    return true;
  }
}
