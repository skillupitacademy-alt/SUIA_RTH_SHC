import { db, exams } from '@quiz/db';
import { JobStatus } from '@quiz/types';
import { serve } from '@upstash/workflow/nextjs';
import { eq } from 'drizzle-orm';

import { eventBus } from '@/lib/event-bus';
import { AppEvents } from '@/lib/events';
import { ExportAggregator } from '@/lib/export/exportAggregator';
import { ExportQueryBuilder } from '@/lib/export/exportQueryBuilder';
import { ExportFormat, ExportPayload } from '@/lib/export/exportTypes';
import { CsvFormatter } from '@/lib/export/formatters/csvFormatter';
import { JsonFormatter } from '@/lib/export/formatters/jsonFormatter';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { storage } from '@/lib/storage';
import { JobsService } from '@/modules/system/jobs.service';

const log = logger.child({ module: 'export-workflow' });

export const { POST } = serve<{
  examId: string;
  userId: string;
  format: ExportFormat;
  jobId: string;
}>(async (context) => {
  const { examId, userId, format, jobId } = context.requestPayload;
  const stateKey = `export:workflow:${jobId}`;
  const queryBuilder = new ExportQueryBuilder();
  const aggregator = new ExportAggregator();
  const jsonFormatter = new JsonFormatter();
  const csvFormatter = new CsvFormatter();
  const cacheKey = `export:${examId}:${userId}:${format}`;

  const persistState = async (state: Record<string, unknown>) => {
    try {
      await redis.set(stateKey, JSON.stringify(state), { ex: 900 });
    } catch (error: unknown) {
      log.warn({ err: error, jobId }, 'Failed to persist workflow state');
    }
  };

  // Student Insight PDF is a PDF artifact (stored under reports/), not a JSON/ZIP export.
  // It needs a dedicated flow; otherwise it would fall through to JSON formatting.
  if (format === 'student-insight-pdf') {
    const fileRef = await context.run('generate-student-insight-pdf', async () => {
      log.info({ examId, jobId }, 'Step: Generate Student Insight PDF');
      await JobsService.updateJobStatus(jobId, JobStatus.PROCESSING, { currentStep: 'processing' });
      await persistState({ step: 'fetch-raw-data', examId, userId, format });

      const { ExportEngine } = await import('@/lib/export/exportEngine');
      const engine = ExportEngine.getInstance();

      await persistState({ step: 'aggregate-data', examId, userId, format });
      // ExportEngine handles formatter + ReportPdfService + upload + exams.export_urls persistence.
      const ref = await engine.processExport(examId, userId, 'student-insight-pdf');

      await persistState({ step: 'render-pdf', examId, userId, format });
      await persistState({ step: 'upload-report', examId, userId, format });
      return ref;
    });

    await context.run('notify-client', async () => {
      log.info({ examId, jobId }, 'Step: Notify Client');
      await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
        result: {
          examId,
          format,
          downloadUrl: fileRef,
          completedAt: new Date().toISOString()
        }
      });

      void eventBus.emitEvent(AppEvents.EXPORT_COMPLETE, {
        examId,
        userId,
        format,
        downloadUrl: fileRef,
        completedAt: new Date()
      });

      try {
        await redis.set(cacheKey, fileRef, { ex: 900 });
      } catch (error: unknown) {
        log.warn({ err: error, jobId, examId }, 'Export workflow cache write failed after completion');
      }

      try {
        await redis.del(stateKey);
      } catch (error: unknown) {
        log.warn({ err: error, jobId }, 'Failed to cleanup workflow state');
      }
    });

    return;
  }

  const fetched = await context.run('fetch-raw-data', async () => {
    log.info({ examId, jobId }, 'Step: Fetch Raw Data');
    await JobsService.updateJobStatus(jobId, JobStatus.PROCESSING);

    // Idempotency: check cache and DB before heavy work
    try {
      const cachedUrl = await redis.get<string>(cacheKey);
      if (typeof cachedUrl === 'string' && cachedUrl.trim() !== '') {
        log.info({ examId, jobId, format }, 'Export workflow cache hit');
        await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
          result: {
            examId,
            format,
            downloadUrl: cachedUrl,
            completedAt: new Date().toISOString()
          }
        });
        return { meta: null, currentRows: [], historicalRows: [], shortCircuitUrl: cachedUrl } as const;
      }
      log.info({ examId, jobId, format }, 'Export workflow cache miss');
    } catch (error: unknown) {
      log.warn({ err: error, jobId, examId }, 'Export workflow cache read failed');
    }

    try {
      const examRow = await db.query.exams.findFirst({
        where: eq(exams.id, examId),
        columns: { exportUrls: true }
      });
      const existingUrl = format === 'json'
        ? (examRow?.exportUrls as { analytics_json?: string } | null)?.analytics_json
        : (examRow?.exportUrls as { analytics_csv?: string } | null)?.analytics_csv;
      if (typeof existingUrl === 'string' && existingUrl.trim() !== '') {
        log.info({ examId, jobId, format }, 'Export workflow idempotency hit from exams.export_urls');
        try {
          await redis.set(cacheKey, existingUrl, { ex: 900 });
        } catch (error: unknown) {
          log.warn({ err: error, jobId, examId }, 'Export workflow cache write failed after idempotency hit');
        }
        await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
          result: {
            examId,
            format,
            downloadUrl: existingUrl,
            completedAt: new Date().toISOString()
          }
        });
        return { meta: null, currentRows: [], historicalRows: [], shortCircuitUrl: existingUrl } as const;
      }
    } catch (error: unknown) {
      log.warn({ err: error, jobId, examId }, 'Export workflow idempotency lookup failed');
    }

    const [meta, currentRows, historicalRows] = await Promise.all([
      queryBuilder.fetchUserMeta(examId),
      queryBuilder.fetchRawAttempts(examId),
      queryBuilder.fetchHistoricalAttempts(userId, examId)
    ]);
    // Persist only lightweight state to avoid Redis size limits.
    await persistState({ step: 'fetch-raw-data', examId, userId, format });
    return { meta, currentRows, historicalRows };
  });

  if ('shortCircuitUrl' in fetched) {
    return;
  }

  const aggregated = await context.run('aggregate-data', async () => {
    log.info({ examId, jobId }, 'Step: Aggregate Data');
    const { meta, currentRows, historicalRows } = fetched;

    const [aggregations, historicalProgress] = await Promise.all([
      aggregator.buildAggregations(currentRows),
      aggregator.buildHistoricalProgress(historicalRows)
    ]);
    const guidanceSignals = aggregator.buildGuidanceSignals(currentRows, historicalRows);

    const payload = {
      meta,
      rawAttempts: currentRows,
      aggregations,
      historicalProgress,
      guidanceSignals
    } as ExportPayload;

    await persistState({ step: 'aggregate-data', examId, userId, format });
    return payload;
  });

  await context.run('format-data', async () => {
    log.info({ examId, jobId }, 'Step: Format Data');
    const payload = aggregated;
    const buffer = format === 'csv' ? await csvFormatter.formatAsZip(payload) : jsonFormatter.format(payload);
    const contentType = format === 'csv' ? 'application/zip' : 'application/json';
    const extension = format === 'csv' ? 'zip' : 'json';
    await persistState({ step: 'format-data', examId, userId, format, contentType, extension });
    return { contentType, extension, bufferLength: buffer.length };
  });

  const downloadUrl = await context.run('upload-to-storage', async () => {
    log.info({ examId, jobId }, 'Step: Upload to storage');
    const payload = aggregated;
    const buffer = format === 'csv' ? await csvFormatter.formatAsZip(payload) : jsonFormatter.format(payload);
    const contentType = format === 'csv' ? 'application/zip' : 'application/json';
    const extension = format === 'csv' ? 'zip' : 'json';
    const filename = `exports/${userId}/${examId}/analysis_${Date.now()}.${extension}`;
    const fileRef = await storage.uploadObject(buffer, { key: filename, contentType });
    await persistState({ step: 'upload-to-storage', examId, userId, format, downloadUrl: fileRef, bufferBytes: buffer.length });
    return fileRef;
  });

  await context.run('notify-client', async () => {
    log.info({ examId, jobId }, 'Step: Notify Client');
    await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
      result: {
        examId,
        format,
        downloadUrl,
        completedAt: new Date().toISOString()
      }
    });

    void eventBus.emitEvent(AppEvents.EXPORT_COMPLETE, {
      examId,
      userId,
      format,
      downloadUrl,
      completedAt: new Date()
    });

    try {
      await redis.set(cacheKey, downloadUrl, { ex: 900 });
    } catch (error: unknown) {
      log.warn({ err: error, jobId, examId }, 'Export workflow cache write failed after completion');
    }

    try {
      await redis.del(stateKey);
    } catch (error: unknown) {
      log.warn({ err: error, jobId }, 'Failed to cleanup workflow state');
    }
  });
});
