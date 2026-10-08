import { db } from '@quiz/db';

type AdminUserRecord = {
  id: string;
  email: string;
  isBlocked: boolean;
  emailVerified: boolean;
  lastActiveAt: Date | null;
  [key: string]: unknown;
};

export interface IAdminUserRepository {
  /**
   * Returns a new instance of the repository using the specified database client.
   */
  withDb(dbClient: typeof db): this;
  findAll(cursor: string | null, limit: number, status: 'active' | 'deleted', filters?: { 
    search?: string; 
    role?: string; 
    isBlocked?: boolean;
    isVerified?: boolean; 
    status?: string;
    fields?: string;
  }): Promise<{
    users: AdminUserRecord[];
    total: number;
    nextCursor: string | null;
    limit: number;
  }>;
  findById(id: string): Promise<AdminUserRecord | undefined>;
  create(data: { email: string; passwordHash: string; name: string; roleNames: string[] }): Promise<AdminUserRecord>;
  update(id: string, data: Record<string, unknown>): Promise<AdminUserRecord>;
  softDelete(id: string): Promise<AdminUserRecord>;
  delete(id: string): Promise<AdminUserRecord>;
  toggleBlockStatus(userId: string, isBlocked: boolean): Promise<AdminUserRecord[]>;
}
