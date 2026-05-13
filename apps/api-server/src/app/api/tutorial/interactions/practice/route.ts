import { db } from '@quiz/db-tutorial';
import { practiceTestAnswers } from '@quiz/db-tutorial';
import { PracticeInteractionRequestSchema } from '@quiz/validation';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUserId, getTutorialSection, parseJsonBody, updateProgressForSection } from '../_shared';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tutorial/interactions/practice
 * 
 * Submit practice test answer and track user interaction
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request);
    if (userId instanceof NextResponse) return userId;

    const parsed = await parseJsonBody(request, PracticeInteractionRequestSchema);
    if (!parsed.success) return parsed.response;
    const { sectionId, questionId, selectedAnswer, correctAnswer, timeSpent, feedbackViewed } = parsed.data;

    const section = await getTutorialSection(sectionId, 'practice');
    if (!section) {
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
        timeSpent,
        attemptNumber,
        feedbackViewed
      })
      .returning();
    const progress = await updateProgressForSection(userId, section);
    
    return NextResponse.json({
      success: true,
      answerId: answer.id,
      isCorrect,
      attemptNumber,
      progress,
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
    const userId = getAuthenticatedUserId(request);
    if (userId instanceof NextResponse) return userId;

    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    
    if (
      sectionId === null || sectionId === undefined || sectionId === ''
    ) {
      return NextResponse.json(
        { error: 'Missing sectionId' },
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
