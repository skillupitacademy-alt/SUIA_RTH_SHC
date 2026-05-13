import { db } from '@quiz/db-tutorial';
import { sectionCompletions } from '@quiz/db-tutorial';
import { CompletionInteractionRequestSchema } from '@quiz/validation';
import { and, eq, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUserId, getTutorialSection, parseJsonBody, updateProgressForSection } from '../_shared';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tutorial/interactions/completion
 * 
 * Mark section or subsection as completed
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request);
    if (userId instanceof NextResponse) return userId;

    const parsed = await parseJsonBody(request, CompletionInteractionRequestSchema);
    if (!parsed.success) return parsed.response;
    const { sectionId, subsectionId, timeSpent, score } = parsed.data;

    const section = await getTutorialSection(sectionId);
    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }
    
    // Check if already completed
    const existing = await db
      .select()
      .from(sectionCompletions)
      .where(
        and(
          eq(sectionCompletions.userId, userId),
          eq(sectionCompletions.sectionId, sectionId),
          (subsectionId !== undefined && subsectionId !== null) 
            ? eq(sectionCompletions.subsectionId, subsectionId) 
            : isNull(sectionCompletions.subsectionId)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      const progress = await updateProgressForSection(userId, section);
      return NextResponse.json({
        success: true,
        message: 'Already completed',
        completionId: existing[0].id,
        alreadyCompleted: true,
        progress
      });
    }
    
    // Insert completion record
    const [completion] = await db
      .insert(sectionCompletions)
      .values({
        userId,
        sectionId,
        subsectionId: (subsectionId !== undefined && subsectionId !== null) ? subsectionId : null,
        timeSpent,
        score: (score !== undefined && score !== null) ? score : null
      })
      .returning();
    const progress = await updateProgressForSection(userId, section);
    
    return NextResponse.json({
      success: true,
      completionId: completion.id,
      message: 'Section completed successfully',
      alreadyCompleted: false,
      progress
    });
    
  } catch (error) {
    console.error('[Section Completion API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tutorial/interactions/completion?userId=xxx&sectionId=xxx
 * 
 * Get user's completion status for a section
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
    
    const completions = await db
      .select()
      .from(sectionCompletions)
      .where(
        and(
          eq(sectionCompletions.userId, userId),
          eq(sectionCompletions.sectionId, sectionId)
        )
      );
    
    const isCompleted = completions.length > 0;
    const totalTimeSpent = completions.reduce((sum, c) => sum + ((c.timeSpent as number | null) ?? 0), 0);
    const averageScore = completions.length > 0
      ? completions.reduce((sum, c) => sum + ((c.score as number | null) ?? 0), 0) / completions.length
      : null;
    
    return NextResponse.json({
      isCompleted,
      completions,
      statistics: {
        totalCompletions: completions.length,
        totalTimeSpent,
        averageScore
      }
    });
    
  } catch (error) {
    console.error('[Section Completion API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
