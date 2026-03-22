import { db, tutorialAssignments } from '@quiz/db-tutorial';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  isTutorialAuthError,
  logRouteError,
  requireAdmin,
} from '@/lib/tutorial-content-api';

export const dynamic = 'force-dynamic';

const publishSchema = z.object({
  subtopicId: z.string().uuid(),
  difficulty: z.enum(['simple', 'mixed', 'intermediate', 'expert']),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (error) {
    if (isTutorialAuthError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = publishSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const publishedCount = await db.transaction(async (tx) => {
      const rows = await tx
        .update(tutorialAssignments)
        .set({
          isPublished: true,
          version: sql`${tutorialAssignments.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tutorialAssignments.subtopicId, parsed.data.subtopicId),
            eq(tutorialAssignments.difficulty, parsed.data.difficulty),
            isNull(tutorialAssignments.deletedAt)
          )
        )
        .returning({ id: tutorialAssignments.id });

      return rows.length;
    });

    return NextResponse.json({ publishedCount });
  } catch (error) {
    logRouteError('Tutorial assignment publish failed', error, { route: 'POST /api/tutorial/assignments/publish' });
    return NextResponse.json({ error: 'Failed to publish assignments' }, { status: 500 });
  }
}
