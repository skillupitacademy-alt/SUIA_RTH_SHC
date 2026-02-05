import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { TopicService } from '@/modules/domain/domain.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json({ error: 'topicId is required' }, { status: 400 });
    }

    const subtopics = await TopicService.getSubtopicsByTopic(topicId);
    return NextResponse.json(subtopics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
