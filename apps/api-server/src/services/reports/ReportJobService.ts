import { db, reportJobs } from "@quiz/db";
import { eq, sql } from "drizzle-orm";

import { logger } from "@/lib/logger";

export type ReportJobStatus = "queued" | "processing" | "completed" | "failed";
export type ReportJob = typeof reportJobs.$inferSelect;

export class ReportJobService {
    private static log = logger.child({ module: 'report-job-service' });

    /**
     * Create a new report generation job
     */
    static async createJob(examId: string, userId: string): Promise<string> {
        this.log.info({ examId, userId }, "Creating report job");
        
        const [job] = await db.insert(reportJobs).values({
            examId,
            userId,
            status: "queued",
            progress: 0,
        }).returning({ id: reportJobs.id });

        return job.id;
    }

    /**
     * Update job progress and status
     */
    static async updateProgress(jobId: string, progress: number, status?: ReportJobStatus, errorMessage?: string): Promise<void> {
        this.log.debug({ jobId, progress, status }, "Updating job progress");

        const updateData: Partial<typeof reportJobs.$inferSelect> = {
            progress,
            updatedAt: new Date(),
        };

        if (status) updateData.status = status;
        if (errorMessage !== undefined && errorMessage !== null && errorMessage !== "") {
            updateData.errorMessage = errorMessage;
        }

        await db.update(reportJobs)
            .set(updateData)
            .where(eq(reportJobs.id, jobId));
    }

    /**
     * Poll for the next available queued job using SKIP LOCKED for atomic safety
     */
    static async getNextJob(): Promise<typeof reportJobs.$inferSelect | null> {
        const result = await db.execute(sql`
            UPDATE report_jobs
            SET status = 'processing', updated_at = NOW()
            WHERE id = (
                SELECT id
                FROM report_jobs
                WHERE status = 'queued'
                ORDER BY created_at ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            )
            RETURNING *;
        `);

        if (result.rows.length === 0) return null;
        
        // Drizzle execute returns raw rows, we cast to the inferred type
        return result.rows[0] as unknown as typeof reportJobs.$inferSelect;
    }

    /**
     * Mark job as failed with an error message
     */
    static async failJob(jobId: string, error: string): Promise<void> {
        this.log.error({ jobId, error }, "Job failed");
        
        await db.update(reportJobs)
            .set({
                status: "failed",
                errorMessage: error,
                updatedAt: new Date()
            })
            .where(eq(reportJobs.id, jobId));
    }

    /**
     * Get job status
     */
    static async getJobStatus(jobId: string): Promise<ReportJob | null> {
        const result = await db.query.reportJobs.findFirst({
            where: eq(reportJobs.id, jobId)
        });
        return result ?? null;
    }
    /**
     * Recovery: Reset jobs stuck in 'processing' for too long
     * Uses atomic SQL to prevent race conditions and handle retry limits
     */
    static async resetStaleJobs(ageMinutes = 30): Promise<number> {
        this.log.debug({ ageMinutes }, "Checking for stale jobs");

        // 1. Mark jobs that exceeded retries as failed
        const failResult = await db.execute(sql`
            UPDATE report_jobs
            SET 
                status = 'failed', 
                error_message = 'Job timed out and exceeded maximum retries',
                updated_at = NOW()
            WHERE status = 'processing'
              AND updated_at < NOW() - INTERVAL '${ageMinutes} minutes'
              AND retry_count >= max_retries
            RETURNING id;
        `);

        if (failResult.rows.length > 0) {
            this.log.error({ count: failResult.rows.length }, "Marked stale jobs as failed (max retries reached)");
        }

        // 2. Reset jobs within retry limits back to queued
        const resetResult = await db.execute(sql`
            UPDATE report_jobs
            SET 
                status = 'queued', 
                retry_count = retry_count + 1,
                updated_at = NOW()
            WHERE status = 'processing'
              AND updated_at < NOW() - INTERVAL '${ageMinutes} minutes'
              AND retry_count < max_retries
            RETURNING id;
        `);

        if (resetResult.rows.length > 0) {
            this.log.warn({ count: resetResult.rows.length }, "Reset stale processing jobs to queued for retry");
        }

        return failResult.rows.length + resetResult.rows.length;
    }
}
