import { db, exams } from "@quiz/db";
import { ReportJSON } from "@quiz/types/report";
import { eq } from "drizzle-orm";
import { PDFDocument } from "pdf-lib";

import { logger } from "@/lib/logger";
import { uploadReport } from "@/lib/storage/upload-report";

import { REPORT_ENGINE_CONFIG } from "../../modules/report-engine/report-engine.config";
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
                columns: { reportMaterialized: true, userId: true, exportUrls: true }
            });

            if (exam?.reportMaterialized === null || exam?.reportMaterialized === undefined) {
                throw new Error("Materialized report not found");
            }
            const report = exam.reportMaterialized as ReportJSON;

            // 2. DFS Traversal to collect nodes
            const nodes = this.collectNodes(report);
            
            // --- Phase 5 Guardrails & Pagination Alignment ---
            const appendixPages = Math.ceil((report.appendix?.questionBank?.length ?? 0) / 5);
            const contentPages = nodes.reduce((acc, node) => {
                if (node.type === 'domain') return acc + REPORT_ENGINE_CONFIG.PAGES_PER_DOMAIN_OVERVIEW;
                if (node.type === 'subject') return acc + REPORT_ENGINE_CONFIG.PAGES_PER_SUBJECT_SUMMARY;
                return acc + REPORT_ENGINE_CONFIG.PAGES_PER_TOPIC;
            }, 0);

            const totalPageEstimate = contentPages + appendixPages;

            this.log.info({ jobId, nodeCount: nodes.length, contentPages, appendixPages, totalPageEstimate }, "Hierarchy validated");

            if (totalPageEstimate > REPORT_ENGINE_CONFIG.MAX_TOTAL_PAGES_ESTIMATE) {
                throw new Error(`Report exceeds safety limit: ${totalPageEstimate} estimated pages (Limit: ${REPORT_ENGINE_CONFIG.MAX_TOTAL_PAGES_ESTIMATE})`);
            }
            
            if (nodes.length > REPORT_ENGINE_CONFIG.MAX_HIERARCHY_NODES) {
                throw new Error(`Report exceeds node limit: ${nodes.length} nodes (Limit: ${REPORT_ENGINE_CONFIG.MAX_HIERARCHY_NODES})`);
            }

            // 3. Render Segments
            const buffers: Buffer[] = [];
            let currentPageOffset = 0;

            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const progress = Math.round(10 + (i / nodes.length) * 70);
                
                await ReportJobService.updateProgress(jobId, progress, "processing");
                this.log.info({ jobId, offset: currentPageOffset, type: node.type }, "Rendering segment");

                const segment = await ReportPdfService.renderSegment(
                    job.examId, 
                    node.id, 
                    node.type, 
                    currentPageOffset, 
                    totalPageEstimate
                );
                buffers.push(segment.buffer);

                // Increment offset for next node
                if (node.type === 'domain') currentPageOffset += REPORT_ENGINE_CONFIG.PAGES_PER_DOMAIN_OVERVIEW;
                else if (node.type === 'subject') currentPageOffset += REPORT_ENGINE_CONFIG.PAGES_PER_SUBJECT_SUMMARY;
                else currentPageOffset += REPORT_ENGINE_CONFIG.PAGES_PER_TOPIC;
            }

            // 4. Merge PDFs
            await ReportJobService.updateProgress(jobId, 85, "processing");
            this.log.info({ jobId }, "Merging PDF segments");
            const mergedBuffer = await this.mergePdfs(buffers);

            // 5. Upload & Finalize
            await ReportJobService.updateProgress(jobId, 95, "processing");
            this.log.info({ jobId }, "Uploading final merged report");
            const pdfUrl = await uploadReport(mergedBuffer, exam.userId, job.examId);

            const nextExportUrls = {
                ...(exam.exportUrls ?? {}),
                analytics_pdf: pdfUrl
            };

            // Update Report Success
            await ReportRepository.updateReportSuccess(job.examId, {
                fileRef: pdfUrl,
                generationTimeMs: Date.now() - job.createdAt.getTime(),
                fileSizeKb: Math.round(mergedBuffer.length / 1024),
                pageCount: totalPageEstimate
            });

            await db.update(exams).set({
                exportUrls: nextExportUrls
            }).where(eq(exams.id, job.examId));
            this.log.info({ jobId, examId: job.examId, pdfUrl }, "Stored analytics_pdf in exams.export_urls");

            await ReportJobService.updateProgress(jobId, 100, "completed");
            
            // Cleanup and Final State Check
            await db.update(exams).set({ 
                status: 'completed'
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
