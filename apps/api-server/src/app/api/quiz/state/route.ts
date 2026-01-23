import { NextRequest, NextResponse } from 'next/server';
import { QuizEngine } from '@/modules/quiz-engine/quiz.engine';

/**
 * GET QUIZ STATE
 * GET /api/quiz/state?examId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');
    if (!examId) return NextResponse.json({ error: 'examId required' }, { status: 400 });

    const state = await QuizEngine.getQuizState(examId);
    return NextResponse.json(state);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
