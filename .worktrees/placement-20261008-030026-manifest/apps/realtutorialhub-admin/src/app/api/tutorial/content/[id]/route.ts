import { db } from '@quiz/db-tutorial';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const parsedParams = idParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      return NextResponse.json({ error: 'Invalid content id' }, { status: 400 });
    }

    const requestUrl = new URL(req.url);
    const difficultyParam = requestUrl.searchParams.get('difficulty');
    const difficulty = difficultyParam === 'simple' || difficultyParam === 'mixed' || difficultyParam === 'intermediate' || difficultyParam === 'expert'
      ? difficultyParam
      : undefined;

    const publishedRows = await tutorialContentRepository.getPublished(parsedParams.data.id, difficulty);
    const record = [...publishedRows].sort((left, right) => right.version - left.version)[0] ?? null;

    return NextResponse.json({ data: record != null ? toTutorialContentDTO(record) : null });
  } catch (error) {
    logRouteError('Tutorial content fetch failed', error, { route: 'GET /api/tutorial/content/[id]' });
    return NextResponse.json({ error: 'Failed to load tutorial content' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
    const record = await db.transaction(async (tx) => {
      const repository = tutorialContentRepository.withDb(tx as never);
      const existing = await repository.findById(parsedParams.data.id);
      if (existing == null) {
        return null;
      }

      const updated = await repository.updateById(
        parsedParams.data.id,
        normalizeTutorialWritePayload(parsed.data)
      );
      if (updated == null) {
        throw new Error('Failed to update tutorial content');
      }

      await repository.createAuditEntry({
        contentId: updated.id,
        userId: adminUserId ?? '00000000-0000-0000-0000-000000000000',
        action: 'updated',
        diff: {
          before: existing.content,
          after: updated.content,
        },
      });

      return updated;
    });
    if (record == null) {
      return NextResponse.json({ error: 'Tutorial content not found' }, { status: 404 });
    }

    return NextResponse.json({ data: toTutorialContentDTO(record) });
  } catch (error) {
    logRouteError('Tutorial content update failed', error, { route: 'PATCH /api/tutorial/content/[id]' });
    return NextResponse.json({ error: 'Failed to update tutorial content' }, { status: 500 });
  }
}
