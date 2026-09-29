/**
 * GET /api/tutorial/ils/navigation/:nodeId
 * 
 * Get learning progress for a specific navigation node.
 * 
 * Query: ?subtopicId=xxx
 * 
 * AUTHORIZATION: Self-scoped via authenticated identity
 * BRAND: Scoped via authenticated brand context
 */

import {
  type AuthenticatedIdentity,
  BlockLearningStateRepository,
  BlockTelemetryEventRepository, // Phase D-2
  InvalidNavigationHierarchyError,
  LearningProgressService,
  NavigationNodeNotFoundError,
  TutorialNavigationProgressRepository,
  TutorialSectionRepository,
  UnauthorizedProgressAccessError,
} from '@quiz/db-tutorial';
import { NextRequest, NextResponse } from 'next/server';

import { validateRequest } from '@/middleware/internal-auth.middleware';
import { getNavigationProgressQuerySchema } from '@/schemas/ils.schemas';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nodeId: string }> }
) {
  try {
    const params = await context.params;
    const navigationNodeId = params.nodeId;

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

    // Parse and validate query params
    const url = new URL(request.url);
    const queryParams = {
      subtopicId: url.searchParams.get('subtopicId'),
    };

    const parsed = getNavigationProgressQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // Call service
    const progressRepo = new TutorialNavigationProgressRepository();
    const sectionRepo = new TutorialSectionRepository();
    const blockRepo = new BlockLearningStateRepository();
    const telemetryRepo = new BlockTelemetryEventRepository(); // Phase D-2: 4th param
    const service = new LearningProgressService(progressRepo, sectionRepo, blockRepo, telemetryRepo);

    const progress = await service.getNavigationProgress(
      identity,
      navigationNodeId,
      parsed.data.subtopicId
    );

    // GATE H FORENSIC: Log D1 block state in response
    const d1Block = progress.blocks.find(b => b.blockId === '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749');
    if (d1Block) {
      console.log('[GATE H FORENSIC] D1 in navigation API response:', {
        blockId: d1Block.blockId,
        blockVersion: d1Block.blockVersion,
        activeTimeSec: d1Block.activeTimeSec,
        expectedTimeSec: d1Block.expectedTimeSec,
        completedAt: d1Block.completedAt,
        isCompleted: d1Block.isCompleted,
      });
    }

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

    if (error instanceof UnauthorizedProgressAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    if (error instanceof InvalidNavigationHierarchyError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.error('[ILS API] getNavigationProgress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
