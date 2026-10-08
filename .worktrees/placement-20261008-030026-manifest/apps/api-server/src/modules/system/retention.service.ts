import { 
  auditLogs, 
  backgroundJobs,
  db, 
  exams, 
  idempotencyKeys,
  refreshTokens, 
  reportJobs,
  sessions} from '@quiz/db';
import { and, eq, lte, or } from 'drizzle-orm';

import { logger } from '@/lib/logger';

export class RetentionService {
  private static log = logger.child({ module: 'system:retention' });

  /**
   * Main entry point for data cleanup.
   * Purges expired or aged records across multiple tables.
   */
  static async performCleanup() {
    this.log.info('Starting data retention cleanup...');
    const start = Date.now();

    try {
      const results = await Promise.allSettled([
        this.purgeExpiredSessions(),
        this.purgeAgedAuditLogs(),
        this.purgeAbandonedExams(),
        this.purgeOldJobHistory(),
        this.purgeOldIdempotencyKeys()
      ]);

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        this.log.error({ count: failed.length }, 'Some cleanup tasks failed');
      }

      this.log.info({ durationMs: Date.now() - start }, 'Data retention cleanup completed');
      
      return {
        success: failed.length === 0,
        tasks: results.length,
        failed: failed.length
      };
    } catch (err) {
      this.log.error({ err }, 'Critical failure during cleanup orchestration');
      throw err;
    }
  }

  /**
   * Purge sessions and refresh tokens that have passed their expiration date.
   */
  private static async purgeExpiredSessions() {
    const now = new Date();
    
    // 1. Purge Sessions
    const deletedSessions = await db.delete(sessions)
      .where(lte(sessions.expiresAt, now))
      .returning({ id: sessions.id });
    
    // 2. Purge Refresh Tokens (Expired or Revoked)
    const deletedTokens = await db.delete(refreshTokens)
      .where(
        or(
          lte(refreshTokens.expiresAt, now),
          eq(refreshTokens.revoked, true)
        )
      )
      .returning({ id: refreshTokens.id });

    this.log.info({ 
      sessions: deletedSessions.length, 
      tokens: deletedTokens.length 
    }, 'Purged expired auth data');
  }

  /**
   * Purge audit logs older than the retention threshold (90 days).
   */
  private static async purgeAgedAuditLogs() {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 90);

    const deleted = await db.delete(auditLogs)
      .where(lte(auditLogs.createdAt, threshold))
      .returning({ id: auditLogs.id });

    this.log.info({ count: deleted.length }, 'Purged aged audit logs');
  }

  /**
   * Purge abandoned exams and stale 'started' sessions.
   * - Abandoned status: 30 days retention.
   * - Started status with no activity: 48 hours retention.
   */
  private static async purgeAbandonedExams() {
    const abandonedThreshold = new Date();
    abandonedThreshold.setDate(abandonedThreshold.getDate() - 30);

    const staleStartedThreshold = new Date();
    staleStartedThreshold.setHours(staleStartedThreshold.getHours() - 48);

    const deleted = await db.delete(exams)
      .where(
        or(
          and(eq(exams.status, 'abandoned'), lte(exams.completedAt, abandonedThreshold)),
          and(eq(exams.status, 'started'), lte(exams.startedAt, staleStartedThreshold))
        )
      )
      .returning({ id: exams.id });

    this.log.info({ count: deleted.length }, 'Purged stale or abandoned exams');
  }

  /**
   * Purge old background job and report job history (30 days).
   */
  private static async purgeOldJobHistory() {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 30);

    // 1. Background Jobs (Terminal states only)
    const deletedBgs = await db.delete(backgroundJobs)
      .where(
        and(
          or(eq(backgroundJobs.status, 'completed'), eq(backgroundJobs.status, 'failed')),
          lte(backgroundJobs.createdAt, threshold)
        )
      )
      .returning({ id: backgroundJobs.id });

    // 2. Report Jobs
    const deletedReports = await db.delete(reportJobs)
      .where(
        and(
          or(eq(reportJobs.status, 'completed'), eq(reportJobs.status, 'failed')),
          lte(reportJobs.createdAt, threshold)
        )
      )
      .returning({ id: reportJobs.id });

    this.log.info({ 
      backgroundJobs: deletedBgs.length, 
      reportJobs: deletedReports.length 
    }, 'Purged old job history');
  }

  /**
   * Purge old idempotency keys to prevent table bloat (7 days).
   */
  private static async purgeOldIdempotencyKeys() {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 7);

    const deleted = await db.delete(idempotencyKeys)
      .where(lte(idempotencyKeys.createdAt, threshold))
      .returning({ id: idempotencyKeys.id });

    this.log.info({ count: deleted.length }, 'Purged old idempotency keys');
  }
}
