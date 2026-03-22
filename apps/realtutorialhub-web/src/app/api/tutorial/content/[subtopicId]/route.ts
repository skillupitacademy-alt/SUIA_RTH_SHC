import { NextRequest, NextResponse } from 'next/server';

import { getTutorialContentBySubtopicId } from '@/lib/tutorial-content-api';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ subtopicId: string }> }
) {
  const params = await context.params;
  const content = await getTutorialContentBySubtopicId(params.subtopicId);

  if (content == null) {
    return NextResponse.json({ error: 'Tutorial content not found' }, { status: 404 });
  }

  const response = NextResponse.json({ data: content });
  response.headers.set('Cache-Control', 'public, max-age=3600');
  return response;
}
