import { type NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db, exams } from '@quiz/db';
import { eq } from 'drizzle-orm';

import { TokenService } from '@/modules/auth/token.service';
import { ReportEngine } from '@/modules/report-engine/report.engine';

/**
 * GET USER REPORTS
 * GET /api/reports
 */
export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const id = searchParams.get('id');

    const _token = TokenService.getAccessToken(_req, { scope: 'user' });
    if (_token === undefined || _token === null || _token === '') return NextResponse.json({ _error: 'Unauthorized', scope: 'user' }, { status: 401 });

    const _payload = await TokenService.verifyAccessToken(_token, false);

    if (id !== null && id !== '') {
       // Step 2 Hardening: Pre-check Ownership & Status
       const examCheck = await db.query.exams.findFirst({
         where: eq(exams.id, id),
         columns: {
           userId: true,
           status: true,
         }
       });

       if (!examCheck) {
         return NextResponse.json({ _error: 'Report not found' }, { status: 404 });
       }

       // 1. Strict Ownership
       if (examCheck.userId !== _payload.userId) {
         return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
       }

       // 2. Status Gating
       if (examCheck.status === 'started') {
         return NextResponse.json({ _error: 'Exam in progress' }, { status: 409 });
       }
       if (examCheck.status === 'processing') {
         // Retry-After header could be added here
         return NextResponse.json({ status: 'processing', message: 'Report generating...' }, { status: 202 });
       }

       // 3. Sanitized Report Generation (Step 4 contract: default is safe)
       const report = await ReportEngine.getExamReport(id, { includeCorrectAnswers: false });
       return NextResponse.json(report);
    }


    const report = await ReportEngine.getUserPerformance(_payload.userId);
    return NextResponse.json(report);
  } catch (_error: unknown) {
    const errorMessage = _error instanceof Error ? _error.message : 'Failed to generate report';
    return NextResponse.json({ _error: errorMessage }, { status: 500 });
  }
}

