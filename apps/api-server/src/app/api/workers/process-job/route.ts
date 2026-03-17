import { NextResponse } from 'next/server';

import { badRequest } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { logger } from '@/lib/logger';
import { recordCounter, recordTimer } from "@/lib/metrics";
import { verifyQStashSignature } from '@/lib/qstash-verify';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from "@/lib/sanitize";
import { withLogging } from "@/lib/withLogging";
import { JobOrchestrator } from '@/modules/system/job-orchestrator';

export const dynamic = "force-dynamic";

async function postHandler(req: Request) {
  const start = Date.now();
  try {
    const { valid, body: rawBody } = await verifyQStashSignature(req);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobType = req.headers.get('upstash-forward-job-type');

    let raw;
    try {
      raw = JSON.parse(rawBody);
      validateJsonSize(raw);
      validateJsonDepth(raw);
    } catch {
      throw badRequest("Invalid payload");
    }
    const body = sanitizeJsonField(raw) as Record<string, unknown>;

    const jobId = typeof body.jobId === 'string' ? body.jobId.trim() : '';
    const userId = typeof body.userId === 'string' && body.userId.trim() !== '' ? body.userId : 'system';
    
    if (jobId === '') {
        throw badRequest("jobId is required");
    }

    logger.info({ jobType, jobId }, '[Worker] Processing job');

    // 2. Execute the job via the main orchestrator
    // The orchestrator handles status updates (running, completed, failed)
    await JobOrchestrator.runJob(jobId, userId);

    const durationMs = Date.now() - start;
    recordCounter('worker.api.job.success', 1, { jobType: jobType ?? 'unknown' });
    recordTimer('worker.api.job.duration', durationMs, { jobType: jobType ?? 'unknown', outcome: 'success' });
    return ApiResponse.success({ success: true }, 200, {
        'X-Duration-Ms': durationMs.toString()
    });
  } catch (error) {
    logger.error({ err: error }, '[Worker] Critical failure');
    recordCounter('worker.api.job.failure', 1, { jobType: req.headers.get('upstash-forward-job-type') ?? 'unknown' });
    recordTimer('worker.api.job.duration', Date.now() - start, { jobType: req.headers.get('upstash-forward-job-type') ?? 'unknown', outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const POST = withLogging(postHandler, { component: 'worker', operation: 'process_job' });
