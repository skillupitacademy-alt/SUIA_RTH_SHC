import { TOKENS } from "@/lib/app.container";
import { AuditService } from "@/modules/auth/audit.service";
import { container } from "@/modules/core/container";
import { IAdminUserRepository } from "@/repositories/interfaces/admin-user.repository.interface";

export interface UpdateUserInput {
  roles?: string[];
  password?: string;
  isBlocked?: boolean;
}

type UpdateUserRepoInput = {
  isBlocked?: boolean;
};

export class AdminUserEngine {
  constructor(
    private readonly repository: IAdminUserRepository = container.get(TOKENS.AdminUserRepo),
    private readonly auditService = container.get(AuditService)
  ) {}

  async getUsers(cursor: string | null = null, limit: number = 20, status: 'active' | 'deleted' = 'active', filters?: { search?: string; role?: string; isBlocked?: boolean; isVerified?: boolean; status?: string }) {
    const result = await this.repository.findAll(cursor, limit, status, filters);

    const now = new Date();
    const processedUsers = result.users.map(u => {
        let uStatus = 'offline';
        if (u.lastActiveAt !== null && u.lastActiveAt !== undefined) {
            const diffMinutes = (now.getTime() - new Date(u.lastActiveAt).getTime()) / (1000 * 60);
            if (diffMinutes < 2) uStatus = 'online';
            else if (diffMinutes < 5) uStatus = 'idle';
        }
        if (u.isBlocked === true) uStatus = 'blocked';
        return { ...u, status: uStatus };
    });

    return {
      users: processedUsers,
      total: result.total,
      nextCursor: result.nextCursor,
      limit: result.limit
    };
  }

  async updateUser(id: string, data: UpdateUserInput, adminId: string) {
    const updateData: UpdateUserRepoInput = {
        isBlocked: data.isBlocked
    };
    const updated = await this.repository.update(id, updateData);
    await this.auditService.log({ userId: adminId, action: 'admin_update_user', metadata: { targetUserId: id } });
    return updated;
  }

  async deleteUser(id: string, adminId: string) {
    await this.auditService.log({ userId: adminId, action: 'admin_delete_user', metadata: { targetUserId: id } });
    
    // T97: Performance soft delete by default. 
    // This prevents accidental mass CASCADE DELETE of exams/reports/etc.
    return await this.repository.softDelete(id);
  }

  async toggleBlockStatus(userId: string, isBlocked: boolean, adminId: string) {
    await this.auditService.log({ userId: adminId, action: 'admin_toggle_block', metadata: { targetUserId: userId, isBlocked } });
    return await this.repository.toggleBlockStatus(userId, isBlocked);
  }
}
