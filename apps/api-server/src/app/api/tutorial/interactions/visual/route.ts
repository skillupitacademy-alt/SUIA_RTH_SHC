import { db } from '@quiz/db-tutorial';
import { visualInteractions } from '@quiz/db-tutorial';
import { VisualInteractionRequestSchema } from '@quiz/validation';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUserId, getTutorialSection, parseJsonBody, updateProgressForSection } from '../_shared';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tutorial/interactions/visual
 * 
 * Track visual explanation component interaction
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request);
    if (userId instanceof NextResponse) return userId;

    const parsed = await parseJsonBody(request, VisualInteractionRequestSchema);
    if (!parsed.success) return parsed.response;
    const { sectionId, componentId, interactionType, interactionData, timeSpent } = parsed.data;

    const section = await getTutorialSection(sectionId);
    if (!section) {
      return NextResponse.json(
        { error: 'Visual section not found' },
        { status: 404 }
      );
    }
    
    // Insert visual interaction
    const [interaction] = await db
      .insert(visualInteractions)
      .values({
        userId,
        sectionId,
        componentId,
        interactionType,
        interactionData: (interactionData !== undefined && interactionData !== null) ? interactionData : null,
        timeSpent
      })
      .returning();
    const progress = await updateProgressForSection(userId, section);
    
    return NextResponse.json({
      success: true,
      interactionId: interaction.id,
      progress,
      message: 'Interaction tracked successfully'
    });
    
  } catch (error) {
    console.error('[Visual Interaction API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tutorial/interactions/visual?userId=xxx&sectionId=xxx
 * 
 * Get user's visual interactions for a section
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request);
    if (userId instanceof NextResponse) return userId;

    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    const componentId = searchParams.get('componentId');
    
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
      .from(visualInteractions)
      .where(
        and(
          eq(visualInteractions.userId, userId),
          eq(visualInteractions.sectionId, sectionId)
        )
      );
    
    // Filter by specific component if provided
    if (componentId !== null && componentId !== '') {
      query = db
        .select()
        .from(visualInteractions)
        .where(
          and(
            eq(visualInteractions.userId, userId),
            eq(visualInteractions.sectionId, sectionId),
            eq(visualInteractions.componentId, componentId)
          )
        );
    }
    
    const interactions = await query;
    
    // Calculate statistics
    const totalInteractions = interactions.length;
    const totalTimeSpent = interactions.reduce((sum, i) => sum + ((i.timeSpent as number | null) ?? 0), 0);
    const uniqueComponents = new Set(interactions.map(i => i.componentId)).size;
    const interactionsByType = interactions.reduce((acc, i) => {
      acc[i.interactionType] = (acc[i.interactionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return NextResponse.json({
      interactions,
      statistics: {
        totalInteractions,
        totalTimeSpent,
        uniqueComponents,
        interactionsByType
      }
    });
    
  } catch (error) {
    console.error('[Visual Interaction API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
