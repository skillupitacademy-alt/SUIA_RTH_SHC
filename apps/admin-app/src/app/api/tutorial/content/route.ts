import { db } from '@quiz/db-tutorial';
import { NextRequest, NextResponse } from 'next/server';

import {
  isTutorialAuthError,
  logRouteError,
  normalizeTutorialWritePayload,
  requireAdmin,
  toTutorialContentDTO,
  tutorialContentRepository,
  tutorialContentWriteSchema,
} from '@/lib/tutorial-content-api';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let adminUserId: string | null = null;
  try {
    const admin = await requireAdmin(req);
    adminUserId = admin.userId;
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

  const parsed = tutorialContentWriteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const record = await db.transaction(async (tx) => {
      const repository = tutorialContentRepository.withDb(tx as never);
      const saved = await repository.upsertBlocks(normalizeTutorialWritePayload(parsed.data));
      if (saved == null) {
        throw new Error('Failed to create tutorial content');
      }
      await repository.createAuditEntry({
        contentId: saved.id,
        userId: adminUserId ?? '00000000-0000-0000-0000-000000000000',
        action: 'created',
        diff: { after: saved.content },
      });
      return saved;
    });
    return NextResponse.json({ data: toTutorialContentDTO(record) }, { status: 201 });
  } catch (error) {
    logRouteError('Tutorial content create failed', error, { route: 'POST /api/tutorial/content' });
    return NextResponse.json({ error: 'Failed to create tutorial content' }, { status: 500 });
  }
}
