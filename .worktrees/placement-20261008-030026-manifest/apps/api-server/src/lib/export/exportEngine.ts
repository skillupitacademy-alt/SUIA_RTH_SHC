import { db, exams } from '@quiz/db';
import { eq } from 'drizzle-orm';

import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { storage } from '@/lib/storage';
import { withSpan } from '@/lib/tracer';

import { ExportAggregator } from './exportAggregator';
import { ExportQueryBuilder } from './exportQueryBuilder';
import type { ExportFormat, ExportPayload } from './exportTypes';
import { CsvFormatter } from './formatters/csvFormatter';
import { JsonFormatter } from './formatters/jsonFormatter';

export class ExportEngine {
  private static instance: ExportEngine;
  public log = logger.child({ module: 'export-engine' });
  public queryBuilder = new ExportQueryBuilder();
  public aggregator = new ExportAggregator();
  public jsonFormatter = new JsonFormatter();
  public csvFormatter = new CsvFormatter();

  private constructor() {}

  static getInstance(): ExportEngine {
    if (ExportEngine.instance == null) {
      ExportEngine.instance = new ExportEngine();
    }
    return ExportEngine.instance;
  }

  async processExport(examId: string, userId: string, format: ExportFormat): Promise<string> {
    return withSpan('ExportEngine.processExport', async (span) => {
      span.setAttribute('examId', examId);
      span.setAttribute('userId', userId);
      span.setAttribute('format', format);

      this.log.info({ examId, userId, format }, 'Starting analytical export process');

      const cacheKey = `export:${examId}:${userId}:${format}`;
      try {
        const cachedUrl = await redis.get<string>(cacheKey);
        if (typeof cachedUrl === 'string' && cachedUrl.trim() !== '') {
          this.log.info({ examId, userId, format }, 'Export cache hit');
          return cachedUrl;
        }
        this.log.info({ examId, userId, format }, 'Export cache miss');
      } catch (error: unknown) {
        this.log.warn({ err: error, examId, userId }, 'Export cache read failed');
      }

      // Idempotency: return existing stored URL if already generated
      try {
        const examRow = await db.query.exams.findFirst({
          where: eq(exams.id, examId),
          columns: { exportUrls: true }
        });
        const exportUrls = (examRow?.exportUrls as Record<string, unknown> | null) ?? null;
        const existingUrl = format === 'json'
          ? (exportUrls as { analytics_json?: string } | null)?.analytics_json
          : format === 'csv'
          ? (exportUrls as { analytics_csv?: string } | null)?.analytics_csv
          : (exportUrls as { student_insight_pdf?: string } | null)?.student_insight_pdf;

        if (typeof existingUrl === 'string' && existingUrl.trim() !== '') {
          // Guard: student-insight-pdf must be a real PDF report artifact, not a stale JSON export.
          if (format === 'student-insight-pdf') {
            const lower = existingUrl.toLowerCase();
            const looksLikePdf = lower.endsWith('.pdf');
            const looksLikeReportsPath = lower.includes('/reports/') || lower.startsWith('reports/');
            if (!looksLikePdf || !looksLikeReportsPath) {
              this.log.warn({ examId, format, existingUrl }, 'Ignoring invalid student_insight_pdf pointer (expected reports/*.pdf)');
            } else {
              const { storage } = await import('@/lib/storage');
              const exists = await storage.exists(existingUrl);
              if (!exists) {
                this.log.warn({ examId, format, existingUrl }, 'Ignoring missing student_insight_pdf artifact in storage');
              } else {
                this.log.info({ examId, userId, format }, 'Export idempotency hit from exams.export_urls');
                try {
                  await redis.set(cacheKey, existingUrl, { ex: 900 });
                } catch (error: unknown) {
                  this.log.warn({ err: error, examId, userId }, 'Export cache write failed after idempotency hit');
                }
                return existingUrl;
              }
            }

            // Best-effort cleanup of stale/invalid pointers.
            try {
              const nextUrls = { ...(exportUrls ?? {}) };
              delete (nextUrls as Record<string, unknown>).student_insight_pdf;
              await db.update(exams).set({ exportUrls: nextUrls }).where(eq(exams.id, examId));
              await redis.del(cacheKey).catch(() => {});
            } catch {
              // ignore cleanup errors
            }
          } else {
            this.log.info({ examId, userId, format }, 'Export idempotency hit from exams.export_urls');
            try {
              await redis.set(cacheKey, existingUrl, { ex: 900 });
            } catch (error: unknown) {
              this.log.warn({ err: error, examId, userId }, 'Export cache write failed after idempotency hit');
            }
            return existingUrl;
          }
        }
      } catch (error: unknown) {
        this.log.warn({ err: error, examId, userId }, 'Export idempotency lookup failed');
      }

      // 1. Fetch Data
      const [meta, currentRows, historicalRows] = await Promise.all([
        this.queryBuilder.fetchUserMeta(examId),
        this.queryBuilder.fetchRawAttempts(examId),
        this.queryBuilder.fetchHistoricalAttempts(userId, examId)
      ]);
      
      this.log.info({ 
        examId, 
        currentRows: currentRows.length, 
        historicalRows: historicalRows.length 
      }, 'Data fetch completed for analytical export');

      // 2. Aggregate
      const [aggregations, historicalProgress] = await Promise.all([
        this.aggregator.buildAggregations(currentRows),
        this.aggregator.buildHistoricalProgress(historicalRows)
      ]);
      const guidanceSignals = this.aggregator.buildGuidanceSignals(currentRows, historicalRows);

      const payload: ExportPayload = {
        meta,
        rawAttempts: currentRows,
        aggregations,
        historicalProgress,
        guidanceSignals
      };

      // 3. Format
      let buffer: Buffer;
      let contentType: string;
      let extension: string;

      if (format === 'json') {
        buffer = this.jsonFormatter.format(payload);
        contentType = 'application/json';
        extension = 'json';
      } else if (format === 'csv') {
        buffer = await this.csvFormatter.formatAsZip(payload);
        contentType = 'application/zip';
        extension = 'zip';
      } else if (format === 'student-insight-pdf') {
        const { ReportPdfService } = await import('@/modules/report-engine/report-pdf.service');
        const { StudentInsightFormatter } = await import('./formatters/studentInsightFormatter');
        const { ReportEngine } = await import('@/modules/report-engine/report.engine');
        const { container } = await import('@/modules/core/container');
        const { uploadReport } = await import('@/lib/storage/upload-report');
        
        const reportEngine = container.get(ReportEngine);
        const premiumReport = await reportEngine.getPremiumExamReport(examId);
        
        const formatter = new StudentInsightFormatter();
        const insightData = formatter.format(payload, premiumReport);
        
        const { buffer: pdfBuffer } = await ReportPdfService.getInstance().generate(
          examId, 
          undefined, 
          undefined, 
          undefined, 
          undefined, 
          { 
            customPath: `/report/${examId}/student-insight`,
            customData: insightData 
          }
        );

        // Store Student Insight PDFs under reports/ with a stable, non-colliding name.
        const fileRef = await uploadReport(pdfBuffer, userId, examId, { fileBasename: `${examId}-student-insight` });

        try {
          const examRow = await db.query.exams.findFirst({
            where: eq(exams.id, examId),
            columns: { exportUrls: true }
          });
          const existingUrls = (examRow?.exportUrls as Record<string, unknown> | null) ?? {};
          await db.update(exams)
            .set({ exportUrls: { ...existingUrls, student_insight_pdf: fileRef } })
            .where(eq(exams.id, examId));
        } catch (error: unknown) {
          this.log.warn({ err: error, examId, userId }, 'Failed to persist student_insight_pdf to exams.export_urls');
        }

        try {
          await redis.set(cacheKey, fileRef, { ex: 900 });
        } catch (error: unknown) {
          this.log.warn({ err: error, examId, userId }, 'Export cache write failed for student-insight-pdf');
        }

        this.log.info({ examId, fileRef }, 'Student Insight PDF completed and uploaded');
        return fileRef;
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }

      // 4. Upload to shared storage provider
      const filename = `exports/${userId}/${examId}/analysis_${Date.now()}.${extension}`;
      const fileRef = await storage.uploadObject(buffer, { key: filename, contentType });

      try {
        await redis.set(cacheKey, fileRef, { ex: 900 });
      } catch (error: unknown) {
        this.log.warn({ err: error, examId, userId }, 'Export cache write failed');
      }

      this.log.info({ examId, fileRef }, 'Export completed and uploaded');
      return fileRef;
    });
  }
}
