type AdminUserRecord = {
  id: string;
  email: string;
  isBlocked: boolean;
  emailVerified: boolean;
  lastActiveAt: Date | null;
  [key: string]: unknown;
};

export interface IAdminUserRepository {
  findAll(page: number, limit: number, status: 'active' | 'deleted', filters?: { 
    search?: string; 
    role?: string; 
    isBlocked?: boolean; 
    isVerified?: boolean; 
    status?: string 
  }): Promise<{
    users: AdminUserRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findById(id: string): Promise<AdminUserRecord | undefined>;
  update(id: string, data: Record<string, unknown>): Promise<AdminUserRecord>;
  delete(id: string): Promise<AdminUserRecord>;
  toggleBlockStatus(userId: string, isBlocked: boolean): Promise<AdminUserRecord[]>;
}
