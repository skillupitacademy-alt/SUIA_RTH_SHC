import { auditLogs, db } from '@quiz/db';

import { logger } from '@/lib/logger';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  ip?: string;
  device?: string;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  private logInstance = logger.child({ module: 'auth:audit' });

  constructor(private dbInstance = db) {}

  async log(entry: AuditLogEntry) {
    try {
      await this.dbInstance.insert(auditLogs).values({
        userId: entry.userId,
        action: entry.action,
        ip: entry.ip,
        device: entry.device,
        metadata: entry.metadata !== undefined && entry.metadata !== null ? JSON.stringify(entry.metadata) : null,
      });
    } catch (_error: unknown) {
      // Do not block primary flows if audit logging fails.
      this.logInstance.error(
        {
          error: _error instanceof Error ? _error.message : 'unknown error',
        },
        'Failed to write audit log',
      );
    }
  }
}
