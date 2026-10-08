import type { questions } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import { JobStatus,JobType } from '@quiz/types';
import type { NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminQuestionEngine } from '@/modules/admin-engine/admin.engine';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { findBatchDuplicateDetails } from '@/modules/question/batch-duplicate-detector';
import { DuplicateDetector } from '@/modules/question/duplicate-detector';
import { bulkQuestionSchema } from '@/schemas/admin.schemas';

type ZodIssueLike = {
    path: Array<string | number>;
    message: string;
    code?: string;
};

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

function formatValidationIssues(issues: ZodIssueLike[]) {
    return issues.map((issue) => {
        const path = issue.path.length > 0
            ? issue.path.map((segment) => typeof segment === 'number' ? `[${segment}]` : String(segment)).join('.').replace('.[', '[')
            : 'payload';

        return {
            path,
            message: `${path}: ${issue.message}`,
            code: issue.code,
        };
    });
}

async function handler(_req: NextRequest) {
  const start = Date.now();
  try {
    const _payload = await requireAdminRouteAccess(_req);

    const rawBody = await _req.json() as BulkQuestionBody;

    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
        return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const sanitizedBody = sanitizeJsonField(rawBody) as BulkQuestionBody;
    const parsed = bulkQuestionSchema.safeParse(sanitizedBody);
    if (!parsed.success) {
        return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', formatValidationIssues(parsed.error.issues)));
    }
    const { topicId, subtopicId, skillId, skillIds, questions } = parsed.data;

    const batchDuplicates = findBatchDuplicateDetails(
        questions.map((q) => ({
            questionText: q.questionText,
            codeSnippet: q.codeSnippet,
            conceptKey: q.conceptKey,
            objectiveKey: q.objectiveKey,
            type: q.type,
            correctAnswer: q.correctAnswer,
        }))
    );

    if (batchDuplicates.length > 0) {
        return ApiResponse.error(
            badRequest(
                `Batch contains ${batchDuplicates.length} duplicate question(s) inside the uploaded JSON. Remove or edit them before committing.`,
                'VALIDATION_FAILED',
                batchDuplicates
            )
        );
    }

    const duplicateVerdicts = await Promise.all(
        questions.map((q) =>
            DuplicateDetector.evaluate(
                {
                    questionText: q.questionText,
                    codeSnippet: q.codeSnippet,
                    conceptKey: q.conceptKey,
                    objectiveKey: q.objectiveKey,
                    type: q.type,
                    correctAnswer: q.correctAnswer,
                },
                topicId
            )
        )
    );

    const duplicateDetails = duplicateVerdicts
        .map((verdict, index) => (verdict.status === 'duplicate' || verdict.status === 'review'
            ? {
                index,
                status: verdict.status,
                level: verdict.level,
                reason: verdict.reason,
                similarity: verdict.similarity ?? verdict.signals.semanticScore,
                originalId: verdict.signals.matchedQuestionId ?? null,
                existingQuestionText: verdict.signals.matchedQuestionText ?? null,
                existingQuestionCode: verdict.signals.matchedQuestionCode ?? null,
                isDuplicate: verdict.status === 'duplicate',
                judge: verdict.judge ?? undefined,
            }
            : null))
        .filter((detail): detail is NonNullable<typeof detail> => detail !== null);

    if (duplicateDetails.length > 0) {
        return ApiResponse.error(
            badRequest(
                `Batch contains ${duplicateDetails.length} duplicate/review-question(s) already in the question bank. Resolve flagged questions and retry.`,
                'VALIDATION_FAILED',
                duplicateDetails
            )
        );
    }

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
            : 'https://api.skillhubcore.in';
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
        if (workflowResponse.status === 404) {
            await JobsService.updateJobStatus(job.id, JobStatus.PROCESSING, { currentStep: 'workflow_fallback_sync_insert' });
            const context = { topicId, subtopicId, skillId, skillIds };
            const questionsWithContext = questions.map((question) => ({
                ...question,
                ...context,
            }));
            const inserted = await AdminQuestionEngine.bulkCreateQuestionsWithContext(questionsWithContext, context, _payload.userId);
            await JobsService.updateJobStatus(job.id, JobStatus.COMPLETED, {
                result: {
                    count: inserted.length,
                    mode: 'sync_fallback',
                    reason: 'workflow_not_found',
                }
            });

            const durationMs = Date.now() - start;
            recordCounter(METRICS.ADMIN.BULK_UPLOAD, 1, { outcome: 'sync_fallback', count: inserted.length });
            recordTimer(METRICS.ADMIN.BULK_UPLOAD + '.duration', durationMs, { outcome: 'sync_fallback' });

            return ApiResponse.success({
                success: true,
                jobId: job.id,
                count: inserted.length,
                message: `Saved ${inserted.length} questions using synchronous fallback because the workflow endpoint was not found`
            }, 200, { 'X-Duration-Ms': durationMs.toString() });
        }

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
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.BULK_UPLOAD, 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.BULK_UPLOAD + '.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(_error);
  }
}

export const POST = withLogging(handler, { component: 'admin', operation: 'bulk_upload_questions' });
