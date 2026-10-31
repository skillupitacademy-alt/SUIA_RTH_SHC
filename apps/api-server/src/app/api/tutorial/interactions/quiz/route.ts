import { db } from '@quiz/db-tutorial';
import { quizAnswers } from '@quiz/db-tutorial';
import { QuizInteractionRequestSchema } from '@quiz/validation';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { extractCorrectAnswerFromContent, getAuthenticatedUserIdAsync, getTutorialSection, parseJsonBody, updateProgressForSection } from '../_shared';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tutorial/interactions/quiz
 * 
 * Submit quiz answer and track user interaction
 * 
 * 🔐 SECURITY FIX (INT-01): correctAnswer from the client body is no longer
 * used to determine isCorrect. Instead we look up the user's most recent
 * previous correct answer for this question (stored server-side), or fall
 * back to the client value only for the first attempt while logging a warning.
 * 
 * TODO: Resolve correctAnswer from the section content JSONB (TutorialDocument)
 * to eliminate client trust entirely.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserIdAsync(request);
    if (userId instanceof NextResponse) return userId;

    const parsed = await parseJsonBody(request, QuizInteractionRequestSchema);
    if (!parsed.success) return parsed.response;
    const { sectionId, questionId, selectedAnswer, correctAnswer: clientCorrectAnswer, timeSpent } = parsed.data;

    const section = await getTutorialSection(sectionId);
    if (!section) {
      return NextResponse.json(
        { error: 'Quiz section not found' },
        { status: 404 }
      );
    }
    
    // 🔐 SECURITY: Resolve correctAnswer server-side from authoritative section content or DB.
    // Tier 1: Look directly in section content JSONB (authoritative source)
    const contentCorrectAnswer = extractCorrectAnswerFromContent(section.content, questionId);

    // Query previous answers for attempt counting and Tier 2 fallback
    const previousAnswers = await db
      .select()
      .from(quizAnswers)
      .where(
        and(
          eq(quizAnswers.questionId, questionId)
        )
      );
    
    let correctAnswer: string;
    const previousCorrect = previousAnswers.find(a => a.correctAnswer);

    if (contentCorrectAnswer) {
      // Tier 1: Authoritative answer from section JSONB
      correctAnswer = contentCorrectAnswer;
      if (clientCorrectAnswer !== correctAnswer) {
        console.warn('[SECURITY][Quiz] Client sent mismatched correctAnswer against section content', {
          questionId,
          clientValue: clientCorrectAnswer,
          serverValue: correctAnswer,
          userId: typeof userId === 'string' ? userId.slice(0, 8) : 'unknown',
        });
      }
    } else if (previousCorrect) {
      // Tier 2: Use the server-stored correct answer from a previous submission
      correctAnswer = previousCorrect.correctAnswer;
      if (clientCorrectAnswer !== correctAnswer) {
        console.warn('[SECURITY][Quiz] Client sent mismatched correctAnswer against DB history', {
          questionId,
          clientValue: clientCorrectAnswer,
          serverValue: correctAnswer,
          userId: typeof userId === 'string' ? userId.slice(0, 8) : 'unknown',
        });
      }
    } else {
      // Tier 3: First-ever submission with no section/DB definition
      correctAnswer = clientCorrectAnswer;
      console.warn('[SECURITY][Quiz] First submission — accepting client correctAnswer (no server reference yet)', {
        questionId,
        sectionId,
      });
    }

    const isCorrect = selectedAnswer === correctAnswer;
    const attemptNumber = previousAnswers.filter(a => a.userId === userId).length + 1;
    
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
        timeSpent,
        attemptNumber
      })
      .returning();
    const progress = await updateProgressForSection(userId, section);
    
    return NextResponse.json({
      success: true,
      answerId: answer.id,
      isCorrect,
      attemptNumber,
      progress,
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
 * GET /api/tutorial/interactions/quiz?sectionId=xxx
 * 
 * Get user's quiz answers for a section
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserIdAsync(request);
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
