import { auditLogs, db, passwordResetTokens, roles, userProfiles, userRoles, users, verificationTokens } from '@quiz/db';
import { eq, sql } from 'drizzle-orm';

import type { BrandAuthTables } from '@/modules/auth/brand-db';
import { BaseRepository } from '@/modules/core/repositories/base.repository';

// Helper functions to detect DB access mode
function isQueryMode(db: any): boolean {
  return !!db?.query;
}

function isSelectMode(db: any): boolean {
  return typeof db?.select === 'function';
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  isBlocked: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  lastActiveAt: Date | null;
  shadowUserId?: string | null;
  // Onboarding fields
  isOnboarded?: boolean;
  primaryGoal?: string | null;
  domain?: string | null;
  subDomain?: string | null;
  timeCommitment?: string | null;
  journeyStatus?: string | null;
}

export interface PersistedOnboardingInput {
  fullName: string;
  educationLevel: string;
  status: 'student' | 'professional';
  primaryGoal: string;
  domain: string;
  subDomain?: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  timeCommitment: string;
  journeyStatus: 'not_started' | 'in_progress' | 'skipped' | 'completed';
}

export class UserRepository extends BaseRepository<User, typeof users> {
  protected table = users;
  protected tables: BrandAuthTables;

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const db = this.dbInstance;
    const usersTable = this.tables.users;
    
    if (isQueryMode(db)) {
      // Test/mock mode: use query API
      return await db.query.users.findFirst({
        where: (u: any, { eq }: any) => eq(u.email, email),
      }) as User | undefined;
    }
    
