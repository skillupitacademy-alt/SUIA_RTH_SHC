import { db, exams } from '@quiz/db';
import { put } from '@vercel/blob';
import { eq } from 'drizzle-orm';

import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
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
        const existingUrl = format === 'json'
          ? (examRow?.exportUrls as { analytics_json?: string } | null)?.analytics_json
          : format === 'csv'
          ? (examRow?.exportUrls as { analytics_csv?: string } | null)?.analytics_csv
          : (examRow?.exportUrls as { student_insight_pdf?: string } | null)?.student_insight_pdf;
        if (typeof existingUrl === 'string' && existingUrl.trim() !== '') {
          this.log.info({ examId, userId, format }, 'Export idempotency hit from exams.export_urls');
          try {
            await redis.set(cacheKey, existingUrl, { ex: 900 });
          } catch (error: unknown) {
            this.log.warn({ err: error, examId, userId }, 'Export cache write failed after idempotency hit');
          }
          return existingUrl;
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
        buffer = pdfBuffer;
        contentType = 'application/pdf';
        extension = 'pdf';
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }

      // 4. Upload to Vercel Blob
      const filename = `exports/${userId}/${examId}/analysis_${Date.now()}.${extension}`;
      const { url } = await put(filename, buffer, {
        access: 'private',
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      try {
        await redis.set(cacheKey, url, { ex: 900 });
      } catch (error: unknown) {
        this.log.warn({ err: error, examId, userId }, 'Export cache write failed');
      }

      this.log.info({ examId, url }, 'Export completed and uploaded');
      return url;
    });
  }
}
