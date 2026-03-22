import { NextRequest, NextResponse } from 'next/server';

import { requireStudent } from '@/lib/assignment-auth';
import { assignmentCompleteSchema, assignmentService } from '@/lib/assignment';

export const dynamic = 'force-dynamic';

export async function POST(
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

  const result = await assignmentService.completeTier(user.userId, params.subtopicId, parsed.data.difficulty);
  return NextResponse.json({ data: result }, { status: 200 });
}
