import { db, questions } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { and, eq } from 'drizzle-orm';
import { type NextRequest } from 'next/server';

import { badRequest, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from "@/lib/sanitize";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';

interface DuplicateCheckPayload {
  questions: { questionText: string }[];
  topicId: string;
}

async function postHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: 'admin' });
    if (token === null || token === undefined || token === '') {
      recordCounter(METRICS.AUTH.FAILURE, 1, { scope: 'admin', reason: 'unauthorized' });
      throw unauthorized("Authentication required");
    }

    const payload = await container.get(TokenService).verifyAdminAccessToken(token);
    if (payload === null || payload === undefined) {
      recordCounter(METRICS.AUTH.FAILURE, 1, { scope: 'admin', reason: 'unauthorized' });
      throw unauthorized("Authentication required");
    }

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

    const existingQuestions = await db
      .select({ id: questions.id, text: questions.questionText })
      .from(questions)
      .where(and(
        eq(questions.topicId, topicId),
        eq(questions.status, "active")
      ));

    const normalize = (text: string) => text.toLowerCase().trim().replace(/\s+/g, ' ');

    const existingMap = new Map<string, string>();
    existingQuestions.forEach(q => {
        existingMap.set(normalize(q.text), q.id);
    });

    const duplicates = checkQuestions.map((q, idx) => {
        const norm = normalize(q.questionText);
        if (existingMap.has(norm)) {
            return {
                index: idx,
                originalId: existingMap.get(norm),
                isDuplicate: true
            };
        }
        return null;
    }).filter(Boolean);

    recordCounter('factory.api.duplicate_check.success', 1, { topicId });
    recordTimer('factory.api.duplicate_check.duration', Date.now() - start, { outcome: 'success' });
    
    return ApiResponse.success({
      details: duplicates,
      foundCount: duplicates.length
    });

  } catch (error: unknown) {
    logger.error({ err: error }, "Duplicate Check Error");
    recordCounter('factory.api.duplicate_check.failure', 1, { reason: 'internal_error' });
    recordTimer('factory.api.duplicate_check.duration', Date.now() - start, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const POST = withLogging(postHandler, { component: 'factory', operation: 'check_duplicates' });
