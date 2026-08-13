import { type NextRequest } from 'next/server';

import { badRequest } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from "@/lib/sanitize";
import { withLogging } from "@/lib/withLogging";
import { requireAdminRouteAccess } from "@/modules/auth/admin-audience.util";
import { findBatchDuplicateDetails } from "@/modules/question/batch-duplicate-detector";
import { DuplicateDetector } from "@/modules/question/duplicate-detector";

interface DuplicateCheckPayload {
  questions: {
    questionText: string;
    codeSnippet?: string;
    conceptKey?: string;
    objectiveKey?: string;
    type?: string;
    correctAnswer?: string;
  }[];
  topicId: string;
}

export const dynamic = "force-dynamic";

async function postHandler(req: NextRequest) {
  const start = Date.now();
  try {
    await requireAdminRouteAccess(req);

    // Ingest and sanitize JSON body
    let raw;
    try {
      raw = await req.json();
      validateJsonSize(raw);
      validateJsonDepth(raw);
    } catch {
      throw badRequest("Invalid payload");
    }
    const body = sanitizeJsonField(raw) as DuplicateCheckPayload;
    const { questions: checkQuestions, topicId } = body;
    const hasQuestions = Array.isArray(checkQuestions) && checkQuestions.length > 0;
    const hasTopicId = typeof topicId === "string" && topicId.trim().length > 0;

    if (!hasQuestions || !hasTopicId) {
      throw badRequest("Invalid payload");
    }

    const batchDetails = findBatchDuplicateDetails(checkQuestions);
    const batchDuplicateIndices = new Set(batchDetails.map((detail) => detail.index));

    // Layered duplicate detection per question:
    //   in-batch duplicate checks, then DB/vector/judge checks.
    const details = await Promise.all(
      checkQuestions.map(async (q, idx) => {
        if (batchDuplicateIndices.has(idx)) return null;

        const verdict = await DuplicateDetector.evaluate(
          {
            questionText: q.questionText,
            codeSnippet: q.codeSnippet,
            conceptKey: q.conceptKey,
            objectiveKey: q.objectiveKey,
            type: q.type,
            correctAnswer: q.correctAnswer,
          },
          topicId
        );

        if (verdict.status === 'new') return null;

        return {
          index: idx,
          status: verdict.status, // 'duplicate' | 'review'
          level: verdict.level,
          reason: verdict.reason,
          similarity: verdict.similarity ?? verdict.signals.semanticScore,
          originalId: verdict.signals.matchedQuestionId ?? null,
          existingQuestionText: verdict.signals.matchedQuestionText ?? null,
          existingQuestionCode: verdict.signals.matchedQuestionCode ?? null,
          isDuplicate: verdict.status === 'duplicate',
          judge: verdict.judge ?? undefined,
        };
      })
    );

    const dbDetails = details.filter((d): d is Exclude<typeof d, null> => d !== null);
    const nonNewDetails = [...batchDetails, ...dbDetails].sort((a, b) => a.index - b.index);
    const blockedIndices = new Set(nonNewDetails.map((detail) => detail.index));

    recordCounter('factory.api.duplicate_check.success', 1, { topicId });
    recordTimer('factory.api.duplicate_check.duration', Date.now() - start, { outcome: 'success' });
    
    return ApiResponse.success({
      details: nonNewDetails,
      foundCount: nonNewDetails.length,
      newCount: checkQuestions.length - blockedIndices.size
    });

  } catch (error: unknown) {
    logger.error({ err: error }, "Duplicate Check Error");
    recordCounter('factory.api.duplicate_check.failure', 1, { reason: 'internal_error' });
    recordTimer('factory.api.duplicate_check.duration', Date.now() - start, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const POST = withLogging(postHandler, { component: 'factory', operation: 'check_duplicates' });
