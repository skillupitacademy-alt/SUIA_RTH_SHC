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
