import { db, roles, userProfiles, userRoles, users } from '@quiz/db';
import { and, desc, eq, gt, inArray, isNotNull, isNull, or, type SQL, sql } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { IAdminUserRepository } from '../interfaces/admin-user.repository.interface';

export class DrizzleAdminUserRepository extends BaseRepository<typeof users.$inferSelect, typeof users> implements IAdminUserRepository {
  protected table = users;

  constructor() {
    super(db);
  }

  async findAll(page: number, limit: number, status: 'active' | 'deleted', filters?: { 
    search?: string; 
    role?: string; 
    isBlocked?: boolean; 
    isVerified?: boolean; 
    status?: string 
  }) {
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];
    
    if (status === 'active') {
        conditions.push(isNull(users.deletedAt));
    } else {
        conditions.push(isNotNull(users.deletedAt));
    }

    if (filters?.search !== undefined && filters.search !== null && filters.search.trim() !== '') {
        await this.applyUserSearchFilter(filters.search, conditions);
    }

    if (filters?.role !== undefined && filters.role !== null && filters.role.trim() !== '') {
        const hasResults = await this.applyUserRoleFilter(filters.role, conditions);
        if (!hasResults) {
            return { users: [], total: 0, page, limit, totalPages: 0 };
        }
    }

    if (filters?.isBlocked !== undefined) {
        conditions.push(eq(users.isBlocked, filters.isBlocked));
    }

    if (filters?.isVerified !== undefined) {
        conditions.push(eq(users.emailVerified, filters.isVerified));
    }

    if (filters?.status !== undefined && filters.status !== null && filters.status.trim() !== '' && filters.isBlocked === undefined) {
        this.applyUserStatusFilter(filters.status, conditions);
    }

    const whereClause = and(...conditions);

    const [countResult] = await this.dbInstance.select({ count: sql`count(*)` })
        .from(users)
        .where(whereClause);
    
    const totalCount = Number(countResult?.count ?? 0);

    const usersList = await this.dbInstance.query.users.findMany({
      limit,
      offset,
      where: whereClause,
      orderBy: [desc(users.createdAt)],
      with: {
        profile: true,
        userRoles: {
            with: {
                role: true
            }
        }
      }
    });

    return {
      users: usersList,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    };
  }

  async update(id: string, data: Partial<typeof users.$inferInsert>) {
    const [updated] = await this.dbInstance.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.dbInstance.delete(users).where(eq(users.id, id)).returning();
    return deleted;
  }

  async toggleBlockStatus(userId: string, isBlocked: boolean) {
    return await this.dbInstance.update(users).set({ isBlocked }).where(eq(users.id, userId)).returning();
  }

  private async applyUserSearchFilter(search: string, conditions: SQL[]) {
    const searchPattern = `%${search.toLowerCase()}%`;
    const profileMatch = await this.dbInstance.select({ id: userProfiles.userId })
        .from(userProfiles)
        .where(sql`lower(${userProfiles.name}) ilike ${searchPattern}`);
    
    const profileIds = profileMatch.map(m => m.id);
    if (profileIds.length > 0) {
        conditions.push(or(sql`${users.email} ilike ${searchPattern}`, inArray(users.id, profileIds)) as SQL);
    } else {
        conditions.push(sql`${users.email} ilike ${searchPattern}`);
    }
  }

  private async applyUserRoleFilter(role: string, conditions: SQL[]) {
    const roleMatch = await this.dbInstance.select({ id: userRoles.userId })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(roles.name, role.toUpperCase()));
        
    const roleUserIds = roleMatch.map(m => m.id);
    if (roleUserIds.length > 0) {
        conditions.push(inArray(users.id, roleUserIds));
        return true;
    }
    return false;
  }

  private applyUserStatusFilter(status: string, conditions: SQL[]) {
    const now = new Date();
    const twoMinsAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const statusFilter: SQL | null =
      status === 'online'
        ? (gt(users.lastActiveAt, twoMinsAgo) as SQL)
        : status === 'idle'
          ? (and(gt(users.lastActiveAt, fiveMinsAgo), sql`${users.lastActiveAt} <= ${twoMinsAgo}`) as SQL)
          : status === 'offline'
            ? sql`(${users.lastActiveAt} is null or ${users.lastActiveAt} < ${fiveMinsAgo})`
            : null;

    if (statusFilter) {
      conditions.push(statusFilter);
    }
  }
}
