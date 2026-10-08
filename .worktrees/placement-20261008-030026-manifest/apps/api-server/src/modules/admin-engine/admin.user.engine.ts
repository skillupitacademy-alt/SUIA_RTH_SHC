import { db } from "@quiz/db";

import { TOKENS } from "@/lib/app.container";
import { AuditService } from "@/modules/auth/audit.service";
import { PasswordService } from "@/modules/auth/password.service";
import { container } from "@/modules/core/container";
import { IAdminUserRepository } from "@/repositories/interfaces/admin-user.repository.interface";

export interface UpdateUserInput {
  roles?: string[];
  password?: string;
  isBlocked?: boolean;
}

type UpdateUserRepoInput = {
  isBlocked?: boolean;
  passwordHash?: string;
  updatedAt?: Date;
};

export class AdminUserEngine {
  constructor(
    private readonly repository: IAdminUserRepository = container.get(TOKENS.AdminUserRepo),
    private readonly auditService = container.get(AuditService),
    private readonly passwordService = container.get(PasswordService)
  ) {}

  withDb(dbClient: typeof db): AdminUserEngine {
    return new AdminUserEngine(this.repository.withDb(dbClient), this.auditService, this.passwordService);
  }

  async getUsers(cursor: string | null = null, limit: number = 20, status: 'active' | 'deleted' = 'active', filters?: { search?: string; role?: string; isBlocked?: boolean; isVerified?: boolean; status?: string; fields?: string }) {
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

  async createUser(data: { email: string; passwordHash?: string; password?: string; name: string; roles: string[] }, adminId: string) {
    const password = data.password ?? 'Welcome@123'; // Default password if not provided
    const passwordHash = await this.passwordService.hash(password);
    
    const newUser = await this.repository.create({
        email: data.email,
        passwordHash,
        name: data.name,
        roleNames: data.roles
    });

    await this.auditService.log({ 
        userId: adminId, 
        action: 'admin_create_user', 
        metadata: { targetUserId: newUser.id, email: data.email } 
    });

    return newUser;
  }

  async updateUser(id: string, data: UpdateUserInput, adminId: string) {
    const updateData: UpdateUserRepoInput = {
        isBlocked: data.isBlocked,
        updatedAt: new Date()
    };

    if (data.password !== undefined && data.password !== null && data.password !== '') {
        updateData.passwordHash = await this.passwordService.hash(data.password);
    }

    const updated = await this.repository.update(id, updateData);
    await this.auditService.log({ userId: adminId, action: 'admin_update_user', metadata: { targetUserId: id, fields: Object.keys(data) } });
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
