import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/modules/exam-engine/session.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: 'user' });
    if (!token) return NextResponse.json({ error: 'Unauthorized', scope: 'user' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, false);
    const searchParams = req.nextUrl.searchParams;
    const examId = searchParams.get('examId');

    if (!examId) return NextResponse.json({ error: 'Missing examId' }, { status: 400 });

    // Guardrail: Validate UUID format to prevent SQL errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(examId)) {
        return NextResponse.json({ error: 'Invalid examId format' }, { status: 422 });
    }

    const state = await SessionService.resumePayload(examId, payload.userId);
    return NextResponse.json(state);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
