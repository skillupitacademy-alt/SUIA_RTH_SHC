import { NextRequest, NextResponse } from 'next/server';
import { SelectionEngine } from '@/modules/selection-engine/selection.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: 'user' });
    if (!token) return NextResponse.json({ error: 'Unauthorized', scope: 'user' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, false);
    const body = await req.json();

    // SelectionEngine.composeExam(userId, blueprintOrDomainId, config)
    const { domainId, ...config } = body;
    const exam = await SelectionEngine.composeExam(payload.userId, domainId, config);
    return NextResponse.json(exam);
  } catch (error: any) {
    console.error('[QUIZ_START] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
