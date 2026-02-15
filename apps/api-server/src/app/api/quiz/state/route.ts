import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { TokenService } from '@/modules/auth/token.service';
import { SessionService } from '@/modules/exam-engine/session.service';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: '_user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: '_user' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    const searchParams = _req.nextUrl.searchParams;
    const examId = searchParams.get('examId');

    if (typeof examId !== 'string' || examId.trim() === '') {
      return NextResponse.json({ _error: 'Missing examId' }, { status: 400 });
    }

    // Guardrail: Validate UUID format to prevent SQL errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(examId)) {
        return NextResponse.json({ _error: 'Invalid examId format' }, { status: 422 });
    }

    const state = await SessionService.resumePayload(examId, _payload.userId);
    return NextResponse.json(state);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Bad request';
    return NextResponse.json({ _error: message }, { status: 400 });
  }
}
