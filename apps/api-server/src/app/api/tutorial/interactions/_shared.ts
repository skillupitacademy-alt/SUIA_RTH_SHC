import { db, TutorialProgressRepository, tutorialSections } from '@quiz/db-tutorial';
import { calculateTutorialProgress, isTutorialMasterySection } from '@quiz/validation';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export function getAuthenticatedUserId(request: NextRequest): string | NextResponse {
  const userId = request.headers.get('x-user-id');
  if (userId === null || userId === '') {
    return NextResponse.json({ error: 'Authenticated X-User-ID required' }, { status: 401 });
  }
  return userId;
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
export async function updateProgressForSection(userId: string, section: { subtopicId: string }) {
  // Legacy mastery tracking temporarily disabled during V2 migration
  // Will be replaced with block-level progress tracking
  return calculateTutorialProgress({ completedSections: [] });
}
