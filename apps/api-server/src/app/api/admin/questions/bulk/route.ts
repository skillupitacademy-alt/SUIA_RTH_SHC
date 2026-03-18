import type { questions } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import { JobStatus,JobType } from '@quiz/types';
import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { bulkQuestionSchema } from '@/schemas/admin.schemas';

type CreateQuestionInput = typeof questions.$inferInsert & {
    skillNames?: string[];
    mappingType?: string;
    skillWeight?: number;
    explanation?: string;
    codeSnippet?: string;
    metadata?: unknown;
};

export const dynamic = 'force-dynamic';

type BulkQuestionBody = {
  topicId: string;
  subtopicId?: string;
  skillId?: string;
  skillIds?: string[];
  questions: CreateQuestionInput[];
};

async function handler(_req: NextRequest) {
  const start = Date.now();
  try {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
      return ApiResponse.error(badRequest('Unauthorized', 'UNAUTHORIZED'));
    }

    const _payload = await container.get(TokenService).verifyAdminAccessToken(_token);

    if (!(await _verifyAdmin(_payload))) {
        return ApiResponse.error(badRequest('Forbidden', 'FORBIDDEN'));
    }

    const rawBody = await _req.json() as BulkQuestionBody;

    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
        return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const sanitizedBody = sanitizeJsonField(rawBody) as BulkQuestionBody;
    const parsed = bulkQuestionSchema.safeParse(sanitizedBody);
    if (!parsed.success) {
        return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
    }
    const { topicId, subtopicId, skillId, skillIds, questions } = parsed.data;

    // Create a job record for tracking the bulk import
    const { JobsService } = await import('@/modules/system/jobs.service');
    const job = await JobsService.createJob({
        userId: _payload.userId,
        type: JobType.BULK_IMPORT,
        payload: {
            count: questions.length,
            context: { topicId, subtopicId, skillId, skillIds }
        }
    });

    // Trigger Upstash Workflow instead of processing synchronously
    const publicEnvUrl = process.env.NEXT_PUBLIC_APP_URL;
    const internalEnvUrl = process.env.INTERNAL_API_URL;
    const publicUrl = typeof publicEnvUrl === 'string' && publicEnvUrl.trim() !== ''
        ? publicEnvUrl
        : typeof internalEnvUrl === 'string' && internalEnvUrl.trim() !== ''
            ? internalEnvUrl
            : 'http://localhost:3000';
    const workflowUrl = `${publicUrl}/api/workflows/bulk-import`;
    
    // We fire-and-forget or await the trigger
    const workflowResponse = await fetch(workflowUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            questions, 
            context: { topicId, subtopicId, skillId, skillIds }, 
            adminId: _payload.userId,
            jobId: job.id
        })
    });

    if (!workflowResponse.ok) {
        await JobsService.updateJobStatus(job.id, JobStatus.FAILED, { error: `Workflow trigger failed: ${workflowResponse.statusText}` });
        throw new Error(`Failed to trigger workflow: ${workflowResponse.statusText}`);
    }

    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.BULK_UPLOAD, 1, { outcome: 'async_started', count: questions.length });
    recordTimer(METRICS.ADMIN.BULK_UPLOAD + '.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({ 
        success: true, 
        jobId: job.id,
        count: questions.length,
        message: `Successfully queued ${questions.length} questions for background processing` 
    }, 202, { 'X-Duration-Ms': durationMs.toString() });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Internal Server Error';
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.BULK_UPLOAD, 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.BULK_UPLOAD + '.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(message, 500);
  }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'bulk_upload_questions' });
