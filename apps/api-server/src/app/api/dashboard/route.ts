import { NextRequest, NextResponse } from 'next/server';
import { DashboardEngine } from './dashboard.engine';
import { TokenService } from '../auth/token.service';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token);
    const data = await DashboardEngine.getUserDashboard(payload.userId);
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
