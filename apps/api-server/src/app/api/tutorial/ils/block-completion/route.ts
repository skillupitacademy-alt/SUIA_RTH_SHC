/**
 * POST /api/tutorial/ils/block-completion
 * 
 * Record completion of a learning block.
 * 
 * AUTHORIZATION: Self-scoped via authenticated identity
 * BRAND: Scoped via authenticated brand context
 */

import {
  LearningProgressService,
  TutorialNavigationProgressRepository,
  TutorialSectionRepository,
  NavigationNodeNotFoundError,
  InvalidNavigationHierarchyError,
  InvalidBlockCompletionError,
  type AuthenticatedIdentity,
} from '@quiz/db-tutorial';
import { NextRequest, NextResponse } from 'next/server';

import { validateRequest } from '@/middleware/internal-auth.middleware';
import { recordBlockCompletionBodySchema } from '@/schemas/ils.schemas';

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
    const identity: AuthenticatedIdentity = {
      userId: context.userId,
      brand: context.brand,
      sessionId: request.headers.get('x-session-id') || undefined,
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

    const parsed = recordBlockCompletionBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // Call service
    const progressRepo = new TutorialNavigationProgressRepository();
    const sectionRepo = new TutorialSectionRepository();
    const service = new LearningProgressService(progressRepo, sectionRepo);

    const progress = await service.recordBlockCompletion(
      identity,
      parsed.data.navigationNodeId,
      parsed.data.subtopicId,
      parsed.data.sectionId,
      parsed.data.blockId,
      parsed.data.blockType,
      parsed.data.blockVersion,
      parsed.data.sessionId
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

    if (error instanceof InvalidBlockCompletionError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.error('[ILS API] recordBlockCompletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
