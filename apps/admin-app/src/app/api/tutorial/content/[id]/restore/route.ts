import { db } from '@quiz/db-tutorial';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  isTutorialAuthError,
  logRouteError,
  requireAdmin,
  toTutorialContentDTO,
  tutorialContentRepository,
} from '@/lib/tutorial-content-api';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  versionId: z.string().uuid(),
});

export async function POST(
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

  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: 'Invalid content id' }, { status: 400 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const restored = await db.transaction(async (tx) => {
      const repository = tutorialContentRepository.withDb(tx as never);
      const current = await repository.findById(params.data.id);
      if (current == null) {
        return null;
      }

      const snapshot = await repository.getVersionSnapshot(parsed.data.versionId);
      if (snapshot == null || snapshot.contentId !== current.id) {
        return null;
      }

      const updated = await repository.updateById(current.id, {
        subtopicId: current.subtopicId,
        difficulty: current.difficulty,
        content: snapshot.content,
        language: current.language,
        isPublished: false,
        generatedByAi: current.generatedByAi,
        aiModelUsed: current.aiModelUsed,
        generationJobId: current.generationJobId,
        adminApprovedBy: adminUserId ?? current.adminApprovedBy,
        adminApprovedAt: current.adminApprovedAt,
        qualityScore: current.qualityScore,
      });

      if (updated == null) {
        throw new Error('Failed to restore tutorial content');
      }

      await repository.createAuditEntry({
        contentId: current.id,
        userId: adminUserId ?? '00000000-0000-0000-0000-000000000000',
        action: 'restored',
        diff: { versionId: snapshot.id, restoredVersion: snapshot.version },
      });

      return updated;
    });

    if (restored == null) {
      return NextResponse.json({ error: 'Tutorial content not found' }, { status: 404 });
    }

    return NextResponse.json({ data: toTutorialContentDTO(restored) });
  } catch (error) {
    logRouteError('Tutorial content restore failed', error, { route: 'POST /api/tutorial/content/[id]/restore' });
    return NextResponse.json({ error: 'Failed to restore tutorial content' }, { status: 500 });
  }
}
