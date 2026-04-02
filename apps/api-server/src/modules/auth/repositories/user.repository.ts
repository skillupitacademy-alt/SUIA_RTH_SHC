import { auditLogs, db, passwordResetTokens, roles, userProfiles, userRoles, users, verificationTokens } from '@quiz/db';
import { eq, gt, sql } from 'drizzle-orm';

import type { BrandAuthTables } from '@/modules/auth/brand-db';
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
  protected tables: BrandAuthTables;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(
    dbInstance: any = db,
    tables: BrandAuthTables = {
      users,
      userProfiles,
      roles,
      userRoles,
      auditLogs,
      verificationTokens,
      passwordResetTokens,
      refreshTokens: undefined as never,
      loginAttempts: undefined as never,
    },
  ) {
    super(dbInstance);
    this.tables = tables;
    this.table = tables.users as typeof users;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  withDb(dbClient: any, tables: BrandAuthTables = this.tables): this {
    return new UserRepository(dbClient, tables) as this;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return await this.dbInstance.query.users.findFirst({
      where: eq(this.tables.users.email, email),
    });
  }

  async findWithDetails(email: string) {
    const user = await this.findByEmail(email);
    if (user === undefined) return undefined;
    return this.hydrateUserDetails(user);
  }

  async findByIdWithDetails(id: string) {
    const user = await this.findById(id);
    if (user === undefined) return undefined;
    return this.hydrateUserDetails(user);
  }

  async updateLastActive(id: string, date: Date = new Date()) {
    await this.dbInstance.update(this.tables.users).set({ lastActiveAt: date }).where(eq(this.tables.users.id, id));
  }

  async create(data: { email: string; passwordHash: string; name: string }, tx?: Pick<typeof db, 'insert' | 'query'>) {
    const executor = tx ?? this.dbInstance;
    const [user] = await executor.insert(this.tables.users).values({
      email: data.email,
      passwordHash: data.passwordHash,
    }).returning();

    await executor.insert(this.tables.userProfiles).values({
      userId: user.id,
      name: data.name,
    });

    return user;
  }

  async assignRole(userId: string, roleName: string, tx?: Pick<typeof db, 'insert' | 'query'>) {
    const executor = tx ?? this.dbInstance;
    const role = await executor.query.roles.findFirst({
      where: sql`${this.tables.roles.name} = ${roleName}`,
    });

    if (role !== null && role !== undefined) {
      await executor.insert(this.tables.userRoles).values({
        userId,
        roleId: role.id,
      });
    }
  }

  async verifyEmail(id: string) {
    await this.dbInstance.update(this.tables.users)
      .set({ emailVerified: true })
      .where(eq(this.tables.users.id, id));
  }

  async findToken(token: string) {
    return await this.dbInstance.query.verificationTokens.findFirst({
      where: eq(this.tables.verificationTokens.token, token),
    });
  }

  async deleteToken(tokenId: string) {
    await this.dbInstance.delete(this.tables.verificationTokens).where(eq(this.tables.verificationTokens.id, tokenId));
  }

  async createToken(userId: string, token: string, expiresAt: Date) {
    await this.dbInstance.insert(this.tables.verificationTokens).values({
      userId,
      token,
      expiresAt,
    });
  }

  async createResetToken(userId: string, token: string, expiresAt: Date) {
    await this.dbInstance.insert(this.tables.passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });
  }

  async findResetToken(token: string) {
    return await this.dbInstance.query.passwordResetTokens.findFirst({
      where: sql`${this.tables.passwordResetTokens.token} = ${token} and ${this.tables.passwordResetTokens.expiresAt} > ${new Date()}`
    });
  }

  async deleteResetToken(id: string) {
    await this.dbInstance.delete(this.tables.passwordResetTokens).where(eq(this.tables.passwordResetTokens.id, id));
  }

  async updatePassword(id: string, passwordHash: string) {
    await this.dbInstance.update(this.tables.users)
      .set({ passwordHash })
      .where(eq(this.tables.users.id, id));
  }

  async findById(id: string): Promise<User | undefined> {
    return await this.dbInstance.query.users.findFirst({
      where: eq(this.tables.users.id, id),
    });
  }

  private async hydrateUserDetails(user: User) {
    const profile = await this.dbInstance.query.userProfiles.findFirst({
      where: eq(this.tables.userProfiles.userId, user.id),
    });

    const roleRows = await this.dbInstance
      .select({
        roleId: this.tables.roles.id,
        roleName: this.tables.roles.name,
      })
      .from(this.tables.userRoles)
      .innerJoin(this.tables.roles, eq(this.tables.userRoles.roleId, this.tables.roles.id))
      .where(eq(this.tables.userRoles.userId, user.id));

    return {
      ...user,
      profile,
      userRoles: roleRows.map((roleRow) => ({
        roleId: roleRow.roleId,
        role: {
          id: roleRow.roleId,
          name: roleRow.roleName,
        },
      })),
    };
  }
}
