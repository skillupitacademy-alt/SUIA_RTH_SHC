/**
 * Tutorial Sections API - Learner Delivery Endpoint
 * 
 * PROMPT 11 — Learner Tutorial Delivery API
 * 
 * GET /api/tutorial/sections/:subtopicId
 * 
 * Enhanced with:
 * - TutorialDeliveryService integration (Prompt 10)
 * - Brand context awareness
 * - Proper error handling with typed errors
 * - Schema validation at trust boundary
 * - No admin-only metadata exposure
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  tutorialDeliveryService,
  SubtopicNotFoundError,
  type DeliveryOptions,
} from '@quiz/db-tutorial';
import type { TutorialDifficulty, SectionType, Brand } from '@quiz/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tutorial/sections/:subtopicId
 * 
 * Query params:
 * - difficulty: simple | intermediate | expert | mixed (default: simple)
 * - sectionType: notes | visual | code | ... (optional, returns all if omitted)
 * 
 * Headers:
 * - X-Brand: realtutorialhub | skillup | skillhubcore (default: shared)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ subtopicId: string }> }
) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const difficultyParam = searchParams.get('difficulty');
    const sectionTypeParam = searchParams.get('sectionType');
    
    // Extract brand context from headers
    const brandHeader = request.headers.get('X-Brand');
    const brandId: Brand = (brandHeader as Brand) || 'shared';
    
    // Build delivery options
    const options: DeliveryOptions = {
      difficulty: (difficultyParam as TutorialDifficulty) || 'simple',
      brandId,
    };
    
    // If specific section type requested
    if (sectionTypeParam) {
      options.sectionType = sectionTypeParam as SectionType;
    }
    
    // Use TutorialDeliveryService
    const delivery = await tutorialDeliveryService.getTutorialBySlug(
      params.subtopicId,
      options
    );
    
    // If single section requested, return simplified response
    if (sectionTypeParam && delivery.sections.length === 1) {
      const section = delivery.sections[0];
      return NextResponse.json({
        subtopicId: params.subtopicId,
        sectionId: section.id,
        sectionType: section.sectionType,
        difficulty: section.difficulty,
        content: section.content,
        version: section.version,
        language: section.language,
      });
    }
    
    // Return all sections
    // Transform to legacy format for backward compatibility
    const sectionsMap: Record<string, unknown> = {};
    const sectionMeta: Record<string, { id: string; version: number; language: string }> = {};
    
    delivery.sections.forEach(section => {
      sectionsMap[section.sectionType] = section.content;
      sectionMeta[section.sectionType] = {
        id: section.id,
        version: section.version,
        language: section.language,
      };
    });
    
    return NextResponse.json({
      subtopicId: params.subtopicId,
      subtopicName: delivery.subtopicName,
      difficulty: delivery.difficulty,
      sections: sectionsMap,
      sectionMeta,
      totalSections: delivery.totalSections,
    });
    
  } catch (error) {
    // Handle typed errors
    if (error instanceof SubtopicNotFoundError) {
      return NextResponse.json(
        { error: 'Subtopic not found' },
        { status: 404 }
      );
    }
    
    // Log unexpected errors
    console.error('[Tutorial Sections API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
