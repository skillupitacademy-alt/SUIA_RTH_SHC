import { type NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { TopicService } from '@/modules/domain/domain.service';

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const topicId = searchParams.get('topicId');

    if (topicId === null || topicId === '') {
      return NextResponse.json({ _error: 'topicId is required' }, { status: 400 });
    }

    const subtopics = await TopicService.getSubtopicsByTopic(topicId);
    return NextResponse.json(subtopics);
  } catch (_error: unknown) {
    const errorMessage = _error instanceof Error ? _error.message : 'Failed to fetch subtopics';
    return NextResponse.json({ _error: errorMessage }, { status: 500 });
  }
}
