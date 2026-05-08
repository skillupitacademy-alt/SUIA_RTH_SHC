import { db } from '@quiz/db-tutorial';
import { sectionCompletions, tutorialProgress,tutorialSections } from '@quiz/db-tutorial';
import { and,eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tutorial/interactions/completion
 * 
 * Mark section or subsection as completed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const userId = body.userId as string;
    const sectionId = body.sectionId as string;
    const subsectionId = body.subsectionId as string | undefined;
    const timeSpent = body.timeSpent as number | undefined;
    const score = body.score as number | undefined;
    
    // Validate required fields
    if (
      userId === null || userId === undefined || userId === '' ||
      sectionId === null || sectionId === undefined || sectionId === ''
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify section exists
    const section = await db
      .select()
      .from(tutorialSections)
      .where(eq(tutorialSections.id, sectionId))
      .limit(1);
    
    if (section.length === 0) {
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
            : eq(sectionCompletions.subsectionId, null as unknown as string)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Already completed',
        completionId: existing[0].id,
        alreadyCompleted: true
      });
    }
    
    // Insert completion record
    const [completion] = await db
      .insert(sectionCompletions)
      .values({
        userId,
        sectionId,
        subsectionId: (subsectionId !== undefined && subsectionId !== null) ? subsectionId : null,
        timeSpent: (timeSpent !== undefined && timeSpent !== null) ? timeSpent : 0,
        score: (score !== undefined && score !== null) ? score : null
      })
      .returning();
    
    // Update tutorial_progress table
    const subtopicId = section[0].subtopicId;
    const sectionType = section[0].sectionType;
    
    // Get or create progress record
    const progressRecord = await db
      .select()
      .from(tutorialProgress)
      .where(
        and(
          eq(tutorialProgress.userId, userId),
          eq(tutorialProgress.subtopicId, subtopicId)
        )
      )
      .limit(1);
    
    if (progressRecord.length === 0) {
      // Create new progress record
      await db
        .insert(tutorialProgress)
        .values({
          userId,
          subtopicId,
          status: 'in_progress',
          blocksCompleted: [sectionType],
          timeSpentSec: (timeSpent !== undefined && timeSpent !== null) ? timeSpent : 0
        });
    } else {
      // Update existing progress
      const currentBlocks = (progressRecord[0].blocksCompleted as string[] | null) ?? [];
      if (!currentBlocks.includes(sectionType)) {
        currentBlocks.push(sectionType);
      }
      
      await db
        .update(tutorialProgress)
        .set({
          blocksCompleted: currentBlocks,
          timeSpentSec: ((progressRecord[0].timeSpentSec as number | null) ?? 0) + ((timeSpent as number | null) ?? 0),
          status: currentBlocks.length >= 10 ? 'completed' : 'in_progress',
          updatedAt: new Date()
        })
        .where(eq(tutorialProgress.id, progressRecord[0].id));
    }
    
    return NextResponse.json({
      success: true,
      completionId: completion.id,
      message: 'Section completed successfully',
      alreadyCompleted: false
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
