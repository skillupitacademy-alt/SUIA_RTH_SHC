import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  logRouteError,
  requireAdmin,
  toTutorialContentDTO,
  tutorialContentRepository,
} from '@/lib/tutorial-content-api';

export const dynamic = 'force-dynamic';

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(
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

  try {
    const published = await tutorialContentRepository.publish(parsedParams.data.id);
    if (published == null) {
      return NextResponse.json({ error: 'Tutorial content not found' }, { status: 404 });
    }

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
