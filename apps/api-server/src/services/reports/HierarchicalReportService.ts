import { db, exams } from "@quiz/db";
import { ReportJSON } from "@quiz/types/report";
import { eq } from "drizzle-orm";
import { PDFDocument } from "pdf-lib";

import { logger } from "@/lib/logger";
import { uploadReport } from "@/lib/storage/upload-report";

import { ReportPdfService } from "../../modules/report-engine/report-pdf.service";
import { ReportRepository } from "../../modules/report-engine/report-repository";
import { ReportJobService } from "./ReportJobService";

export class HierarchicalReportService {
    private static log = logger.child({ module: 'hierarchical-report-service' });

    /**
     * Process a pending report job
     */
    static async processJob(jobId: string): Promise<void> {
        this.log.info({ jobId }, "Processing hierarchical report job");

        const job: Awaited<ReturnType<typeof ReportJobService.getJobStatus>> = await ReportJobService.getJobStatus(jobId);
        if (job === null) throw new Error("Job not found");

        try {
            await ReportJobService.updateProgress(jobId, 5, "processing");

            // 1. Fetch Materialized Report
            const exam = await db.query.exams.findFirst({
                where: eq(exams.id, job.examId),
                columns: { reportMaterialized: true, userId: true }
            });

            if (exam?.reportMaterialized === null || exam?.reportMaterialized === undefined) {
                throw new Error("Materialized report not found");
            }
            const report = exam.reportMaterialized as ReportJSON;

            // 2. DFS Traversal to collect nodes
            const nodes = this.collectNodes(report);
            this.log.info({ jobId, nodeCount: nodes.length }, "Collected hierarchy nodes for rendering");

            // 3. Render Segments
            const buffers: Buffer[] = [];
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const progress = Math.round(10 + (i / nodes.length) * 70);
                
                await ReportJobService.updateProgress(jobId, progress, "processing");
                this.log.debug({ jobId, nodeId: node.id, nodeType: node.type }, "Rendering segment");

                const buffer = await ReportPdfService.renderSegment(job.examId, node.id, node.type);
                buffers.push(buffer);
            }

            // 4. Merge PDFs
            await ReportJobService.updateProgress(jobId, 85, "processing");
            this.log.info({ jobId }, "Merging PDF segments");
            const mergedBuffer = await this.mergePdfs(buffers);

            // 5. Upload & Finalize
            await ReportJobService.updateProgress(jobId, 95, "processing");
            this.log.info({ jobId }, "Uploading final merged report");
            const pdfUrl = await uploadReport(mergedBuffer, exam.userId, job.examId);

            // Update Report Success (for legacy compatibility and readiness state)
            await ReportRepository.updateReportSuccess(job.examId, {
                fileRef: pdfUrl,
                generationTimeMs: Date.now() - job.createdAt.getTime(),
                fileSizeKb: Math.round(mergedBuffer.length / 1024),
                pageCount: nodes.length * 6 // Rough estimate (each node is ~6 pages)
            });

            await ReportJobService.updateProgress(jobId, 100, "completed");
            await db.update(exams).set({ 
                // Any additional metadata updates could go here
            }).where(eq(exams.id, job.examId));

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            this.log.error({ jobId, error: message }, "Job processing failed");
            await ReportJobService.failJob(jobId, message);
            throw error;
        }
    }

    /**
     * Collects all renderable nodes from the hierarchy in DFS order
     */
    private static collectNodes(report: ReportJSON): Array<{ id: string; type: "domain" | "subject" | "topic" }> {
        const nodes: Array<{ id: string; type: "domain" | "subject" | "topic" }> = [];
        
        // Root Domain
        nodes.push({ id: report.hierarchy.id, type: "domain" });

        // Subjects
        for (const subject of report.hierarchy.subjects) {
            nodes.push({ id: subject.id, type: "subject" });

            // Topics
            for (const topic of subject.topics) {
                nodes.push({ id: topic.id, type: "topic" });
            }
        }

        return nodes;
    }

    /**
     * Merge multiple PDF buffers into a single buffer
     */
    private static async mergePdfs(buffers: Buffer[]): Promise<Buffer> {
        const mergedDoc = await PDFDocument.create();

        for (const buffer of buffers) {
            const doc = await PDFDocument.load(buffer);
            const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
            copiedPages.forEach((page) => mergedDoc.addPage(page));
        }

        const uint8Array = await mergedDoc.save();
        return Buffer.from(uint8Array);
    }
}
