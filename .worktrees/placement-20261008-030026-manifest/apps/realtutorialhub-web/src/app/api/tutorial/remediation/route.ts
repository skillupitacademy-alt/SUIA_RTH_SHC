import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { AssignmentAuthError, requireStudent } from '@/lib/assignment-auth';
import { RemediationService } from '@/server/remediation.service';

export const dynamic = 'force-dynamic';

const remediationService = new RemediationService();

const querySchema = z.object({
  userId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireStudent(request);
    const parsed = querySchema.safeParse({
      userId: request.nextUrl.searchParams.get('userId') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    if (parsed.data.userId !== undefined && parsed.data.userId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await remediationService.getStudentRemediationHistory(user.userId);
    return NextResponse.json({ data }, { status: 200, headers: { 'Cache-Control': 'no-cache' } });
  } catch (error) {
    if (
      error instanceof AssignmentAuthError ||
      (typeof error === 'object' && error !== null && 'statusCode' in error && typeof (error as { statusCode?: unknown }).statusCode === 'number')
    ) {
      const statusCode = error instanceof AssignmentAuthError
        ? error.statusCode
        : ((error as { statusCode: 401 | 403 }).statusCode ?? 401);
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: statusCode });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load remediation history' }, { status: 500 });
  }
}
