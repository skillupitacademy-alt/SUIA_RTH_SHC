import { FetchClient } from '@quiz/api-client/core/fetch-client';
import {
  AdminSuccessResponse,
  PaginatedResponse,
  AdminQueueStats,
  AdminAuditLog,
  AdminLiveSession,
} from '@quiz/api-client/types';

export class SystemAdminClient {
  constructor(private client: FetchClient) {}

  // --- JOBS & QUEUES ---
  async getQueueStats() {
    return this.client.get<AdminQueueStats>('/admin/queues');
  }

  async createJob(type: string, payload: Record<string, unknown>) {
    return this.client.post<{ jobId: string }>('/admin/jobs', { type, payload });
  }

  async getJobById(id: string) {
    return this.client.get<any>(`/admin/jobs/${id}`);
  }

  async performJobAction(queueName: string, jobId: string, action: 'retry' | 'discard' | 'promote') {
    return this.client.post<AdminSuccessResponse>('/admin/queues', {
      queueName,
      jobId,
      action,
    });
  }

  // --- SESSIONS ---
  async getLiveSessions(page: number = 1, limit: number = 20, search?: string, fields?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search != null && search !== '') query.append('search', search);
    if (fields != null && fields !== '') query.append('fields', fields);
    return this.client.get<PaginatedResponse<AdminLiveSession> | Record<string, unknown>>(`/admin/sessions/live?${query.toString()}`);
  }

  async getSystemUsage() {
    return this.client.get<Record<string, unknown>>('/admin/system/usage');
  }

  // --- AUDIT ---
  async getAuditLogs(cursor?: string | null, limit: number = 20, filters?: { [key: string]: string | number | boolean | undefined | null; fields?: string }) {
    const query = new URLSearchParams({ limit: limit.toString() });
    if (cursor) query.append('cursor', cursor);
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v != null) query.append(k, String(v));
      });
    }
    return this.client.get<PaginatedResponse<AdminAuditLog>>(`/admin/logs?${query.toString()}`);
  }
}
