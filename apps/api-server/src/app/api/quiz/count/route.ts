import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { TokenService } from '@/modules/auth/token.service';
import { ExamBlueprintService } from '@/services/exams/ExamBlueprintService';

const blueprintService = new ExamBlueprintService();

/**
 * GET QUESTION COUNT
 * POST /api/quiz/count
 */
export async function POST(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token);
    const { domainId, subjects, topicIds, subtopicIds } = await req.json();

    const counts = await blueprintService.getAvailableCounts({
      domainId,
      subjectIds: subjects,
      topicIds,
      subtopicIds
    });

    return NextResponse.json(counts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

