import { db } from '@quiz/db-tutorial';
import { tutorialSections, tutorialSubtopics } from '@quiz/db-tutorial';
import { and,eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tutorial/sections/:subtopicId
 * 
 * Get all sections for a subtopic from database
 * Replaces static file reads from subtopicContentRegistry.ts
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ subtopicId: string }> }
) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const sectionType = searchParams.get('sectionType');
    const difficultyParam = searchParams.get('difficulty');
    const difficulty = (difficultyParam !== null && difficultyParam !== '') ? difficultyParam : 'simple';
    
    // Validate subtopic exists
    const subtopic = await db
      .select()
      .from(tutorialSubtopics)
      .where(eq(tutorialSubtopics.slug, params.subtopicId))
      .limit(1);
    
    if (subtopic.length === 0) {
      return NextResponse.json(
        { error: 'Subtopic not found' },
        { status: 404 }
      );
    }
    
    const subtopicId = subtopic[0].id;
    
    // If specific section type requested
    if (sectionType !== null && sectionType !== '') {
      const section = await db
        .select()
        .from(tutorialSections)
        .where(
          and(
            eq(tutorialSections.subtopicId, subtopicId),
            eq(tutorialSections.sectionType, sectionType as "technical" | "practice" | "layman" | "real_life" | "code" | "notes" | "summary" | "visual" | "assignment" | "project" | "quiz" | "interview"),
            eq(tutorialSections.difficulty, difficulty as "simple" | "intermediate" | "expert" | "mixed"),
            eq(tutorialSections.status, 'approved')
          )
        )
        .limit(1);
      
      if (section.length === 0) {
        return NextResponse.json(
          { error: 'Section not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        subtopicId: params.subtopicId,
        sectionType,
        difficulty,
        content: section[0].content,
        version: section[0].version,
        language: section[0].language
      });
    }
    
    // Get all sections for subtopic
    const sections = await db
      .select()
      .from(tutorialSections)
      .where(
        and(
          eq(tutorialSections.subtopicId, subtopicId),
          eq(tutorialSections.difficulty, difficulty as "simple" | "intermediate" | "expert" | "mixed"),
          eq(tutorialSections.status, 'approved')
        )
      );
    
    // Transform to frontend format
    const sectionsMap: Record<string, unknown> = {};
    sections.forEach(section => {
      sectionsMap[section.sectionType] = section.content;
    });
    
    return NextResponse.json({
      subtopicId: params.subtopicId,
      subtopicName: subtopic[0].name,
      difficulty,
      sections: sectionsMap,
      totalSections: sections.length
    });
    
  } catch (error) {
    console.error('[Tutorial Sections API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
