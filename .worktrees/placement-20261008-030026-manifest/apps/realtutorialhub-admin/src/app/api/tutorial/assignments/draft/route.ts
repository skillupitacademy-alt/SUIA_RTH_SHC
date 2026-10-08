import { db, tutorialAssignments } from '@quiz/db-tutorial';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { AssignmentSchema } from '@/lib/factory/assignment-schema';
import {
  isTutorialAuthError,
  logRouteError,
  requireAdmin,
} from '@/lib/tutorial-content-api';

export const dynamic = 'force-dynamic';

const draftSchema = z.object({
  subtopicId: z.string().uuid(),
  difficulty: z.enum(['simple', 'mixed', 'intermediate', 'expert']),
  assignments: AssignmentSchema.shape.assignments,
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

  const parsed = draftSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const draftId = await db.transaction(async (tx) => {
      const rows = await Promise.all(
        parsed.data.assignments.map(async (assignment, index) => {
          const [row] = await tx
            .insert(tutorialAssignments)
            .values({
              subtopicId: parsed.data.subtopicId,
              difficulty: parsed.data.difficulty,
              questionType: assignment.question_type,
              question: assignment.question,
              hints: assignment.hints,
              referenceAnswer: assignment.reference_answer,
              title: `Assignment ${index + 1}`,
              content: assignment,
              orderIndex: index,
              points: 10,
              timeLimitSec: null,
              isPublished: false,
              version: 1,
              deletedAt: null,
            })
            .returning();

          return row;
        })
      );

      return rows[0]?.id ?? null;
    });

    return NextResponse.json({ draftId }, { status: 201 });
  } catch (error) {
    logRouteError('Tutorial assignment draft failed', error, { route: 'POST /api/tutorial/assignments/draft' });
    return NextResponse.json({ error: 'Failed to save assignment draft' }, { status: 500 });
  }
}
