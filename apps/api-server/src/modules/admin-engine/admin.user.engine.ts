import { db, users, userProfiles, userRoles, roles } from '@quiz/db';
import { eq, and, sql, desc, or, inArray, isNull, isNotNull, gt, type SQL } from 'drizzle-orm';

export interface UpdateUserInput {
  roles?: string[];
  password?: string;
  isBlocked?: boolean;
}

export class AdminUserEngine {
  static async getUsers(page: number = 1, limit: number = 20, status: 'active' | 'deleted' = 'active', filters?: { search?: string; role?: string; isBlocked?: boolean; isVerified?: boolean; status?: string }) {
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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db.select({ count: sql`count(*)` })
        .from(users)
        .where(whereClause);
    
    const totalCount = Number(countResult?.count ?? 0);

    const usersList = await db.query.users.findMany({
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

    const now = new Date();
    const processedUsers = usersList.map(u => {
        let uStatus = 'offline';
        if (u.lastActiveAt !== null && u.lastActiveAt !== undefined) {
            const diffMinutes = (now.getTime() - new Date(u.lastActiveAt).getTime()) / (1000 * 60);
            if (diffMinutes < 2) uStatus = 'online';
            else if (diffMinutes < 5) uStatus = 'idle';
        }
        if (u.isBlocked) uStatus = 'blocked';
        return { ...u, status: uStatus };
    });

    return {
      users: processedUsers,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    };
  }

  static async updateUser(id: string, data: UpdateUserInput) {
    const updateData: Partial<typeof users.$inferInsert> = {
        isBlocked: data.isBlocked
    };
    const [updated] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return updated;
  }

  static async deleteUser(id: string) {
    return await db.delete(users).where(eq(users.id, id)).returning();
  }

  static async toggleBlockStatus(userId: string, isBlocked: boolean) {
    return await db.update(users).set({ isBlocked }).where(eq(users.id, userId)).returning();
  }

  private static async applyUserSearchFilter(search: string, conditions: SQL[]) {
    const searchPattern = `%${search.toLowerCase()}%`;
    const profileMatch = await db.select({ id: userProfiles.userId })
        .from(userProfiles)
        .where(sql`lower(${userProfiles.name}) ilike ${searchPattern}`);
    
    const profileIds = profileMatch.map(m => m.id);
    if (profileIds.length > 0) {
        conditions.push(or(sql`${users.email} ilike ${searchPattern}`, inArray(users.id, profileIds)) as SQL);
    } else {
        conditions.push(sql`${users.email} ilike ${searchPattern}`);
    }
  }

  private static async applyUserRoleFilter(role: string, conditions: SQL[]) {
    const roleMatch = await db.select({ id: userRoles.userId })
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

  private static applyUserStatusFilter(status: string, conditions: SQL[]) {
    const now = new Date();
    const twoMinsAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

    if (status === 'online') {
        conditions.push(gt(users.lastActiveAt, twoMinsAgo) as SQL);
    } else if (status === 'idle') {
        const five = gt(users.lastActiveAt, fiveMinsAgo);
        const two = sql`${users.lastActiveAt} <= ${twoMinsAgo}`;
        const combined = and(five, two);
        if (combined) conditions.push(combined);
    } else if (status === 'offline') {
        conditions.push(sql`(${users.lastActiveAt} is null or ${users.lastActiveAt} < ${fiveMinsAgo})`);
    }
  }
}
