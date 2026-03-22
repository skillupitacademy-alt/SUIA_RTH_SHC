import { NextRequest, NextResponse } from 'next/server';

import {
  logRouteError,
  normalizeTutorialWritePayload,
  requireAdmin,
  toTutorialContentDTO,
  tutorialContentRepository,
  tutorialContentWriteSchema,
} from '@/lib/tutorial-content-api';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const record = await tutorialContentRepository.upsertBlocks(normalizeTutorialWritePayload(parsed.data));
    return NextResponse.json({ data: toTutorialContentDTO(record) }, { status: 201 });
  } catch (error) {
    logRouteError('Tutorial content create failed', error, { route: 'POST /api/tutorial/content' });
    return NextResponse.json({ error: 'Failed to create tutorial content' }, { status: 500 });
  }
}
