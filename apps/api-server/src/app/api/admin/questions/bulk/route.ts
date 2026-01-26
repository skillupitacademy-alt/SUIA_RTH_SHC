import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';

/**
 * Route for bulk question import
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, true);
    
    const { questions } = await req.json();
    if (!Array.isArray(questions)) {
        return NextResponse.json({ error: 'Payload must be an array of questions' }, { status: 400 });
    }

    const created = await AdminEngine.bulkCreateQuestions(questions, payload.userId);
    return NextResponse.json({ message: `Successfully imported ${created.length} questions`, count: created.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
