import { db, exams } from '@quiz/db';
import { JobStatus } from '@quiz/types';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { unauthorized } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { storage } from '@/lib/storage';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { JobsService } from '@/modules/system/jobs.service';

const log = logger.child({ module: 'export-status-api' });

type ExportWorkflowState = { step?: string };
type ExportFormat = 'json' | 'csv' | 'student-insight-pdf';

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

function normalizeFormat(value: string | null | undefined): ExportFormat {
  if (value === 'csv' || value === 'student-insight-pdf') return value;
  return 'json';
}

function mapWorkflowStepToStage(format: string, step?: string): { stage: string | null; progress: number | null } {
  if (!isNonEmptyString(step)) return { stage: null, progress: null };

  const progressByStep: Record<string, number> = {
    'fetch-raw-data': 15,
    'aggregate-data': 45,
    'format-data': 70,
    'upload-to-blob': 90,
    'notify-client': 98,
  };

  const progress = progressByStep[step] ?? null;

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

  if (format === 'student-insight-pdf') {
    if (step === 'fetch-raw-data') return { stage: 'queued', progress };
    if (step === 'aggregate-data') return { stage: 'processing', progress };
    if (step === 'render-pdf' || step === 'upload-report') return { stage: 'rendering', progress };
    if (step === 'notify-client') return { stage: 'ready', progress };
  }

  if (step === 'fetch-raw-data') return { stage: 'queued', progress };
  if (step === 'aggregate-data') return { stage: 'processing', progress };
  if (step === 'format-data' || step === 'upload-to-blob') return { stage: 'finalizing', progress };
  if (step === 'notify-client') return { stage: 'ready', progress };
  return { stage: null, progress };
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

    const { searchParams } = new URL(req.url);
    const examId = (searchParams.get('examId') ?? '').trim();
    const requestedFormat = normalizeFormat(searchParams.get('format'));

    const internalKey = req.headers.get('x-internal-key');
    const internalSecret = process.env.INTERNAL_API_KEY ?? '';
    const isInternal = internalKey !== null && internalSecret !== '' && internalKey === internalSecret;

    let userId: string | undefined;
    if (!isInternal) {
      const token = container.get(TokenService).getAccessToken(req, { scope: 'user' });
      if (token === undefined || token === null || token === '') {
        throw unauthorized('Unauthorized');
      }

      const payload = await container.get(TokenService).verifyUserAccessToken(token);
      userId = payload.userId;
    }

    const job = await JobsService.getJobStatus(jobId);
    const jobFormat = normalizeFormat(
      (job?.payload as Record<string, unknown> | null | undefined)?.format as string | null | undefined
      ?? (job?.result as { format?: string } | null | undefined)?.format
      ?? requestedFormat
    );

    const staleThresholdMs = 2 * 60 * 1000;
    if (job && (job.status === 'processing' || job.status === 'pending') && job.updatedAt !== null && job.updatedAt !== undefined) {
      const updatedAt = new Date(job.updatedAt).getTime();
      const elapsed = Date.now() - updatedAt;
      if (elapsed > staleThresholdMs) {
        const recovered = await resolveReadyExportArtifact({
          jobId,
          job,
          examId,
          format: jobFormat,
          requestUserId: userId,
        });

        if (recovered !== null) {
          await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
            result: {
              ...(job.result as Record<string, unknown> | undefined ?? {}),
              examId: recovered.examId ?? undefined,
              format: jobFormat,
              downloadUrl: recovered.proxyDownloadUrl,
              completedAt: new Date().toISOString(),
            },
          }).catch(() => {});

          return NextResponse.json({
            jobId,
            status: 'completed',
            stage: 'ready',
            downloadUrl: recovered.proxyDownloadUrl,
            error: null,
            progress: 100,
          });
        }

        log.warn({ jobId, elapsed, status: job.status }, 'Stale export job detected, auto-failing');
        await JobsService.updateJobStatus(jobId, JobStatus.FAILED, { error: 'Export timed out. Please retry.' });
        return NextResponse.json({
          jobId,
          status: 'failed',
          error: 'Export timed out. Please retry.',
        });
      }
    }

    const stateKey = `export:workflow:${jobId}`;
    let inferredStage: string | null = null;
    let inferredProgress: number | null = null;
    try {
      const rawState = await redis.get<string>(stateKey);
      const state = parseWorkflowState(rawState ?? null);
      const mapped = mapWorkflowStepToStage(jobFormat, state?.step);
      inferredStage = mapped.stage;
      inferredProgress = mapped.progress;
    } catch (error: unknown) {
      log.warn({ err: error, jobId }, 'Failed to read export workflow state');
    }

    if (!job) {
      if (examId !== '') {
        const recovered = await resolveReadyExportArtifact({
          jobId,
          examId,
          format: requestedFormat,
          job: undefined,
          requestUserId: userId,
        });
        if (recovered !== null) {
          return NextResponse.json({
            jobId,
            status: 'completed',
            stage: 'ready',
            downloadUrl: recovered.proxyDownloadUrl,
            error: null,
            progress: 100,
          });
        }

        return NextResponse.json({
          jobId,
          status: 'failed',
          error: 'Export job not found',
        });
      }

      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const readyArtifact = await resolveReadyExportArtifact({
      jobId,
      job,
      examId,
      format: jobFormat,
      requestUserId: userId,
    });
    if (readyArtifact !== null) {
      if (job.status !== JobStatus.COMPLETED) {
        await JobsService.updateJobStatus(jobId, JobStatus.COMPLETED, {
          result: {
            ...(job.result as Record<string, unknown> | undefined ?? {}),
            examId: readyArtifact.examId ?? undefined,
            format: jobFormat,
            downloadUrl: readyArtifact.proxyDownloadUrl,
            completedAt: new Date().toISOString(),
          },
        }).catch(() => {});
      }

      return NextResponse.json({
        jobId,
        status: 'completed',
        stage: 'ready',
        downloadUrl: readyArtifact.proxyDownloadUrl,
        error: null,
        progress: 100,
      });
    }

    if (job.status === JobStatus.FAILED) {
      return NextResponse.json({
        jobId,
        status: 'failed',
        error: job.error ?? 'Export failed. Please retry.',
        stage: inferredStage,
        progress: inferredProgress,
      });
    }

    return NextResponse.json({
      jobId,
      status: job.status,
      stage: job.status === JobStatus.COMPLETED ? 'ready' : inferredStage,
      error: job.error ?? undefined,
      progress: inferredProgress,
    });
  } catch (error: unknown) {
    log.error({ err: error }, 'Failed to fetch export status');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function resolveReadyExportArtifact({
  jobId,
  job,
  examId,
  format,
  requestUserId,
}: {
  jobId: string;
  job: Awaited<ReturnType<typeof JobsService.getJobStatus>> | undefined;
  examId: string;
  format: ExportFormat;
  requestUserId?: string;
}): Promise<{ proxyDownloadUrl: string; examId?: string } | null> {
  const candidates: Array<{ ref: string; source: 'job' | 'exam'; examId?: string }> = [];
  const jobDownloadUrl = extractJobDownloadUrl(job);
  if (jobDownloadUrl !== null) {
    candidates.push({ ref: jobDownloadUrl, source: 'job' });
  }

  if (examId !== '') {
    const examFallback = await resolveExamFallbackArtifact({
      examId,
      format,
      userId: job?.userId ?? requestUserId,
    });
    if (examFallback !== null) {
      candidates.push({ ref: examFallback.fileRef, source: 'exam', examId });
    }
  }

  for (const candidate of candidates) {
    const exists = await storage.exists(candidate.ref).catch(() => false);
    if (exists) {
      return {
        proxyDownloadUrl: candidate.source === 'job'
          ? buildProxyDownloadUrl({ jobId, format })
          : buildProxyDownloadUrl({ examId: candidate.examId ?? examId, format }),
        examId: candidate.examId,
      };
    }
  }

  return null;
}

async function resolveExamFallbackArtifact({
  examId,
  format,
  userId,
}: {
  examId: string;
  format: ExportFormat;
  userId?: string;
}): Promise<{ fileRef: string } | null> {
  if (examId === '') return null;

  const exam = await db.query.exams.findFirst({
    where: eq(exams.id, examId),
    columns: { userId: true, exportUrls: true },
  });

  if (exam === null || exam === undefined) {
    return null;
  }

  if (typeof userId === 'string' && userId !== '' && exam.userId !== userId) {
    return null;
  }

  const exportUrls = exam.exportUrls as { analytics_json?: string; analytics_csv?: string; student_insight_pdf?: string } | null;
  const ref = format === 'csv'
    ? exportUrls?.analytics_csv
    : format === 'student-insight-pdf'
      ? exportUrls?.student_insight_pdf
      : exportUrls?.analytics_json;

  if (typeof ref !== 'string' || ref.trim() === '') {
    return null;
  }

  return { fileRef: ref.trim() };
}

function extractJobDownloadUrl(job: Awaited<ReturnType<typeof JobsService.getJobStatus>>): string | null {
  const raw = job?.result as { downloadUrl?: string | null } | null | undefined;
  if (typeof raw?.downloadUrl !== 'string' || raw.downloadUrl.trim() === '') {
    return null;
  }
  return raw.downloadUrl.trim();
}

function buildProxyDownloadUrl({
  jobId,
  examId,
  format,
}: {
  jobId?: string;
  examId?: string;
  format: ExportFormat;
}) {
  const rawBase = process.env.NEXT_PUBLIC_API_URL ?? '';
  const suffix = jobId !== undefined
    ? `/api/export/download?jobId=${encodeURIComponent(jobId)}`
    : `/api/export/download?examId=${encodeURIComponent(examId ?? '')}&format=${encodeURIComponent(format)}`;
  if (rawBase.trim() === '') {
    return suffix;
  }
  const base = rawBase.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  return `${base}${suffix}`;
}
