import { db, exams } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { TokenService } from '@/modules/auth/token.service';
import { ReportEngine } from '@/modules/report-engine/report.engine';

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

    // Step 3 Hardening: Query-First Security Check
    const examCheck = await db.query.exams.findFirst({
        where: eq(exams.id, examId),
        columns: {
            userId: true,
            status: true,
        }
    });

    if (!examCheck) {
        return NextResponse.json({ _error: 'Exam session not found' }, { status: 404 });
    }

    // 1. Strict Ownership Check
    if (examCheck.userId !== _payload.userId) {
      return NextResponse.json({ _error: 'Forbidden: You do not own this exam session' }, { status: 403 });
    }

    // 2. Status Gating
    if (examCheck.status === 'started') {
        return NextResponse.json({ _error: 'Exam is still in progress' }, { status: 409 });
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
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unknown error';
    // 4. Token Errors specifically
    if (message.includes('_token') || message.includes('signature')) {
        return NextResponse.json({ _error: 'Invalid _token' }, { status: 401 });
    }
    return NextResponse.json({ _error: message }, { status: 400 });
  }
}
