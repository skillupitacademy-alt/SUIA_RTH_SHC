import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  logRouteError,
  normalizeTutorialWritePayload,
  requireAdmin,
  toTutorialContentDTO,
  tutorialContentRepository,
  tutorialContentWriteSchema,
} from '@/lib/tutorial-content-api';

export const dynamic = 'force-dynamic';

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await context.params;
  const parsedParams = idParamsSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid content id' }, { status: 400 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = tutorialContentWriteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const record = await tutorialContentRepository.updateById(
      parsedParams.data.id,
      normalizeTutorialWritePayload(parsed.data)
    );
    if (record == null) {
      return NextResponse.json({ error: 'Tutorial content not found' }, { status: 404 });
    }

    return NextResponse.json({ data: toTutorialContentDTO(record) });
  } catch (error) {
    logRouteError('Tutorial content update failed', error, { route: 'PATCH /api/tutorial/content/[id]' });
    return NextResponse.json({ error: 'Failed to update tutorial content' }, { status: 500 });
  }
}
