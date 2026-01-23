import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { QuizEngine } from '@/modules/quiz-engine/quiz.engine';
import { TokenService } from '@/modules/auth/token.service';

/**
 * START QUIZ
 * POST /api/quiz/start
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token);
    const { blueprintId } = await req.json();

    const exam = await QuizEngine.startQuiz(payload.userId, blueprintId);
    return NextResponse.json(exam);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
