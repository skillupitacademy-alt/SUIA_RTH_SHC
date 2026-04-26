import { NextRequest, NextResponse } from 'next/server';
import { withObservability } from '@/middleware/observability.middleware';
import { requireAssignmentAccess } from '@/lib/assignment-auth';
import { assignmentDifficultySchema, assignmentService } from '@/lib/assignment';

export const dynamic = 'force-dynamic';

function getStatusCode(error: unknown): number {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const statusCode = (error as { statusCode?: unknown }).statusCode;
    if (typeof statusCode === 'number') {
      return statusCode;
    }
  }

  return 401;
}

async function handler(
  req: NextRequest,
  obsCtx: any,
  context: { params: Promise<{ subtopicId: string }> }
) {
  const { requestId } = obsCtx; // 🔥 Observability context
  const params = await context.params;
  
  let user;
  try {
    user = await requireAssignmentAccess(req, params.subtopicId);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: getStatusCode(error) });
  }
  
  const difficulty = assignmentDifficultySchema.safeParse(req.nextUrl.searchParams.get('difficulty'));
  if (!difficulty.success) {
    return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 });
  }

  const result = await assignmentService.getAssignmentsForSubtopic(
    user.userId,
    params.subtopicId,
    difficulty.data
  );

  return NextResponse.json({ data: result }, { status: 200 });
}

// 🔥 OBSERVABILITY: Wrap with withObservability for full request tracing
export const GET = withObservability(handler);
