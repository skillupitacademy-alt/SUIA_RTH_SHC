import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AssignmentAuthError, requireStudent } from '@/lib/assignment-auth';

export const dynamic = 'force-dynamic';

const blockTypeSchema = z.enum(['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor']);

const getQuerySchema = z.object({
  subtopicId: z.string().uuid(),
});

const postBodySchema = z.object({
  subtopicId: z.string().uuid(),
  blockType: blockTypeSchema,
  status: z.literal('viewed'),
});

/**
 * GET /api/tutorial/progress
 * 
 * RTH BFF - Calls centralized Tutorial Engine in API server
 */
async function getHandler(request: NextRequest) {
  try {
    const user = await requireStudent(request);
    const parsed = getQuerySchema.safeParse({
      subtopicId: request.nextUrl.searchParams.get('subtopicId') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid subtopicId' }, { status: 400 });
    }

    // Call API server
    const apiUrl = process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'http://localhost:3000';
    const response = await fetch(
      `${apiUrl}/api/tutorial/progress?subtopicId=${parsed.data.subtopicId}`,
      {
        headers: {
          'X-Brand': 'realtutorialhub',
          'X-User-ID': user.userId,
          'X-Internal-Secret': process.env.INTERNAL_API_SECRET || ''
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to get progress' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200, headers: { 'Cache-Control': 'no-cache' } });
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 500 });
  }
}

/**
 * POST /api/tutorial/progress
 * 
 * RTH BFF - Calls centralized Tutorial Engine in API server
 */
async function postHandler(request: NextRequest) {
  try {
    const user = await requireStudent(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const parsed = postBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    // Call API server
    const apiUrl = process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'http://localhost:3000';
    const response = await fetch(
      `${apiUrl}/api/tutorial/progress`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Brand': 'realtutorialhub',
          'X-User-ID': user.userId,
          'X-Internal-Secret': process.env.INTERNAL_API_SECRET || ''
        },
        body: JSON.stringify(parsed.data),
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to track progress' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200, headers: { 'Cache-Control': 'no-cache' } });
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 500 });
  }
}

// Export handlers
export const GET = getHandler;
export const POST = postHandler;
