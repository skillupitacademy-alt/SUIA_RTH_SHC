import { AssignmentRepository } from '@quiz/db-tutorial';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { isTutorialAuthError, requireAdmin } from '@/lib/tutorial-content-api';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  subtopicId: z.string().uuid().optional(),
});

const repository = new AssignmentRepository();

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (error) {
    if (isTutorialAuthError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    status: req.nextUrl.searchParams.get('status') ?? undefined,
    subtopicId: req.nextUrl.searchParams.get('subtopicId') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', issues: parsed.error.issues }, { status: 400 });
  }

  const data = await repository.getHelpRequests({
    status: parsed.data.status,
    subtopicId: parsed.data.subtopicId,
  });

  return NextResponse.json({ data }, { status: 200 });
}
