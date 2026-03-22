import { AssignmentRepository } from '@quiz/db-tutorial';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { isTutorialAuthError, requireAdmin } from '@/lib/tutorial-content-api';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  resolvedAt: z.union([z.string(), z.date(), z.null()]).optional(),
});

const repository = new AssignmentRepository();

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<unknown> }
) {
  try {
    await requireAdmin(req);
  } catch (error) {
    if (isTutorialAuthError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = (await context.params) as { id?: string };
  if (params.id === undefined || params.id === '') {
    return NextResponse.json({ error: 'Missing help request id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const data = await repository.updateHelpRequest(params.id, {
    status: parsed.data.status,
    assignedTo: parsed.data.assignedTo ?? undefined,
    resolvedAt:
      parsed.data.resolvedAt == null
        ? undefined
        : parsed.data.resolvedAt instanceof Date
          ? parsed.data.resolvedAt
          : new Date(parsed.data.resolvedAt),
  });

  if (data === undefined) {
    return NextResponse.json({ error: 'Help request not found' }, { status: 404 });
  }

  return NextResponse.json({ data }, { status: 200 });
}
