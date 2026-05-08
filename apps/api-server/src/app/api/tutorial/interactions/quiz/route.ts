import { db } from '@quiz/db-tutorial';
import { quizAnswers, tutorialSections } from '@quiz/db-tutorial';
import { and,eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tutorial/interactions/quiz
 * 
 * Submit quiz answer and track user interaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const userId = body.userId as string;
    const sectionId = body.sectionId as string;
    const questionId = body.questionId as string;
    const selectedAnswer = body.selectedAnswer as string;
    const correctAnswer = body.correctAnswer as string;
    const timeSpent = body.timeSpent as number | undefined;
    
    // Validate required fields
    if (
      userId === null || userId === undefined || userId === '' ||
      sectionId === null || sectionId === undefined || sectionId === '' ||
      questionId === null || questionId === undefined || questionId === '' ||
      selectedAnswer === null || selectedAnswer === undefined || selectedAnswer === '' ||
      correctAnswer === null || correctAnswer === undefined || correctAnswer === ''
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify section exists and is a quiz section
    const section = await db
      .select()
      .from(tutorialSections)
      .where(
        and(
          eq(tutorialSections.id, sectionId),
          eq(tutorialSections.sectionType, 'quiz')
        )
      )
      .limit(1);
    
    if (section.length === 0) {
      return NextResponse.json(
        { error: 'Quiz section not found' },
        { status: 404 }
      );
    }
    
    const isCorrect = selectedAnswer === correctAnswer;
    
    // Get attempt number (count previous attempts for this question)
    const previousAttempts = await db
      .select()
      .from(quizAnswers)
      .where(
        and(
          eq(quizAnswers.userId, userId),
          eq(quizAnswers.questionId, questionId)
        )
      );
    
    const attemptNumber = previousAttempts.length + 1;
    
    // Insert quiz answer
    const [answer] = await db
      .insert(quizAnswers)
      .values({
        userId,
        sectionId,
        questionId,
        selectedAnswer,
        correctAnswer,
        isCorrect,
        timeSpent: (timeSpent !== undefined && timeSpent !== null) ? timeSpent : 0,
        attemptNumber
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      answerId: answer.id,
      isCorrect,
      attemptNumber,
      message: isCorrect ? 'Correct answer!' : 'Incorrect answer. Try again!'
    });
    
  } catch (error) {
    console.error('[Quiz Interaction API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tutorial/interactions/quiz?userId=xxx&sectionId=xxx
 * 
 * Get user's quiz answers for a section
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sectionId = searchParams.get('sectionId');
    
    if (
      userId === null || userId === undefined || userId === '' ||
      sectionId === null || sectionId === undefined || sectionId === ''
    ) {
      return NextResponse.json(
        { error: 'Missing userId or sectionId' },
        { status: 400 }
      );
    }
    
    const answers = await db
      .select()
      .from(quizAnswers)
      .where(
        and(
          eq(quizAnswers.userId, userId),
          eq(quizAnswers.sectionId, sectionId)
        )
      );
    
    // Calculate statistics
    const totalQuestions = new Set(answers.map(a => a.questionId)).size;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const totalAttempts = answers.length;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
    
    return NextResponse.json({
      answers,
      statistics: {
        totalQuestions,
        correctAnswers,
        totalAttempts,
        score
      }
    });
    
  } catch (error) {
    console.error('[Quiz Interaction API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
