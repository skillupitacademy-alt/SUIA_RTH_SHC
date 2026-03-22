import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  isTutorialAuthError,
  logRouteError,
  requireAdmin,
  tutorialContentRepository,
} from '@/lib/tutorial-content-api';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  contentId: z.string().uuid().optional(),
  subtopicId: z.string().uuid().optional(),
  action: z.enum(['created', 'updated', 'published', 'unpublished', 'restored']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (error) {
    if (isTutorialAuthError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams.entries()));
  if (!params.success) {
    return NextResponse.json({ error: 'Invalid query', issues: params.error.issues }, { status: 400 });
  }

  try {
    const contentIds = params.data.subtopicId != null
      ? (await tutorialContentRepository.findBySubtopicId(params.data.subtopicId)).map((item) => item.id)
      : params.data.contentId != null
        ? [params.data.contentId]
        : [];

    const audits = contentIds.length > 0
      ? (await Promise.all(contentIds.map(async (contentId) => tutorialContentRepository.getAuditEntries({
        contentId,
        action: params.data.action,
        limit: params.data.limit,
        offset: 0,
      })))).flat()
      : await tutorialContentRepository.getAuditEntries({
        action: params.data.action,
        limit: params.data.limit,
        offset: params.data.offset,
      });

    const entries = [...audits].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()).slice(params.data.offset, params.data.offset + params.data.limit);

    return NextResponse.json(
      {
        data: entries,
        pagination: {
          limit: params.data.limit,
          offset: params.data.offset,
          returned: entries.length,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    );
  } catch (error) {
    logRouteError('Tutorial content audit query failed', error, { route: 'GET /api/tutorial/content/audit' });
    return NextResponse.json({ error: 'Failed to load tutorial content audit log' }, { status: 500 });
  }
}
