import { NextRequest, NextResponse } from 'next/server';

import { requireStudent } from '@/lib/assignment-auth';
import { assignmentHelpSchema, assignmentService } from '@/lib/assignment';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await requireStudent(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const parsed = assignmentHelpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    const request = await assignmentService.submitHelpRequest(
      user.userId,
      parsed.data.subtopicId,
      parsed.data.assignmentId,
      parsed.data.question
    );

    return NextResponse.json({ data: request }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
