import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { TopicService } from '@/modules/domain/domain.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');

    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId is required' }, { status: 400 });
    }

    const topics = await TopicService.getTopicsBySubject(subjectId);
    return NextResponse.json(topics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
