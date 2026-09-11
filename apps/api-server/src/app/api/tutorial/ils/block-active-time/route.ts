/**
 * POST /api/tutorial/ils/block-active-time
 * 
 * Phase 4.4: Record active time spent on a specific block.
 * Phase D-2: Idempotent delivery via eventId
 * 
 * AUTHORIZATION: Self-scoped via authenticated identity
 * BRAND: Scoped via authenticated brand context
 * TIME LIMIT: 600 seconds (block-level, stricter than page-level 3600s)
 * IDEMPOTENCY: Duplicate eventId returns idempotent success (not 409)
 */

import {
  type AuthenticatedIdentity,
  InvalidNavigationHierarchyError,
  LearningProgressService,
  TutorialNavigationProgressRepository,
  TutorialSectionRepository,
  BlockLearningStateRepository,
  BlockTelemetryEventRepository, // Phase D-2
  InvalidTimeUpdateError,
  LearningProgressError,
  NavigationNodeNotFoundError,
} from '@quiz/db-tutorial';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@quiz/db-tutorial'; // Phase D-2: For transactions

import { validateRequest } from '@/middleware/internal-auth.middleware';
import { recordBlockActiveTimeBodySchema } from '@/schemas/ils.schemas';

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

    const parsed = recordBlockActiveTimeBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // Instantiate repositories
    const progressRepo = new TutorialNavigationProgressRepository();
    const sectionRepo = new TutorialSectionRepository();
    const blockRepo = new BlockLearningStateRepository();
    const telemetryRepo = new BlockTelemetryEventRepository(db); // Phase D-2
    
    // Instantiate service with Phase D-2 constructor (4 params)
    const service = new LearningProgressService(
      progressRepo,
      sectionRepo,
      blockRepo,
      telemetryRepo // Phase D-2
    );

    // Call Phase D-2 service method with eventId
    const result = await service.recordBlockActiveTime(
      identity,
      parsed.data.navigationNodeId,
      parsed.data.subtopicId,
      parsed.data.blockId,
      parsed.data.blockVersion,
      parsed.data.eventId, // Phase D-2
      parsed.data.activeTimeSec
    );

    // Return idempotent success with processing metadata
    // Phase D-2: Expose whether this was new processing or duplicate
    return NextResponse.json(
      {
        data: result.state,
        processed: result.wasProcessed,
        alreadyProcessed: result.wasAlreadyProcessed,
      },
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

    if (error instanceof InvalidTimeUpdateError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof LearningProgressError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.error('[ILS API] recordBlockActiveTime error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
