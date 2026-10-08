import {
    auditLogs,
    backgroundJobs,
    db,
    passwordResetTokens,
    refreshTokens,
    revokedTokens,
    sessions,
    verificationTokens,
} from '@quiz/db';
import { and, inArray, lt } from 'drizzle-orm';

export class CleanupService {
    /**
     * Executes the data retention cleanup policies across the database.
     * Designed to be run by a cron job or scheduled task trigger.
     */
    public static async runCleanupJob() {
        const now = new Date();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        try {
            console.log(`[CleanupService] Starting data retention cleanup job at ${now.toISOString()}...`);

            // 1. Expired Sessions & Tokens (Immediate expiration)
            const sessionRes = await db.delete(sessions).where(lt(sessions.expiresAt, now)).returning({ id: sessions.id });
            const refreshRes = await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, now)).returning({ id: refreshTokens.id });
            const revokedRes = await db.delete(revokedTokens).where(lt(revokedTokens.expiresAt, now)).returning({ id: revokedTokens.id });
            const verifyRes = await db.delete(verificationTokens).where(lt(verificationTokens.expiresAt, now)).returning({ id: verificationTokens.id });
            const pwdResetRes = await db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, now)).returning({ id: passwordResetTokens.id });

            // 2. Old Audit Logs (Retain for 30 days)
            const auditRes = await db.delete(auditLogs).where(lt(auditLogs.createdAt, thirtyDaysAgo)).returning({ id: auditLogs.id });

            // 3. Old Background Jobs (Retain completed/failed for 7 days)
            const jobsRes = await db.delete(backgroundJobs).where(
                and(
                    lt(backgroundJobs.createdAt, sevenDaysAgo),
                    inArray(backgroundJobs.status, ['completed', 'failed'])
                )
            ).returning({ id: backgroundJobs.id });

            console.log('[CleanupService] Data retention cleanup completed successfully. Summary:');
            console.log(`- Sessions Deleted: ${sessionRes.length}`);
            console.log(`- Refresh Tokens Deleted: ${refreshRes.length}`);
            console.log(`- Revoked Tokens Deleted: ${revokedRes.length}`);
            console.log(`- Verification Tokens Deleted: ${verifyRes.length}`);
            console.log(`- Password Reset Tokens Deleted: ${pwdResetRes.length}`);
            console.log(`- Audit Logs Deleted (Older than 30d): ${auditRes.length}`);
            console.log(`- Background Jobs Deleted (Older than 7d): ${jobsRes.length}`);
            
            return { success: true };
        } catch (error) {
            console.error('[CleanupService] Error during retention cleanup:', error);
            throw error;
        }
    }
}
