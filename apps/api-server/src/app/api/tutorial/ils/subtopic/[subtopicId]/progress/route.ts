/**
 * GET /api/tutorial/ils/subtopic/:subtopicId/progress
 * 
 * Get learning progress for all navigation nodes in a subtopic.
 * 
 * AUTHORIZATION: Self-scoped via authenticated identity
 * BRAND: Scoped via authenticated brand context
 */

import {
  type AuthenticatedIdentity,
  LearningProgressService,
  TutorialNavigationProgressRepository,
  TutorialSectionRepository,
  BlockLearningStateRepository,
} from '@quiz/db-tutorial';
import { NextRequest, NextResponse } from 'next/server';

import { validateRequest } from '@/middleware/internal-auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ subtopicId: string }> }
) {
  try {
    const params = await context.params;
    const subtopicId = params.subtopicId;

    // Validate internal authentication FIRST
    const authValidation = validateRequest(request, { requireInternalSecret: true });
    if (authValidation.error) {
      return authValidation.error;
    }
    
    if (!authValidation.context) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    
    const authContext = authValidation.context;
    
    // Construct authenticated identity from validated context
    const sessionId = request.headers.get('x-session-id');
    const identity: AuthenticatedIdentity = {
      userId: authContext.userId,
      brand: authContext.brand,
      sessionId: sessionId !== null && sessionId !== '' ? sessionId : undefined,
    };

    // Call service
    const progressRepo = new TutorialNavigationProgressRepository();
    const sectionRepo = new TutorialSectionRepository();
    const blockRepo = new BlockLearningStateRepository();
    const service = new LearningProgressService(progressRepo, sectionRepo, blockRepo);

    const progressList = await service.getSubtopicProgress(identity, subtopicId);

    return NextResponse.json(
      { data: progressList },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-cache' },
      }
    );
  } catch (error) {
    console.error('[ILS API] getSubtopicProgress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
