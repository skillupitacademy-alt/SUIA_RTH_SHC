/**
 * POST /api/tutorial/ils/block-visit
 * 
 * Phase 4.4: Record a learner visit to a specific block within a navigation node.
 * 
 * AUTHORIZATION: Self-scoped via authenticated identity
 * BRAND: Scoped via authenticated brand context
 * SESSION: Forwarded from client, used by service for visit deduplication
 */

import {
  type AuthenticatedIdentity,
  InvalidNavigationHierarchyError,
  LearningProgressService,
  NavigationNodeNotFoundError,
  TutorialNavigationProgressRepository,
  TutorialSectionRepository,
  BlockLearningStateRepository,
  InvalidTimeUpdateError,
  LearningProgressError,
} from '@quiz/db-tutorial';
import { NextRequest, NextResponse } from 'next/server';

import { validateRequest } from '@/middleware/internal-auth.middleware';
import { recordBlockVisitBodySchema } from '@/schemas/ils.schemas';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // console.log('[ILS-DEBUG][API][block-visit] Request received', {
  //   method: request.method,
  //   hasSessionIdHeader: !!request.headers.get('x-session-id'),
  //   hasXUserID: !!request.headers.get('X-User-ID'),
  //   hasXBrand: !!request.headers.get('X-Brand'),
  //   timestamp: new Date().toISOString()
  // });
  
  try {
    // Validate internal authentication FIRST
    // console.log('[ILS-DEBUG][API][block-visit] Validating internal authentication');
    const authValidation = validateRequest(request, { requireInternalSecret: true });
    
    if (authValidation.error) {
      // console.warn('[ILS-DEBUG][API][block-visit][FAILED] Internal auth validation failed');
      return authValidation.error;
    }
    
    if (!authValidation.context) {
      // console.warn('[ILS-DEBUG][API][block-visit][FAILED] No auth context');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    
    const { context } = authValidation;
    // console.log('[ILS-DEBUG][API][block-visit][AUTH-SUCCESS]', {
    //   userId: context.userId,
    //   brand: context.brand
    // });
    
    // Construct authenticated identity from validated context
    const sessionId = request.headers.get('x-session-id');
    const identity: AuthenticatedIdentity = {
      userId: context.userId,
      brand: context.brand,
      sessionId: sessionId !== null && sessionId !== '' ? sessionId : undefined,
    };
    
    // console.log('[ILS-DEBUG][API][block-visit] Authenticated identity constructed', {
    //   userId: identity.userId,
    //   brand: identity.brand,
    //   hasSessionId: !!identity.sessionId,
    //   sessionId: identity.sessionId
    // });

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
      // console.log('[ILS-DEBUG][API][block-visit] Request body parsed', {
      //   bodyKeys: body ? Object.keys(body as any) : []
      // });
    } catch (error) {
      // console.error('[ILS-DEBUG][API][block-visit][ERROR] Invalid JSON:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const parsed = recordBlockVisitBodySchema.safeParse(body);
    if (!parsed.success) {
      // console.error('[ILS-DEBUG][API][block-visit][ERROR] Schema validation failed', {
      //   issues: parsed.error.issues
      // });
      return NextResponse.json(
        { error: 'Invalid request body', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // console.log('[ILS-DEBUG][API][block-visit] Request validated', {
    //   navigationNodeId: parsed.data.navigationNodeId,
    //   blockId: parsed.data.blockId,
    //   blockVersion: parsed.data.blockVersion,
    //   subtopicId: parsed.data.subtopicId,
    //   sessionId: parsed.data.sessionId
    // });

    // Instantiate repositories
    const progressRepo = new TutorialNavigationProgressRepository();
    const sectionRepo = new TutorialSectionRepository();
    const blockRepo = new BlockLearningStateRepository();
    
    // Instantiate service with Phase 4.3 constructor
    const service = new LearningProgressService(progressRepo, sectionRepo, blockRepo);

    // console.log('[ILS-DEBUG][API][block-visit] Calling LearningProgressService.recordBlockVisit()');
    
    // Call Phase 4.3 service method
    const blockState = await service.recordBlockVisit(
      identity,
      parsed.data.navigationNodeId,
      parsed.data.subtopicId,
      parsed.data.blockId,
      parsed.data.blockVersion,
      parsed.data.sessionId
    );

    // console.log('[ILS-DEBUG][API][block-visit][SUCCESS] Block visit recorded', {
    //   blockStateId: blockState.id,
    //   visitCount: blockState.visitCount
    // });

    return NextResponse.json(
      { data: blockState },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-cache' },
      }
    );
  } catch (error) {
    if (error instanceof NavigationNodeNotFoundError) {
      // console.error('[ILS-DEBUG][API][block-visit][ERROR] NavigationNodeNotFoundError:', {
      //   name: error.name,
      //   message: error.message,
      //   stack: error.stack
      // });
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof InvalidNavigationHierarchyError) {
      // console.error('[ILS-DEBUG][API][block-visit][ERROR] InvalidNavigationHierarchyError:', {
      //   name: error.name,
      //   message: error.message,
      //   stack: error.stack
      // });
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof LearningProgressError) {
      // console.error('[ILS-DEBUG][API][block-visit][ERROR] LearningProgressError:', {
      //   name: error.name,
      //   message: error.message,
      //   stack: error.stack
      // });
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // console.error('[ILS-DEBUG][API][block-visit][ERROR] Unexpected error:', {
    //   name: error instanceof Error ? error.name : 'Unknown',
    //   message: error instanceof Error ? error.message : String(error),
    //   stack: error instanceof Error ? error.stack : undefined,
    //   errorType: typeof error,
    //   errorConstructor: error?.constructor?.name
    // });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
