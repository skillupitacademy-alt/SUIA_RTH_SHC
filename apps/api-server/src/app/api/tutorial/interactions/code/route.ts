import { db } from '@quiz/db-tutorial';
import { codeInteractions } from '@quiz/db-tutorial';
import { CodeInteractionRequestSchema } from '@quiz/validation';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUserId, getTutorialSection, parseJsonBody, updateProgressForSection } from '../_shared';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tutorial/interactions/code
 * 
 * Track code example interaction (execution, modification)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request);
    if (userId instanceof NextResponse) return userId;

    const parsed = await parseJsonBody(request, CodeInteractionRequestSchema);
    if (!parsed.success) return parsed.response;
    const { sectionId, codeExampleId, userCode, executed, executionResult, timeSpent } = parsed.data;

    const section = await getTutorialSection(sectionId, 'code');
    if (!section) {
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
        executed,
        executionResult: (executionResult !== undefined && executionResult !== null) ? executionResult : null,
        timeSpent
      })
      .returning();
    const progress = await updateProgressForSection(userId, section);
    
    return NextResponse.json({
      success: true,
      interactionId: interaction.id,
      progress,
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
    const userId = getAuthenticatedUserId(request);
    if (userId instanceof NextResponse) return userId;

    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    const codeExampleId = searchParams.get('codeExampleId');
    
    if (
      sectionId === null || sectionId === undefined || sectionId === ''
    ) {
      return NextResponse.json(
        { error: 'Missing sectionId' },
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
