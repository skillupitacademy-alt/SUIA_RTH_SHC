/**
 * POST /api/tutorial/ils/complete-node
 * 
 * Complete a navigation node.
 * 
 * SECURITY:
 * - Does NOT accept requiredBlocks from client
 * - Server resolves canonical requirements
 * - Evaluates completion policy server-side
 * 
 * AUTHORIZATION: Self-scoped via authenticated identity
 * BRAND: Scoped via authenticated brand context
 */

import {
  type AuthenticatedIdentity,
  InvalidNavigationHierarchyError,
  LearningProgressError,
  LearningProgressService,
  NavigationNodeNotFoundError,
  TutorialNavigationProgressRepository,
  TutorialSectionRepository,
} from '@quiz/db-tutorial';
import { NextRequest, NextResponse } from 'next/server';

import { validateRequest } from '@/middleware/internal-auth.middleware';
import { completeNodeBodySchema } from '@/schemas/ils.schemas';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
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
    
    const { context } = authValidation;
    
    // Construct authenticated identity from validated context
    const sessionId = request.headers.get('x-session-id');
    const identity: AuthenticatedIdentity = {
      userId: context.userId,
      brand: context.brand,
      sessionId: sessionId !== null && sessionId !== '' ? sessionId : undefined,
    };

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const parsed = completeNodeBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // Call service - server resolves requiredBlocks canonically
    const progressRepo = new TutorialNavigationProgressRepository();
    const sectionRepo = new TutorialSectionRepository();
    const service = new LearningProgressService(progressRepo, sectionRepo);

    const progress = await service.completeNavigationNode(
      identity,
      parsed.data.navigationNodeId,
      parsed.data.subtopicId
    );

    return NextResponse.json(
      { data: progress },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-cache' },
      }
    );
  } catch (error) {
    if (error instanceof NavigationNodeNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof InvalidNavigationHierarchyError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (
      error instanceof LearningProgressError &&
      error.code === 'COMPLETION_CRITERIA_NOT_MET'
    ) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          context: error.context,
        },
        { status: 400 }
      );
    }

    console.error('[ILS API] completeNavigationNode error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
