import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withObservability } from '@/middleware/observability.middleware';
import { AssignmentAuthError, requireStudent } from '@/lib/assignment-auth';
import { TutorialProgressRepository } from '@quiz/db-tutorial';

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

const progressRepository = new TutorialProgressRepository();

function toSnapshot(blocksCompleted: string[] | null | undefined, assignmentUnlocked: boolean) {
  const blocksViewed = (blocksCompleted ?? []).filter((block): block is z.infer<typeof blockTypeSchema> =>
    blockTypeSchema.safeParse(block).success
  );

  return {
    blocksViewed,
    completionPercent: Math.round((blocksViewed.length / 6) * 100),
    assignmentUnlocked,
  };
}

async function getHandler(request: NextRequest) {
  try {
    const user = await requireStudent(request);
    const parsed = getQuerySchema.safeParse({
      subtopicId: request.nextUrl.searchParams.get('subtopicId') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid subtopicId' }, { status: 400 });
    }

    const progress = await progressRepository.getProgress(user.userId, parsed.data.subtopicId);
    const snapshot = toSnapshot(progress?.blocksCompleted, progress?.status === 'completed');

    return NextResponse.json({ data: snapshot }, { status: 200, headers: { 'Cache-Control': 'no-cache' } });
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 500 });
  }
}

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

    const progress = await progressRepository.markBlockComplete(user.userId, parsed.data.subtopicId, parsed.data.blockType);
    const snapshot = toSnapshot(progress.blocksCompleted, progress.status === 'completed');

    return NextResponse.json({ data: snapshot }, { status: 200, headers: { 'Cache-Control': 'no-cache' } });
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 500 });
  }
}

// 🔥 OBSERVABILITY: Wrap with withObservability for full request tracing
export const GET = withObservability(getHandler);
export const POST = withObservability(postHandler);
