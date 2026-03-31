import { db, passwordResetTokens, roles, userProfiles, userRoles, users, verificationTokens } from '@quiz/db';
import { and, eq, gt, sql } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  isBlocked: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  lastActiveAt: Date | null;
}

export class UserRepository extends BaseRepository<User, typeof users> {
  protected table = users;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(dbInstance: any = db) {
    super(dbInstance);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  withDb(dbClient: any): this {
    return new UserRepository(dbClient) as this;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return await this.dbInstance.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async findWithDetails(email: string) {
    return await this.dbInstance.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        profile: true,
        userRoles: {
          with: { role: true }
        }
      }
    });
  }

  async findByIdWithDetails(id: string) {
    return await this.dbInstance.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        profile: true,
        userRoles: {
          with: { role: true }
        }
      }
    });
  }

  async updateLastActive(id: string, date: Date = new Date()) {
    await this.dbInstance.update(users).set({ lastActiveAt: date }).where(eq(users.id, id));
  }

  async create(data: { email: string; passwordHash: string; name: string }, tx?: Pick<typeof db, 'insert' | 'query'>) {
    const executor = tx ?? this.dbInstance;
    const [user] = await executor.insert(users).values({
      email: data.email,
      passwordHash: data.passwordHash,
    }).returning();

    await executor.insert(userProfiles).values({
      userId: user.id,
      name: data.name,
    });

    return user;
  }

  async assignRole(userId: string, roleName: string, tx?: Pick<typeof db, 'insert' | 'query'>) {
    const executor = tx ?? this.dbInstance;
    const role = await executor.query.roles.findFirst({
      where: sql`${roles.name} = ${roleName}`,
    });

    if (role !== null && role !== undefined) {
      await executor.insert(userRoles).values({
        userId,
        roleId: role.id,
      });
    }
  }

  async verifyEmail(id: string) {
    await this.dbInstance.update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, id));
  }

  async findToken(token: string) {
    return await this.dbInstance.query.verificationTokens.findFirst({
      where: eq(verificationTokens.token, token),
    });
  }

  async deleteToken(tokenId: string) {
    await this.dbInstance.delete(verificationTokens).where(eq(verificationTokens.id, tokenId));
  }

  async createToken(userId: string, token: string, expiresAt: Date) {
    await this.dbInstance.insert(verificationTokens).values({
      userId,
      token,
      expiresAt,
    });
  }

  async createResetToken(userId: string, token: string, expiresAt: Date) {
    await this.dbInstance.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });
  }

  async findResetToken(token: string) {
    return await this.dbInstance.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    });
  }

  async deleteResetToken(id: string) {
    await this.dbInstance.delete(passwordResetTokens).where(eq(passwordResetTokens.id, id));
  }

  async updatePassword(id: string, passwordHash: string) {
    await this.dbInstance.update(users)
      .set({ passwordHash })
      .where(eq(users.id, id));
  }
}
