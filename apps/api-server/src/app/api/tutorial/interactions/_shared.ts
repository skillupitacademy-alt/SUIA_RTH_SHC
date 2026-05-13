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

export async function getTutorialSection(sectionId: string, sectionType?: string): Promise<TutorialSectionRow | undefined> {
  const conditions = sectionType !== undefined && sectionType !== ''
    ? and(eq(tutorialSections.id, sectionId), eq(tutorialSections.sectionType, sectionType as TutorialSectionRow['sectionType']))
    : eq(tutorialSections.id, sectionId);

  const rows = await db
    .select()
    .from(tutorialSections)
    .where(conditions)
    .limit(1);

  return rows[0];
}

export async function updateProgressForSection(userId: string, section: { subtopicId: string; sectionType: string }) {
  if (!isTutorialMasterySection(section.sectionType)) {
    return calculateTutorialProgress({ completedSections: [] });
  }

  const progressRepo = new TutorialProgressRepository();
  const progress = await progressRepo.markBlockComplete(userId, section.subtopicId, section.sectionType);
  return calculateTutorialProgress({ completedSections: progress.blocksCompleted });
}
