import { db } from '@quiz/db-tutorial';
import { PlatformEventTypes, publishEvent } from '@quiz/events';
import { revalidateTag } from 'next/cache';
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

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

const getWorkerBaseUrl = () => {
  const publicUrl = process.env.NEXT_PUBLIC_WEB_APP_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const internalUrl = process.env.INTERNAL_API_URL;
  if (typeof publicUrl === 'string' && publicUrl.trim().length > 0) return publicUrl.trim();
  if (typeof appUrl === 'string' && appUrl.trim().length > 0) return appUrl.trim();
  if (typeof internalUrl === 'string' && internalUrl.trim().length > 0) return internalUrl.trim();
  return 'http://localhost:3003';
};

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

  const params = await context.params;
  const parsedParams = idParamsSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid content id' }, { status: 400 });
  }

  try {
    const published = await db.transaction(async (tx) => {
      const repository = tutorialContentRepository.withDb(tx as never);
      const current = await repository.findById(parsedParams.data.id);
      if (current == null) {
        return null;
      }

      await repository.createVersionSnapshot({
        contentId: current.id,
        version: current.version,
        content: current.content,
        savedBy: adminUserId ?? '00000000-0000-0000-0000-000000000000',
      });

      await repository.createAuditEntry({
        contentId: current.id,
        userId: adminUserId ?? '00000000-0000-0000-0000-000000000000',
        action: 'published',
        diff: { before: current.isPublished, after: true, version: current.version },
      });

      const published = await repository.publish(parsedParams.data.id);
      if (published == null) {
        throw new Error('Failed to publish tutorial content');
      }

      return published;
    });
    if (published == null) {
      return NextResponse.json({ error: 'Tutorial content not found' }, { status: 404 });
    }

    await publishEvent(
      PlatformEventTypes.CONTENT_APPROVED_AND_PUBLISHED,
      {
        subtopicId: published.subtopicId,
        approvedBy: adminUserId ?? '00000000-0000-0000-0000-000000000000',
        publishedAt: published.updatedAt.toISOString(),
        version: published.version,
      },
      {
        destinationUrl: new URL('/api/workers/index-content-vector', getWorkerBaseUrl()).toString(),
        source: 'admin-app',
      }
    );

    revalidateTag(`tutorial-content:${published.subtopicId}`, 'max');
    revalidateTag('tutorial-content', 'max');

    return NextResponse.json({
      data: toTutorialContentDTO(published),
      revalidated: true,
    });
  } catch (error) {
    logRouteError('Tutorial content publish failed', error, { route: 'POST /api/tutorial/content/[id]/publish' });
    return NextResponse.json({ error: 'Failed to publish tutorial content' }, { status: 500 });
  }
}
