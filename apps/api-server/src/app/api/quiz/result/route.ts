import { NextRequest, NextResponse } from 'next/server';
import { ReportEngine } from '@/modules/report-engine/report.engine';
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

    const result = await ReportEngine.getExamReport(examId);
    
    // Task B: Security Check: Ensure user owns the exam they are requesting results for
    if (result.userId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this exam session' }, { status: 403 });
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
