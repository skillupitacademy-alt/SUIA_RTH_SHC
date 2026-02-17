import { db, questions } from "@quiz/db";
import { and,eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { logger } from "@/lib/logger";
import { TokenService } from "@/modules/auth/token.service";

interface DuplicateCheckPayload {
  questions: { questionText: string }[];
  topicId: string;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Defense-in-Depth Admin Check (P0-SEC-002)
    const token = TokenService.getAccessToken(req, { scope: 'admin' });
    if (token === undefined || token === null || token === '') {
      return NextResponse.json({ _error: "Authentication required", scope: 'admin' }, { status: 401 });
    }

    await TokenService.verifyAccessToken(token, true);

    const { questions: checkQuestions, topicId } = (await req.json()) as DuplicateCheckPayload;

    if (checkQuestions === undefined || checkQuestions === null || checkQuestions.length === 0 || topicId === undefined || topicId === null || topicId === '') {
      return NextResponse.json({ _error: "Invalid payload" }, { status: 400 });
    }

    // 1. Fetch all existing question texts for this topic
    const existingQuestions = await db
      .select({ id: questions.id, text: questions.questionText })
      .from(questions)
      .where(and(
        eq(questions.topicId, topicId),
        eq(questions.status, "active")
      ));

    // 2. Normalize helper
    const normalize = (text: string) => text.toLowerCase().trim().replace(/\s+/g, ' ');

    // 3. Create Map of Normalized Text -> ID
    const existingMap = new Map<string, string>();
    existingQuestions.forEach(q => {
        existingMap.set(normalize(q.text), q.id);
    });

    // 4. Check inputs
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

    return NextResponse.json({
      details: duplicates,
      foundCount: duplicates.length
    });

  } catch (error) {
    logger.error({ err: error }, "Duplicate Check Error");
    return NextResponse.json(
      { _error: error instanceof Error ? error.message : "Access denied" },
      { status: 403 }
    );
  }
}
