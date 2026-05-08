import { db } from '@quiz/db-tutorial';
import { codeInteractions, tutorialSections } from '@quiz/db-tutorial';
import { and,eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tutorial/interactions/code
 * 
 * Track code example interaction (execution, modification)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const userId = body.userId as string;
    const sectionId = body.sectionId as string;
    const codeExampleId = body.codeExampleId as string;
    const userCode = body.userCode as string;
    const executed = body.executed as boolean | undefined;
    const executionResult = body.executionResult as { success: boolean; output?: string; error?: string } | undefined;
    const timeSpent = body.timeSpent as number | undefined;
    
    // Validate required fields
    if (
      userId === null || userId === undefined || userId === '' ||
      sectionId === null || sectionId === undefined || sectionId === '' ||
      codeExampleId === null || codeExampleId === undefined || codeExampleId === '' ||
      userCode === null || userCode === undefined || userCode === ''
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify section exists and is a code section
    const section = await db
      .select()
      .from(tutorialSections)
      .where(
        and(
          eq(tutorialSections.id, sectionId),
          eq(tutorialSections.sectionType, 'code')
        )
      )
      .limit(1);
    
    if (section.length === 0) {
      return NextResponse.json(
        { error: 'Code section not found' },
        { status: 404 }
      );
    }
    
    // Insert code interaction
    const [interaction] = await db
      .insert(codeInteractions)
      .values({
        userId,
        sectionId,
        codeExampleId,
        userCode,
        executed: executed === true,
        executionResult: (executionResult !== undefined && executionResult !== null) ? executionResult : null,
        timeSpent: (timeSpent !== undefined && timeSpent !== null) ? timeSpent : 0
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      interactionId: interaction.id,
      message: executed === true ? 'Code executed successfully' : 'Code saved'
    });
    
  } catch (error) {
    console.error('[Code Interaction API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tutorial/interactions/code?userId=xxx&sectionId=xxx
 * 
 * Get user's code interactions for a section
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sectionId = searchParams.get('sectionId');
    const codeExampleId = searchParams.get('codeExampleId');
    
    if (
      userId === null || userId === undefined || userId === '' ||
      sectionId === null || sectionId === undefined || sectionId === ''
    ) {
      return NextResponse.json(
        { error: 'Missing userId or sectionId' },
        { status: 400 }
      );
    }
    
    let query = db
      .select()
      .from(codeInteractions)
      .where(
        and(
          eq(codeInteractions.userId, userId),
          eq(codeInteractions.sectionId, sectionId)
        )
      );
    
    // Filter by specific code example if provided
    if (codeExampleId !== null && codeExampleId !== '') {
      query = db
        .select()
        .from(codeInteractions)
        .where(
          and(
            eq(codeInteractions.userId, userId),
            eq(codeInteractions.sectionId, sectionId),
            eq(codeInteractions.codeExampleId, codeExampleId)
          )
        );
    }
    
    const interactions = await query;
    
    // Calculate statistics
    const totalInteractions = interactions.length;
    const executedCount = interactions.filter(i => i.executed).length;
    const totalTimeSpent = interactions.reduce((sum, i) => sum + ((i.timeSpent as number | null) ?? 0), 0);
    const uniqueExamples = new Set(interactions.map(i => i.codeExampleId)).size;
    
    return NextResponse.json({
      interactions,
      statistics: {
        totalInteractions,
        executedCount,
        totalTimeSpent,
        uniqueExamples
      }
    });
    
  } catch (error) {
    console.error('[Code Interaction API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