    if (isSelectMode(db)) {
      // Production mode: use select with explicit columns and brand-specific table
      const results = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          passwordHash: usersTable.passwordHash,
          emailVerified: usersTable.emailVerified,
          isBlocked: usersTable.isBlocked,
          lastActiveAt: usersTable.lastActiveAt,
          deletedAt: usersTable.deletedAt,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt,
          shadowUserId: usersTable.shadowUserId,
          isOnboarded: usersTable.isOnboarded,
          primaryGoal: usersTable.primaryGoal,
          domain: usersTable.domain,
          subDomain: usersTable.subDomain,
          timeCommitment: usersTable.timeCommitment,
          journeyStatus: usersTable.journeyStatus,
        })
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);
      
      return results[0] as User | undefined;
    }
    
    throw new Error('Invalid DB instance: neither query nor select mode available');
  }

  async findWithDetails(email: string) {
    const user = await this.findByEmail(email);
    if (user === undefined) return undefined;
    return this.hydrateUserDetails(user);
  }

  async findByIdWithDetails(id: string) {
    console.log('[TRACE] UserRepository.findByIdWithDetails ENTRY', { id });
    const user = await this.findById(id);
    if (user === undefined) return undefined;
    const result = await this.hydrateUserDetails(user);
    console.log('[TRACE] UserRepository.findByIdWithDetails EXIT');
    return result;
  }

  private async hydrateUserDetails(user: User) {
    console.log('[TRACE] UserRepository.hydrateUserDetails ENTRY', { userId: user.id });
    let profile = null;
    
    try {
      console.log('[QUERY EXECUTED FROM] UserRepository.hydrateUserDetails (userProfiles)');
      // Safe SELECT query to prevent schema mismatch crashes
      const profileRows = await this.dbInstance
        .select({
          id: this.tables.userProfiles.id,
          userId: this.tables.userProfiles.userId,
          name: this.tables.userProfiles.name,
          educationLevel: this.tables.userProfiles.educationLevel,
          professionalStatus: this.tables.userProfiles.professionalStatus,
          ageGroup: this.tables.userProfiles.ageGroup,
          experienceYears: this.tables.userProfiles.experienceYears,
          domainInterest: this.tables.userProfiles.domainInterest,
          adaptiveLevel: this.tables.userProfiles.adaptiveLevel,
          primaryGoal: this.tables.userProfiles.primaryGoal,
          domain: this.tables.userProfiles.domain,
          subDomain: this.tables.userProfiles.subDomain,
          timeCommitment: this.tables.userProfiles.timeCommitment,
          journeyStatus: this.tables.userProfiles.journeyStatus,
          onboardingCompleted: this.tables.userProfiles.onboardingCompleted,
          createdAt: this.tables.userProfiles.createdAt,
          updatedAt: this.tables.userProfiles.updatedAt,
        })
        .from(this.tables.userProfiles)
        .where(eq(this.tables.userProfiles.userId, user.id))
        .limit(1);
      
      profile = profileRows[0] ?? null;
    } catch {
      console.warn('[USER_REPOSITORY] Profile fetch failed, continuing without profile');
      profile = null;
    }

    let roleRows: Array<{ roleId: string; roleName: string }> = [];
    
    try {
      console.log('[QUERY EXECUTED FROM] UserRepository.hydrateUserDetails (roles)');
      roleRows = await this.dbInstance
        .select({
          roleId: this.tables.roles.id,
          roleName: this.tables.roles.name,
        })
        .from(this.tables.userRoles)
        .innerJoin(this.tables.roles, eq(this.tables.userRoles.roleId, this.tables.roles.id))
        .where(eq(this.tables.userRoles.userId, user.id));
    } catch {
      console.warn('[USER_REPOSITORY] Role fetch failed, continuing without roles');
      roleRows = [];
    }

    console.log('[TRACE] UserRepository.hydrateUserDetails EXIT');
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

  async upsertOnboardingProfile(userId: string, onboarding: PersistedOnboardingInput) {
    console.log('[TRACE] UserRepository.upsertOnboardingProfile ENTRY', { userId });
    const values = {
      name: onboarding.fullName,
      educationLevel: onboarding.educationLevel,
      professionalStatus: onboarding.status,
      primaryGoal: onboarding.primaryGoal,
      domain: onboarding.domain,
      subDomain: onboarding.subDomain ?? '',
      adaptiveLevel: onboarding.skillLevel,
      timeCommitment: onboarding.timeCommitment,
      journeyStatus: onboarding.journeyStatus,
      onboardingCompleted:
        onboarding.journeyStatus === 'completed' || onboarding.journeyStatus === 'skipped',
      domainInterest: [onboarding.domain, onboarding.subDomain].filter(
        (value): value is string => typeof value === 'string' && value.trim().length > 0,
      ),
      updatedAt: new Date(),
    };

    let existing = null;
    
    try {
      console.log('[QUERY EXECUTED FROM] UserRepository.upsertOnboardingProfile (check existing)');
      // Safe SELECT query to check if profile exists
      const existingRows = await this.dbInstance
        .select({
          id: this.tables.userProfiles.id,
        })
        .from(this.tables.userProfiles)
        .where(eq(this.tables.userProfiles.userId, userId))
        .limit(1);
      
      existing = existingRows[0] ?? null;
    } catch {
      console.warn('[USER_REPOSITORY] Profile existence check failed, will attempt insert');
      existing = null;
    }

    if (existing !== null && existing !== undefined) {
      console.log('[QUERY EXECUTED FROM] UserRepository.upsertOnboardingProfile (update)');
      const [updated] = await this.dbInstance
        .update(this.tables.userProfiles)
        .set(values)
        .where(eq(this.tables.userProfiles.userId, userId))
        .returning();
      console.log('[TRACE] UserRepository.upsertOnboardingProfile EXIT (updated)');
      return updated;
    }

    console.log('[QUERY EXECUTED FROM] UserRepository.upsertOnboardingProfile (insert)');
    const [inserted] = await this.dbInstance
      .insert(this.tables.userProfiles)
      .values({
        userId,
        ...values,
      })
      .returning();
    console.log('[TRACE] UserRepository.upsertOnboardingProfile EXIT (inserted)');
    return inserted;
  }

  async assignRole(userId: string, roleName: string, tx?: Pick<typeof db, 'insert' | 'query'>) {
    const executor: any = tx ?? this.dbInstance;
    const rolesTable = this.tables.roles;
    
    let role;
    if (isQueryMode(executor)) {
      // Test/mock mode: use query API
      role = await executor.query.roles.findFirst({
        where: (r: any, { eq }: any) => eq(r.name, roleName),
      });
    } else if (isSelectMode(executor)) {
      // Production mode: use select API
      const roleResults = await executor
        .select({
          id: rolesTable.id,
          name: rolesTable.name,
        })
        .from(rolesTable)
        .where(eq(rolesTable.name, roleName))
        .limit(1);
      
      role = roleResults[0];
    } else {
      throw new Error('Invalid DB instance: neither query nor select mode available');
    }

    if ((role !== null && role !== undefined)) {
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
    const db = this.dbInstance;
    const tokensTable = this.tables.verificationTokens;
    
    if (isQueryMode(db)) {
      // Test/mock mode: use query API
      return await db.query.verificationTokens.findFirst({
        where: (t: any, { eq }: any) => eq(t.token, token),
      });
    }
    
    if (isSelectMode(db)) {
      // Production mode: use select API
      const results = await db
        .select({
          id: tokensTable.id,
          userId: tokensTable.userId,
          token: tokensTable.token,
          expiresAt: tokensTable.expiresAt,
          createdAt: tokensTable.createdAt,
        })
        .from(tokensTable)
        .where(eq(tokensTable.token, token))
        .limit(1);
      
      return results[0];
    }
    
    throw new Error('Invalid DB instance: neither query nor select mode available');
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
    const db = this.dbInstance;
    const resetTokensTable = this.tables.passwordResetTokens;
    
    if (isQueryMode(db)) {
      // Test/mock mode: use query API
      return await db.query.passwordResetTokens.findFirst({
        where: (t: any, { eq, and, gt }: any) => 
          and(
            eq(t.token, token),
            gt(t.expiresAt, new Date())
          ),
      }) as { id: string; userId: string; token: string; expiresAt: Date; createdAt: Date } | undefined;
    }
    
    if (isSelectMode(db)) {
      // Production mode: use select API
      const results = await db
        .select({
          id: resetTokensTable.id,
          userId: resetTokensTable.userId,
          token: resetTokensTable.token,
          expiresAt: resetTokensTable.expiresAt,
          createdAt: resetTokensTable.createdAt,
        })
        .from(resetTokensTable)
        .where(sql`${resetTokensTable.token} = ${token} and ${resetTokensTable.expiresAt} > ${new Date()}`)
        .limit(1);
      
      return results[0] as { id: string; userId: string; token: string; expiresAt: Date; createdAt: Date } | undefined;
    }
    
    throw new Error('Invalid DB instance: neither query nor select mode available');
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
    console.log('[TRACE] UserRepository.findById ENTRY', { id });
    console.log('[QUERY EXECUTED FROM] UserRepository.findById');
    
    const db = this.dbInstance;
    
    // ALWAYS use query API to avoid duplicate alias bug
    // The .select().from() pattern causes Drizzle to generate: from "users" "users"
    if (db?.query?.users?.findFirst) {
      console.log('[TRACE] Using db.query.users.findFirst');
      const result = await db.query.users.findFirst({
        where: (u: any, { eq }: any) => eq(u.id, id),
      }) as User | undefined;
      console.log('[TRACE] UserRepository.findById EXIT', { found: !!result });
      return result;
    }
    
    throw new Error('Invalid DB instance: db.query.users.findFirst not available');
  }

  /**
   * Save user onboarding preferences
   * @param userId - User ID
   * @param preferences - Onboarding data
   */
  async saveUserPreferences(
    userId: string,
    preferences: {
      primaryGoal?: string;
      domain?: string;
      subDomain?: string;
      timeCommitment?: string;
      journeyStatus?: string;
    }
  ): Promise<void> {
    console.log('[TRACE] entering saveUserPreferences', { userId });
    
    // Get user's actual name from database to satisfy NOT NULL constraint
    console.log('[TRACE] calling findById');
    const user = await this.findById(userId);
    if (user === undefined) {
      throw new Error(`User not found: ${userId}`);
    }
    console.log('[TRACE] findById completed', { userFound: true });

    let existingProfile = null;
    
    try {
      console.log('[TRACE] checking existing profile');
      // Safe SELECT query to check if profile already exists
      const profileRows = await this.dbInstance
        .select({
          id: this.tables.userProfiles.id,
          name: this.tables.userProfiles.name,
        })
        .from(this.tables.userProfiles)
        .where(eq(this.tables.userProfiles.userId, userId))
        .limit(1);
      
      existingProfile = profileRows[0] ?? null;
      console.log('[TRACE] profile check completed', { profileExists: existingProfile !== null });
    } catch (error) {
      console.warn('[USER_REPOSITORY] Profile check failed, will create new profile', error);
      existingProfile = null;
    }

    // Use existing name or fallback to email
    const userName = (existingProfile !== null && existingProfile.name !== undefined && existingProfile.name !== null && existingProfile.name !== '') 
      ? existingProfile.name 
      : user.email;

    // Use the existing upsertOnboardingProfile method which handles the complexity
    const onboardingData: PersistedOnboardingInput = {
      fullName: userName, // Use actual user name to satisfy NOT NULL constraint
      educationLevel: 'unknown',
      status: 'student',
      primaryGoal: (preferences.primaryGoal !== undefined && preferences.primaryGoal !== null && preferences.primaryGoal !== '') 
        ? preferences.primaryGoal 
        : 'learning',
      domain: (preferences.domain !== undefined && preferences.domain !== null && preferences.domain !== '') 
        ? preferences.domain 
        : 'general',
      subDomain: preferences.subDomain,
      skillLevel: 'beginner',
      timeCommitment: (preferences.timeCommitment !== undefined && preferences.timeCommitment !== null && preferences.timeCommitment !== '') 
        ? preferences.timeCommitment 
        : 'flexible',
      journeyStatus: 'completed',
    };

    console.log('[TRACE] calling upsertOnboardingProfile');
    await this.upsertOnboardingProfile(userId, onboardingData);
    console.log('[TRACE] saveUserPreferences completed');
  }

  /**
   * Mark user as onboarded
   * @param userId - User ID
   */
  async markUserOnboarded(userId: string): Promise<void> {
    console.log('[TRACE] UserRepository.markUserOnboarded ENTRY', { userId });
    console.log('[QUERY EXECUTED FROM] UserRepository.markUserOnboarded');
    await this.dbInstance.update(this.tables.users)
      .set({ isOnboarded: true })
      .where(eq(this.tables.users.id, userId));
    console.log('[TRACE] UserRepository.markUserOnboarded EXIT');
  }

  /**
   * Get user by ID (alias for findById for consistency)
   * @param userId - User ID
   */
  async getUserById(userId: string): Promise<User | undefined> {
    return this.findById(userId);
  }

}
