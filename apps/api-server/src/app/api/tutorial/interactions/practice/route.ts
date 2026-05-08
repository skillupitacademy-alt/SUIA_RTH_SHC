import { db } from '@quiz/db-tutorial';
import { practiceTestAnswers, tutorialSections } from '@quiz/db-tutorial';
import { and,eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tutorial/interactions/practice
 * 
 * Submit practice test answer and track user interaction
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
    const feedbackViewed = body.feedbackViewed as boolean | undefined;
    
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
    
    // Verify section exists and is a practice section
    const section = await db
      .select()
      .from(tutorialSections)
      .where(
        and(
          eq(tutorialSections.id, sectionId),
          eq(tutorialSections.sectionType, 'practice')
        )
      )
      .limit(1);
    
    if (section.length === 0) {
      return NextResponse.json(
        { error: 'Practice section not found' },
        { status: 404 }
      );
    }
    
    const isCorrect = selectedAnswer === correctAnswer;
    
    // Get attempt number
    const previousAttempts = await db
      .select()
      .from(practiceTestAnswers)
      .where(
        and(
          eq(practiceTestAnswers.userId, userId),
          eq(practiceTestAnswers.questionId, questionId)
        )
      );
    
    const attemptNumber = previousAttempts.length + 1;
    
    // Insert practice test answer
    const [answer] = await db
      .insert(practiceTestAnswers)
      .values({
        userId,
        sectionId,
        questionId,
        selectedAnswer,
        correctAnswer,
        isCorrect,
        timeSpent: (timeSpent !== undefined && timeSpent !== null) ? timeSpent : 0,
        attemptNumber,
        feedbackViewed: feedbackViewed === true
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      answerId: answer.id,
      isCorrect,
      attemptNumber,
      message: isCorrect ? 'Correct! Great job!' : 'Not quite right. Review the feedback and try again.'
    });
    
  } catch (error) {
    console.error('[Practice Test Interaction API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tutorial/interactions/practice?userId=xxx&sectionId=xxx
 * 
 * Get user's practice test answers for a section
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
      .from(practiceTestAnswers)
      .where(
        and(
          eq(practiceTestAnswers.userId, userId),
          eq(practiceTestAnswers.sectionId, sectionId)
        )
      );
    
    // Calculate statistics
    const totalQuestions = new Set(answers.map(a => a.questionId)).size;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const totalAttempts = answers.length;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
    const feedbackViewedCount = answers.filter(a => a.feedbackViewed).length;
    
    return NextResponse.json({
      answers,
      statistics: {
        totalQuestions,
        correctAnswers,
        totalAttempts,
        score,
        feedbackViewedCount
      }
    });
    
  } catch (error) {
    console.error('[Practice Test Interaction API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
