import { JobStatus } from '@quiz/types';
import { serve } from '@upstash/workflow/nextjs';
import { put } from '@vercel/blob';

import { eventBus } from '@/lib/event-bus';
import { AppEvents } from '@/lib/events';
import { ExportAggregator } from '@/lib/export/exportAggregator';
import { ExportQueryBuilder } from '@/lib/export/exportQueryBuilder';
import { ExportFormat, ExportPayload } from '@/lib/export/exportTypes';
import { CsvFormatter } from '@/lib/export/formatters/csvFormatter';
import { JsonFormatter } from '@/lib/export/formatters/jsonFormatter';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
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

  const persistState = async (state: Record<string, unknown>) => {
    try {
      await redis.set(stateKey, JSON.stringify(state), { ex: 900 });
    } catch (error: unknown) {
      log.warn({ err: error, jobId }, 'Failed to persist workflow state');
    }
  };

  await context.run('fetch-raw-data', async () => {
    log.info({ examId, jobId }, 'Step: Fetch Raw Data');
    await JobsService.updateJobStatus(jobId, JobStatus.PROCESSING);
    const [meta, currentRows, historicalRows] = await Promise.all([
      queryBuilder.fetchUserMeta(examId),
      queryBuilder.fetchRawAttempts(examId),
      queryBuilder.fetchHistoricalAttempts(userId, examId)
    ]);
    await persistState({ step: 'fetch-raw-data', examId, userId, format, meta, currentRows, historicalRows });
    return { meta, currentRows, historicalRows };
  });

  const aggregated = await context.run('aggregate-data', async () => {
    log.info({ examId, jobId }, 'Step: Aggregate Data');
    const metaState = await redis.get<string>(stateKey);
    const parsed =
      typeof metaState === 'string' && metaState.length > 0
        ? (JSON.parse(metaState) as { meta: unknown; currentRows: unknown; historicalRows: unknown })
        : null;
    const meta = parsed?.meta;
    const currentRows = (parsed?.currentRows ?? []) as Parameters<ExportAggregator['buildAggregations']>[0];
    const historicalRows = (parsed?.historicalRows ?? []) as Parameters<ExportAggregator['buildHistoricalProgress']>[0];

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

    await persistState({ step: 'aggregate-data', examId, userId, format, payload });
    return payload;
  });

  const formatted = await context.run('format-data', async () => {
    log.info({ examId, jobId }, 'Step: Format Data');
    const payload = aggregated;
    const buffer = format === 'csv' ? await csvFormatter.formatAsZip(payload) : jsonFormatter.format(payload);
    const contentType = format === 'csv' ? 'application/zip' : 'application/json';
    const extension = format === 'csv' ? 'zip' : 'json';
    const encoded = buffer.toString('base64');
    await persistState({ step: 'format-data', examId, userId, format, contentType, extension, encoded });
    return { contentType, extension, encoded };
  });

  const downloadUrl = await context.run('upload-to-blob', async () => {
    log.info({ examId, jobId }, 'Step: Upload to Blob');
    const buffer = Buffer.from(formatted.encoded, 'base64');
    const filename = `exports/${userId}/${examId}/analysis_${Date.now()}.${formatted.extension}`;
    const { url } = await put(filename, buffer, {
      access: 'private',
      contentType: formatted.contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    await persistState({ step: 'upload-to-blob', examId, userId, format, downloadUrl: url });
    return url;
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
      await redis.del(stateKey);
    } catch (error: unknown) {
      log.warn({ err: error, jobId }, 'Failed to cleanup workflow state');
    }
  });
});
