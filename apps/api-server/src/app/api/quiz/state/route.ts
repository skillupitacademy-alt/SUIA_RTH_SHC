import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { QuizEngine } from '@/modules/quiz-engine/quiz.engine';
import { TokenService } from '@/modules/auth/token.service';

/**
 * GET QUIZ STATE
 * GET /api/quiz/state?examId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token);
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');
    if (!examId) return NextResponse.json({ error: 'examId required' }, { status: 400 });

    const state = await QuizEngine.getQuizState(examId, payload.userId);
    return NextResponse.json(state);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
