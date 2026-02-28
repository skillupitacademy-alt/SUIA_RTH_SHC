import { db, questions } from "@quiz/db";
import { and,eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { logger } from "@/lib/logger";
import { TokenService } from "@/modules/auth/token.service";

interface DuplicateCheckPayload {
  questions: { questionText: string }[];
  topicId: string;
}

import { METRICS } from "@quiz/observability";

import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = TokenService.getAccessToken(req, { scope: 'admin' });
    if (token === undefined || token === null || token === '') {
      recordCounter(METRICS.AUTH.FAILURE, 1, { scope: 'admin', reason: 'unauthorized' });
      return NextResponse.json({ _error: "Authentication required", scope: 'admin' }, { status: 401 });
    }

    await TokenService.verifyAccessToken(token, true);

    const { questions: checkQuestions, topicId } = (await req.json()) as DuplicateCheckPayload;

    if (checkQuestions === undefined || checkQuestions === null || checkQuestions.length === 0 || topicId === undefined || topicId === null || topicId === '') {
      return NextResponse.json({ _error: "Invalid payload" }, { status: 400 });
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
    return NextResponse.json({
      details: duplicates,
      foundCount: duplicates.length
    });

  } catch (error) {
    logger.error({ err: error }, "Duplicate Check Error");
    recordCounter('factory.api.duplicate_check.failure', 1, { reason: 'internal_error' });
    recordTimer('factory.api.duplicate_check.duration', Date.now() - start, { outcome: 'failure' });
    return NextResponse.json(
      { _error: error instanceof Error ? error.message : "Access denied" },
      { status: 403 }
    );
  }
}

export const POST = withLogging(handler, { component: 'factory', operation: 'check_duplicates' });
