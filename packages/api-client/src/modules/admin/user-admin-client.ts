import { FetchClient } from '@quiz/api-client/core/fetch-client';
import {
  AdminSuccessResponse,
  AdminUserProfile,
  IAdminUserClient,
} from '@quiz/api-client/types';

type UserUpdatePayload = Partial<AdminUserProfile> & Record<string, unknown>;

export class UserAdminClient implements IAdminUserClient {
  constructor(private client: FetchClient) {}

  async getUsers(
    cursor?: string | null,
    limit: number = 20,
    status: 'active' | 'deleted' = 'active',
    filters?: {
      search?: string;
      role?: string;
      isBlocked?: boolean;
      isVerified?: boolean;
      status?: string;
    }
  ) {
    const query = new URLSearchParams({
      limit: limit.toString(),
      status,
    });
    if (cursor != null && cursor !== '') query.append('cursor', cursor);
    if (filters?.search != null && filters.search !== '')
      query.append('search', filters.search);
    if (filters?.role != null && filters.role !== '')
      query.append('role', filters.role);
    if (filters?.isBlocked !== undefined)
      query.append('isBlocked', filters.isBlocked ? 'true' : 'false');
    if (filters?.isVerified !== undefined)
      query.append('isVerified', filters.isVerified ? 'true' : 'false');
    if (filters?.status != null && filters.status !== '')
      query.append('xStatus', filters.status);

    return this.client.get<{
      data: AdminUserProfile[];
      total: number;
      nextCursor: string | null;
      limit: number;
    }>(`/admin/users?${query.toString()}`);
  }

  async updateUser(id: string, data: UserUpdatePayload) {
    return this.client.patch<AdminUserProfile, UserUpdatePayload>(
      `/admin/users/${id}`,
      data
    );
  }

  async deleteUser(id: string) {
    return this.client.delete<AdminSuccessResponse>(`/admin/users/${id}`);
  }

  async login(email: string, password: string) {
    return this.client.post<{
      user: AdminUserProfile;
      accessToken: string;
      expiresAt: string | null;
    }>('/admin/auth/login', { email, password });
  }
}

