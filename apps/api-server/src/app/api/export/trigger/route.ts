import { JobType } from '@quiz/types';
import { NextRequest, NextResponse } from 'next/server';

import { ExportSaga } from '@/lib/export/export.saga';
import { ExportFormat } from '@/lib/export/exportTypes';
import { logger } from '@/lib/logger';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { JobsService } from '@/modules/system/jobs.service';

const log = logger.child({ module: 'export-trigger-api' });

function buildExportDownloadUrl(examId: string, format: string) {
  const rawBase = process.env.NEXT_PUBLIC_API_URL ?? "";
  const suffix = `/api/export/download?examId=${encodeURIComponent(examId)}&format=${encodeURIComponent(format)}`;
  if (rawBase.trim() === "") {
    return suffix;
  }
  const base = rawBase.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  return `${base}${suffix}`;
}

/**
 * POST /api/export/trigger
 *
 * 🔐 SECURITY FIX (EXPORT-TRIGGER-01): Authenticate caller and derive userId
 * from verified JWT. Client-supplied userId is no longer trusted.
 */
export async function POST(req: NextRequest) {
  try {
    // ── Authentication ──────────────────────────────────────────────
    const tokenService = container.get(TokenService);
    const token = tokenService.getAccessToken(req, { scope: 'user' });

    if (token === undefined || token === null || token === '') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await tokenService.verifyUserAccessToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Derive userId from verified token — never from the request body
    const userId = payload.userId;

    // ── Body validation ─────────────────────────────────────────────
    const body = (await req.json()) as unknown;

    if (!isExportTriggerBody(body)) {
      log.warn({ body }, 'Invalid export trigger body');
      return NextResponse.json(
        { error: 'Missing required fields: examId, format', received: body },
        { status: 400 }
      );
    }

    const { examId, format } = body;

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
      await engine.processExport(examId, userId, format as ExportFormat);
      const downloadUrl = buildExportDownloadUrl(examId, format);
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
  return value === 'pdf' || value === 'json' || value === 'csv' || value === 'student-insight-pdf';
}

/** Body now only requires examId and format — userId comes from JWT */
function isExportTriggerBody(value: unknown): value is { examId: string; format: ExportFormat } {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    isNonEmptyString(record.examId) &&
    isExportFormat(record.format)
  );
}
