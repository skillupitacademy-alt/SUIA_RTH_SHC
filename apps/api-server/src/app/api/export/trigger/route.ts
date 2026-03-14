import { JobType } from '@quiz/types';
import { NextRequest, NextResponse } from 'next/server';

import { ExportSaga } from '@/lib/export/export.saga';
import { ExportFormat } from '@/lib/export/exportTypes';
import { logger } from '@/lib/logger';
import { JobsService } from '@/modules/system/jobs.service';

const log = logger.child({ module: 'export-trigger-api' });

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
 
     if (!isExportTriggerBody(body)) {
       log.warn({ body }, 'Invalid export trigger body');
       return NextResponse.json(
         { error: 'Missing required fields: examId, format, userId', received: body },
         { status: 400 }
       );
     }

    const { examId, format, userId } = body;

    log.info({ examId, format, userId }, 'Triggering analytical export');

    const queuesEnabled = process.env.QUEUE_ENABLED === 'true';
    const hasQstash = typeof process.env.QSTASH_TOKEN === 'string' && process.env.QSTASH_TOKEN.trim() !== '';
    const isDev = process.env.NODE_ENV !== 'production';

    if (queuesEnabled) {
      const jobId = await ExportSaga.start(examId, userId, format as ExportFormat);
      return NextResponse.json({ 
        jobId, 
        status: 'processing',
        message: 'Export job initiated. Poll status for completion.'
      });
    }

    if (hasQstash) {
      const job = await JobsService.createJob({
        userId,
        type: JobType.EXPORT_SAGA,
        payload: { examId, format }
      });

      const { queueService } = await import('@/modules/core/queue.service');
      const enqueueResult = await queueService.enqueue('export_saga', { jobId: job.id, userId });
      if (!enqueueResult.success) {
        await ExportSaga.execute(job.id, { examId, userId, format });
      }

      return NextResponse.json({ 
        jobId: job.id, 
        status: 'processing',
        message: 'Export job initiated. Poll status for completion.'
      });
    }

    if (isDev) {
      const { ExportEngine } = await import('@/lib/export/exportEngine');
      const engine = ExportEngine.getInstance();
      const downloadUrl = await engine.processExport(examId, userId, format as ExportFormat);
      return NextResponse.json({ 
        downloadUrl, 
        status: 'completed'
      });
    }

    const jobId = await ExportSaga.start(examId, userId, format as ExportFormat);
    return NextResponse.json({ 
      jobId, 
      status: 'processing',
      message: 'Export job initiated. Poll status for completion.'
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    log.error({ err: error }, 'Failed to trigger export');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isExportFormat(value: unknown): value is ExportFormat {
  return value === 'pdf' || value === 'json' || value === 'csv';
}

function isExportTriggerBody(value: unknown): value is { examId: string; format: ExportFormat; userId: string } {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    isNonEmptyString(record.examId) &&
    isNonEmptyString(record.userId) &&
    isExportFormat(record.format)
  );
}
