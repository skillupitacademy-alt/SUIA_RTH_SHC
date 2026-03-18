import { logger } from "@/lib/logger";

import { HierarchicalReportService } from "./HierarchicalReportService";
import { ReportJobService } from "./ReportJobService";

export class ReportWorker {
    private static log = logger.child({ module: 'report-worker' });
    private static isRunning = false;
    private static pollInterval = 10000; // 10 seconds

    /**
     * Start the background worker loop (for persistent environments)
     */
    static start() {
        if (this.isRunning) {
            this.log.warn("Report worker is already running");
            return;
        }

        if (process.env.DISABLE_BACKGROUND_WORKERS === 'true' || process.env.CLOUD_RUN_BUILD === 'true') {
            this.log.info("Background report worker disabled via environment");
            return;
        }

        this.isRunning = true;
        this.log.info("Background report worker started");
        
        // Non-blocking loop
        void this.loop();
    }

    /**
     * Run a processing window (for cron/lambda environments)
     */
    static async work(maxDurationMs = 50000): Promise<number> {
        const start = Date.now();
        let processedCount = 0;

        this.log.info({ maxDurationMs }, "Starting report worker active window");

        // 1. Stale Job Recovery
        await ReportJobService.resetStaleJobs();

        while (Date.now() - start < maxDurationMs) {
            const job = await ReportJobService.getNextJob();
            if (!job) break;

            this.log.info({ jobId: job.id, examId: job.examId }, "Processing hierarchical job in active window");
            
            try {
                await HierarchicalReportService.processJob(job.id);
                processedCount++;
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Unknown error";
                this.log.error({ jobId: job.id, error: message }, "Error processing hierarchical job");
                await ReportJobService.failJob(job.id, message);
            }

            // Small delay between jobs if we have time
            if (Date.now() - start < maxDurationMs - 1000) {
                await this.sleep(500);
            }
        }

        this.log.info({ processedCount }, "Report worker active window completed");
        return processedCount;
    }

    /**
     * Stop the worker loop safely
     */
    static stop() {
        this.log.info("Stopping report worker...");
        this.isRunning = false;
    }

    /**
     * Main polling loop
     */
    private static async loop() {
        while (this.isRunning) {
            try {
                await this.work(30000); // Work in 30s chunks
                await this.sleep(this.pollInterval);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Unknown error";
                this.log.error({ error: message }, "Exception in report worker loop");
                await this.sleep(this.pollInterval);
            }
        }
    }

    private static sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
