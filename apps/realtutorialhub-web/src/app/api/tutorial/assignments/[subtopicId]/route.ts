import { NextRequest, NextResponse } from 'next/server';

import { requireStudent } from '@/lib/assignment-auth';
import { assignmentDifficultySchema, assignmentService } from '@/lib/assignment';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ subtopicId: string }> }
) {
  let user;
  try {
    user = await requireStudent(req);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }

  const params = await context.params;
  const difficulty = assignmentDifficultySchema.safeParse(req.nextUrl.searchParams.get('difficulty'));
  if (!difficulty.success) {
    return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 });
  }

  const result = await assignmentService.getAssignmentsForSubtopic(
    user.userId,
    params.subtopicId,
    difficulty.data
  );

  return NextResponse.json({ data: result }, { status: 200 });
}
