import { db, auditLogs } from '@quiz/db';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  ip?: string;
  device?: string;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  static async log(entry: AuditLogEntry) {
    try {
      await db.insert(auditLogs).values({
        userId: entry.userId,
        action: entry.action,
        ip: entry.ip,
        device: entry.device,
        metadata: entry.metadata !== undefined && entry.metadata !== null ? JSON.stringify(entry.metadata) : null,
      });
    } catch (_error) {
      // We don't want to crash the main flow if a log fails,
      // but in production, this should go to a monitoring system.
      console.error('Failed to write audit log:', _error);
    }
  }
}
