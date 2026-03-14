import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { JobsService } from '@/modules/system/jobs.service';

const log = logger.child({ module: 'export-status-api' });

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

    // Stale job recovery: if processing for > 2 minutes, auto-fail
    const STALE_THRESHOLD_MS = 2 * 60 * 1000;
    if ((job.status === 'processing' || job.status === 'pending') && job.updatedAt) {
      const updatedAt = new Date(job.updatedAt).getTime();
      const elapsed = Date.now() - updatedAt;
      if (elapsed > STALE_THRESHOLD_MS) {
        log.warn({ jobId, elapsed, status: job.status }, 'Stale export job detected, auto-failing');
        await JobsService.updateJobStatus(jobId, 'failed' as any, { error: 'Export timed out. Please retry.' });
        return NextResponse.json({
          jobId: job.id,
          status: 'failed',
          error: 'Export timed out. Please retry.',
        });
      }
    }

    // Standard response structure for polling
    return NextResponse.json({
      jobId: job.id,
      status: job.status, // 'pending' | 'processing' | 'complete' | 'failed'
      downloadUrl: job.result?.downloadUrl,
      error: job.error,
      progress: job.progress
    });

  } catch (error: unknown) {
    log.error({ err: error }, 'Failed to fetch export status');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
