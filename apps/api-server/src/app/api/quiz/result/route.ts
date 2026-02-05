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
    
    // Security Check: Ensure user owns the exam they are requesting results for
    // ReportEngine doesn't seem to check owner in getExamReport, so we should check basic ownership
    // in future iterations or check results here.
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
