import { db } from '@quiz/db-tutorial';
import { tutorialSections,visualInteractions } from '@quiz/db-tutorial';
import { and,eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tutorial/interactions/visual
 * 
 * Track visual explanation component interaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const userId = body.userId as string;
    const sectionId = body.sectionId as string;
    const componentId = body.componentId as string;
    const interactionType = body.interactionType as string;
    const interactionData = body.interactionData as Record<string, unknown> | undefined;
    const timeSpent = body.timeSpent as number | undefined;
    
    // Validate required fields
    if (
      userId === null || userId === undefined || userId === '' ||
      sectionId === null || sectionId === undefined || sectionId === '' ||
      componentId === null || componentId === undefined || componentId === '' ||
      interactionType === null || interactionType === undefined || interactionType === ''
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate interaction type
    const validTypes = ['view', 'expand', 'navigate', 'interact'];
    if (!validTypes.includes(interactionType)) {
      return NextResponse.json(
        { error: 'Invalid interaction type' },
        { status: 400 }
      );
    }
    
    // Verify section exists and is a visual section
    const section = await db
      .select()
      .from(tutorialSections)
      .where(
        and(
          eq(tutorialSections.id, sectionId),
          eq(tutorialSections.sectionType, 'visual')
        )
      )
      .limit(1);
    
    if (section.length === 0) {
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
        timeSpent: (timeSpent !== undefined && timeSpent !== null) ? timeSpent : 0
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      interactionId: interaction.id,
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sectionId = searchParams.get('sectionId');
    const componentId = searchParams.get('componentId');
    
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
