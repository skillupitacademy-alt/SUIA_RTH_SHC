import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/modules/auth/token.service';
import { ExamBlueprintService } from '@/services/exams/ExamBlueprintService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: 'user' });
    if (!token) return NextResponse.json({ error: 'Unauthorized', scope: 'user' }, { status: 401 });

    await TokenService.verifyAccessToken(token, false);
    const body = await req.json();

    const blueprintService = new ExamBlueprintService();
    const result = await blueprintService.getAvailableCounts(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
