import { NextRequest, NextResponse } from 'next/server';
import { db, exams } from '@quiz/db';
import { eq } from 'drizzle-orm';
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

    // Step 3 Hardening: Query-First Security Check
    const examCheck = await db.query.exams.findFirst({
        where: eq(exams.id, examId),
        columns: {
            userId: true,
            status: true,
        }
    });

    if (!examCheck) {
        return NextResponse.json({ error: 'Exam session not found' }, { status: 404 });
    }

    // 1. Strict Ownership Check
    if (examCheck.userId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this exam session' }, { status: 403 });
    }

    // 2. Status Gating
    if (examCheck.status === 'started') {
        return NextResponse.json({ error: 'Exam is still in progress' }, { status: 409 });
    }
    if (examCheck.status === 'processing') {
        return NextResponse.json({ 
            status: 'processing',
            message: 'Results are being calculated...' 
        }, { status: 202, headers: { 'Retry-After': '5' } });
    }

    // 3. Safe Report Generation (Sanitized by default)
    const result = await ReportEngine.getExamReport(examId, { includeCorrectAnswers: false });
    
    return NextResponse.json(result);
  } catch (error: any) {
    // 4. Token Errors specifically
    if (error.message?.includes('token') || error.message?.includes('signature')) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
