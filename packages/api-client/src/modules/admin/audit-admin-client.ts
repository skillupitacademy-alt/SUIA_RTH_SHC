import { FetchClient } from '@quiz/api-client/core/fetch-client';
import { AdminAuditLog, IAdminAuditClient } from '@quiz/api-client/types';

export class AuditAdminClient implements IAdminAuditClient {
  constructor(private client: FetchClient) {}

  async getAuditLogs() {
    return this.client.get<AdminAuditLog[]>('/admin/logs');
  }
}
