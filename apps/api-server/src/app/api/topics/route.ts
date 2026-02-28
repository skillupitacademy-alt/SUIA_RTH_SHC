import { type NextRequest, NextResponse } from 'next/server';

import { withLogging } from '@/lib/withLogging';
import { TopicService } from '@/modules/domain/domain.service';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const subjectId = searchParams.get('subjectId');

    if (subjectId === null || subjectId === '') {
      return NextResponse.json({ _error: 'subjectId is required' }, { status: 400 });
    }

    const topics = await TopicService.getTopicsBySubject(subjectId);
    return NextResponse.json(topics);
  } catch (_error: unknown) {
    const errorMessage = _error instanceof Error ? _error.message : 'Failed to fetch topics';
    return NextResponse.json({ _error: errorMessage }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'core', operation: 'get_topics' });
