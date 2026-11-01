// Temporarily unused during V2 migration - will be used for block-level progress
// import { TutorialProgressRepository } from '@quiz/db-tutorial';
// import { isTutorialMasterySection } from '@quiz/validation';
// import { and } from 'drizzle-orm';

import { db, tutorialSections } from '@quiz/db-tutorial';
import { calculateTutorialProgress } from '@quiz/validation';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthContext } from '@/lib/auth-context';

/**
 * 🔐 SECURITY (INT-01c): Synchronous header-based authentication is explicitly denied.
 * All tutorial interaction callers MUST use getAuthenticatedUserIdAsync() which
 * validates via internal secret, gateway headers, or JWT.
 */
export function getAuthenticatedUserId(_request: NextRequest): NextResponse {
  return NextResponse.json(
    {
      error: 'Synchronous header-based authentication is not supported. Use getAuthenticatedUserIdAsync.',
    },
    { status: 401 }
  );
}

/**
 * Async version that performs full auth context validation (JWT or internal).
 * Prefer this in new code; the sync version above is kept for backward compat.
 */
export async function getAuthenticatedUserIdAsync(request: NextRequest): Promise<string | NextResponse> {
  const authCtx = await getAuthContext(request);
  if (authCtx === null) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return authCtx.userId;
}

export async function parseJsonBody<T>(
  request: NextRequest,
  schema: z.ZodType<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 }),
    };
  }

  return { success: true, data: parsed.data };
}

type TutorialSectionRow = typeof tutorialSections.$inferSelect;

/**
 * Get tutorial section by ID
 * V2 MIGRATION: Removed sectionType filtering (legacy column)
 */
export async function getTutorialSection(sectionId: string): Promise<TutorialSectionRow | undefined> {
  const rows = await db
    .select()
    .from(tutorialSections)
    .where(eq(tutorialSections.id, sectionId))
    .limit(1);

  return rows[0];
}

/**
 * Update progress for section
 * V2 MIGRATION: sectionType-based progress tracking is legacy
 * TODO: Migrate to V2 block-based progress tracking
 */
export async function updateProgressForSection(_userId: string, _section: { subtopicId: string }) {
  // Legacy mastery tracking temporarily disabled during V2 migration
  // Will be replaced with block-level progress tracking
  return calculateTutorialProgress({ completedSections: [] });
}

/**
 * 🔐 SECURITY (INT-01 / Quiz answer verification):
 * Recursively search tutorial section JSONB content for a question's correctAnswer.
 */
export function extractCorrectAnswerFromContent(content: unknown, questionId: string): string | undefined {
  if (content === null || content === undefined || typeof content !== 'object') {
    return undefined;
  }

  const obj = content as Record<string, unknown>;

  // Direct match: id === questionId or questionId === questionId
  const matchesId = obj.id === questionId || obj.questionId === questionId;
  if (matchesId && typeof obj.correctAnswer === 'string' && obj.correctAnswer.trim().length > 0) {
    return obj.correctAnswer.trim();
  }

  // Nested in content property
  if (obj.content && typeof obj.content === 'object') {
    const fromNested = extractCorrectAnswerFromContent(obj.content, questionId);
    if (fromNested) return fromNested;
  }

  // If array, search each element
  if (Array.isArray(content)) {
    for (const item of content) {
      const found = extractCorrectAnswerFromContent(item, questionId);
      if (found) return found;
    }
  } else {
    // If object, search all values
    for (const val of Object.values(obj)) {
      if (typeof val === 'object' && val !== null) {
        const found = extractCorrectAnswerFromContent(val, questionId);
        if (found) return found;
      }
    }
  }

  return undefined;
}
