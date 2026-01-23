import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { ReportEngine } from '@/modules/report-engine/report.engine';
import { TokenService } from '@/modules/auth/token.service';

/**
 * GET USER REPORTS
 * GET /api/reports
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token);
    const report = await ReportEngine.getUserPerformance(payload.userId);
    
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
