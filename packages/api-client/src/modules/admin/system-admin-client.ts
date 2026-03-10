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
  async getLiveSessions() {
    return this.client.get<AdminLiveSession[]>('/admin/sessions/live');
  }

  async getSystemUsage() {
    return this.client.get<Record<string, unknown>>('/admin/system/usage');
  }

  // --- AUDIT ---
  async getAuditLogs(cursor?: string | null, limit: number = 20, filters?: any) {
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
