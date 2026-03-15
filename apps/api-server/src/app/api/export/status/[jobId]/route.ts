import { JobStatus } from '@quiz/types';
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { JobsService } from '@/modules/system/jobs.service';

const log = logger.child({ module: 'export-status-api' });

type ExportWorkflowState = { step?: string };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function parseWorkflowState(raw: string | null): ExportWorkflowState | null {
  if (!isNonEmptyString(raw)) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;
    const step = (parsed as Record<string, unknown>).step;
    return { step: typeof step === 'string' ? step : undefined };
  } catch {
    return null;
  }
}

function mapWorkflowStepToStage(format: string, step?: string): { stage: string | null; progress: number | null } {
  if (!isNonEmptyString(step)) return { stage: null, progress: null };

  // Coarse progress values purely for UI. Not used for correctness.
  const progressByStep: Record<string, number> = {
    'fetch-raw-data': 15,
    'aggregate-data': 45,
    'format-data': 70,
    'upload-to-blob': 90,
    'notify-client': 98,
  };

  const progress = progressByStep[step] ?? null;

  // Normalize to modal stage ids.
  if (format === 'json') {
    if (step === 'fetch-raw-data') return { stage: 'queued', progress };
    if (step === 'aggregate-data') return { stage: 'processing', progress };
    if (step === 'format-data' || step === 'upload-to-blob') return { stage: 'finalizing', progress };
    if (step === 'notify-client') return { stage: 'ready', progress };
  }

  if (format === 'csv') {
    if (step === 'fetch-raw-data') return { stage: 'queued', progress };
    if (step === 'aggregate-data') return { stage: 'aggregating', progress };
    if (step === 'format-data' || step === 'upload-to-blob') return { stage: 'zipping', progress };
    if (step === 'notify-client') return { stage: 'ready', progress };
  }

  // Fallback for formats not handled by the workflow state machine.
  if (step === 'fetch-raw-data') return { stage: 'queued', progress };
  if (step === 'aggregate-data') return { stage: 'processing', progress };
  if (step === 'format-data' || step === 'upload-to-blob') return { stage: 'finalizing', progress };
  if (step === 'notify-client') return { stage: 'ready', progress };
  return { stage: null, progress: progress };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const job = await JobsService.getJobStatus(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const payload = (job.payload as Record<string, unknown> | null) ?? null;
    const format = (payload?.format as string | undefined) ?? (job.result as { format?: string } | null)?.format ?? 'json';

    // Stale job recovery: if processing for > 2 minutes, auto-fail
    const STALE_THRESHOLD_MS = 2 * 60 * 1000;
    if ((job.status === 'processing' || job.status === 'pending') && job.updatedAt !== null && job.updatedAt !== undefined) {
      const updatedAt = new Date(job.updatedAt).getTime();
      const elapsed = Date.now() - updatedAt;
      if (elapsed > STALE_THRESHOLD_MS) {
        log.warn({ jobId, elapsed, status: job.status }, 'Stale export job detected, auto-failing');
        await JobsService.updateJobStatus(jobId, 'failed' as JobStatus, { error: 'Export timed out. Please retry.' });
        return NextResponse.json({
          jobId: job.id,
          status: 'failed',
          error: 'Export timed out. Please retry.',
        });
      }
    }

    // Optional workflow state (used to drive UI stages)
    const stateKey = `export:workflow:${jobId}`;
    let inferredStage: string | null = null;
    let inferredProgress: number | null = null;
    try {
      const rawState = await redis.get<string>(stateKey);
      const state = parseWorkflowState(rawState ?? null);
      const mapped = mapWorkflowStepToStage(format, state?.step);
      inferredStage = mapped.stage;
      inferredProgress = mapped.progress;
    } catch (error: unknown) {
      log.warn({ err: error, jobId }, 'Failed to read export workflow state');
    }

    // Build proxy download URL for private blob access

    const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/api\/?$/, '').replace(/\/+$/, '');
    const proxyDownloadUrl = (job.result?.downloadUrl !== null && job.result?.downloadUrl !== undefined)
      ? `${base}/api/export/download?jobId=${job.id}`
      : undefined;

    // Standard response structure for polling
    return NextResponse.json({
      jobId: job.id,
      status: job.status, // 'pending' | 'processing' | 'complete' | 'failed'
      stage: job.status === 'completed' ? 'ready' : inferredStage,
      downloadUrl: proxyDownloadUrl,
      error: job.error,
      progress: inferredProgress
    });

  } catch (error: unknown) {
    log.error({ err: error }, 'Failed to fetch export status');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
