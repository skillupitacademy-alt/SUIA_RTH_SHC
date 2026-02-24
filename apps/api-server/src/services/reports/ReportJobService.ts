import { db, reportJobs } from "@quiz/db";
import { asc, eq } from "drizzle-orm";

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
     * Poll for the next available queued job
     */
    static async getNextJob(): Promise<typeof reportJobs.$inferSelect | null> {
        const job = await db.query.reportJobs.findFirst({
            where: eq(reportJobs.status, "queued"),
            orderBy: [asc(reportJobs.createdAt)]
        });

        if (!job) return null;

        // Atomically mark as processing
        await db.update(reportJobs)
            .set({ status: "processing", updatedAt: new Date() })
            .where(eq(reportJobs.id, job.id));

        return { ...job, status: "processing" };
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
     */
    static async resetStaleJobs(ageMinutes = 10): Promise<number> {
        const threshold = new Date(Date.now() - ageMinutes * 60 * 1000);
        
        const staleJobs = await db.query.reportJobs.findMany({
            where: (jobs, { and, eq, lt }) => and(
                eq(jobs.status, "processing"),
                lt(jobs.updatedAt, threshold)
            )
        });

        if (staleJobs.length === 0) return 0;

        this.log.warn({ count: staleJobs.length }, "Resetting stale processing jobs to queued");

        let count = 0;
        for (const job of staleJobs) {
            await db.update(reportJobs)
                .set({ status: "queued", updatedAt: new Date() })
                .where(eq(reportJobs.id, job.id));
            count++;
        }

        return count;
    }
}
