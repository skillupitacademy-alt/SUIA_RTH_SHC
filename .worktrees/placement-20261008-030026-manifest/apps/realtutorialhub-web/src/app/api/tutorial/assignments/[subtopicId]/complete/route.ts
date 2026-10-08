import { NextRequest, NextResponse } from 'next/server';

import { requireAssignmentAccess } from '@/lib/assignment-auth';
import { assignmentCompleteSchema, assignmentService } from '@/lib/assignment';
import { AssignmentTierAlreadyCompletedError, AssignmentTierLockedError } from '@quiz/types';

export const dynamic = 'force-dynamic';

function getStatusCode(error: unknown): number {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const statusCode = (error as { statusCode?: unknown }).statusCode;
    if (typeof statusCode === 'number') {
      return statusCode;
    }
  }

  return 401;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ subtopicId: string }> }
) {
  const params = await context.params;
  let user;
  try {
    user = await requireAssignmentAccess(req, params.subtopicId);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: getStatusCode(error) });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = assignmentCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await assignmentService.completeTier(user.userId, params.subtopicId, parsed.data.difficulty);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    if (error instanceof AssignmentTierLockedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof AssignmentTierAlreadyCompletedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
