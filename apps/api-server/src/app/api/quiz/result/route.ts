import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db, exams } from '@quiz/db';
import { eq } from 'drizzle-orm';

/**
 * GET QUIZ RESULT
 * GET /api/quiz/result?examId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');
    if (!examId) return NextResponse.json({ error: 'examId required' }, { status: 400 });

    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: {
        dimensions: true,
      }
    });

    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    if (exam.status !== 'completed') return NextResponse.json({ error: 'Exam not completed' }, { status: 400 });

    return NextResponse.json(exam);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
