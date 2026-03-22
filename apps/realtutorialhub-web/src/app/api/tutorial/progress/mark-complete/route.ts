import { NextResponse } from 'next/server';
import { z } from 'zod';

import { AssignmentAuthError, requireStudent } from '@/lib/assignment-auth';
import { markAiTutorBlockComplete } from '@/lib/ai-tutor-progress';

export const dynamic = 'force-dynamic';

const BlockCompleteSchema = z.object({
  subtopicId: z.string().uuid(),
  blockType: z.enum(['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor']),
});

export async function POST(request: Request) {
  try {
    const user = await requireStudent(request);
    const payload = BlockCompleteSchema.parse(await request.json());
    const progress = await markAiTutorBlockComplete(user.userId, payload.subtopicId);
    return NextResponse.json({ data: progress }, { status: 200 });
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid payload' }, { status: 400 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to mark progress' }, { status: 500 });
  }
}
