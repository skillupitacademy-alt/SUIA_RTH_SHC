import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db, exams } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { ReportEngine } from '@/modules/report-engine/report.engine';
import { TokenService } from '@/modules/auth/token.service';

/**
 * GET USER REPORTS
 * GET /api/reports
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const token = TokenService.getAccessToken(req, { scope: 'user' });
    if (!token) return NextResponse.json({ error: 'Unauthorized', scope: 'user' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, false);

    if (id) {
       // Step 2 Hardening: Pre-check Ownership & Status
       const examCheck = await db.query.exams.findFirst({
         where: eq(exams.id, id),
         columns: {
           userId: true,
           status: true,
         }
       });

       if (!examCheck) {
         return NextResponse.json({ error: 'Report not found' }, { status: 404 });
       }

       // 1. Strict Ownership
       if (examCheck.userId !== payload.userId) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
       }

       // 2. Status Gating
       if (examCheck.status === 'started') {
         return NextResponse.json({ error: 'Exam in progress' }, { status: 409 });
       }
       if (examCheck.status === 'processing') {
         // Retry-After header could be added here
         return NextResponse.json({ status: 'processing', message: 'Report generating...' }, { status: 202 });
       }

       // 3. Sanitized Report Generation (Step 4 contract: default is safe)
       const report = await ReportEngine.getExamReport(id, { includeCorrectAnswers: false });
       return NextResponse.json(report);
    }

    const report = await ReportEngine.getUserPerformance(payload.userId);
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

