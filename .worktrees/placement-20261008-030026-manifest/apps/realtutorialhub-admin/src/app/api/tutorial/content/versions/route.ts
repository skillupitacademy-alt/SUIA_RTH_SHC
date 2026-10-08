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
  subtopicId: z.string().uuid().optional(),
  contentId: z.string().uuid().optional(),
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
    const contentRows = params.data.contentId != null
      ? await tutorialContentRepository.findById(params.data.contentId).then((row) => (row != null ? [row] : []))
      : params.data.subtopicId != null
        ? await tutorialContentRepository.findBySubtopicId(params.data.subtopicId)
        : [];

    const snapshots = [];
    for (const content of contentRows) {
      const rows = await tutorialContentRepository.getVersionSnapshots(content.id);
      snapshots.push(...rows.map((snapshot) => ({
        ...snapshot,
        subtopicId: content.subtopicId,
        difficulty: content.difficulty,
      })));
    }

    const ordered = [...snapshots].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    const offset = params.data.offset;
    const limit = params.data.limit;
    const items = ordered.slice(offset, offset + limit);

    return NextResponse.json(
      {
        data: items,
        pagination: {
          limit,
          offset,
          returned: items.length,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    );
  } catch (error) {
    logRouteError('Tutorial content versions query failed', error, { route: 'GET /api/tutorial/content/versions' });
    return NextResponse.json({ error: 'Failed to load tutorial content versions' }, { status: 500 });
  }
}

