import { auditLogs, db } from '@quiz/db';

import { logger } from '@/lib/logger';
import type { RequestBrand } from '@/lib/request-brand';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  ip?: string;
  device?: string;
  brand?: RequestBrand;
  metadata?: Record<string, unknown> | string;
}

export class AuditService {
  private logInstance = logger.child({ module: 'auth:audit' });

  constructor(private dbInstance = db) {}

  async log(entry: AuditLogEntry) {
    try {
      const brandContext = entry.brand !== undefined && shouldUseBrandBinding()
        ? getAuthBrandContext(entry.brand)
        : null;
      const dbClient = brandContext?.db ?? this.dbInstance;
      const auditLogTable = brandContext?.tables.auditLogs ?? auditLogs;
      const metadata = entry.metadata === undefined || entry.metadata === null
        ? {}
        : typeof entry.metadata === 'string'
          ? JSON.parse(entry.metadata)
          : { ...entry.metadata };

      if (entry.brand !== undefined) {
        metadata.brand = entry.brand;
      }

      await dbClient.insert(auditLogTable).values({
        userId: entry.userId,
        action: entry.action,
        ip: entry.ip,
        device: entry.device,
        metadata: JSON.stringify(metadata),
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
