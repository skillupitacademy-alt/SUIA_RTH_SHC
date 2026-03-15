import { db, exams } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { badRequest, forbidden, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { JobsService } from '@/modules/system/jobs.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const log = logger.child({ module: 'export-download' });

/**
 * GET /api/export/download?jobId=xxx
 * GET /api/export/download?examId=xxx&format=json
 * Proxy for downloading private blob exports (JSON/CSV)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const examId = searchParams.get('examId');
    const formatParam = (searchParams.get('format') ?? 'json').toLowerCase();

    if ((jobId === null || jobId.trim() === '') && (examId === null || examId.trim() === '')) {
      throw badRequest('Missing jobId or examId');
    }

    // Authenticate
    const token = container.get(TokenService).getAccessToken(req, { scope: 'user' });
    if (token === null || token === undefined) {
      throw unauthorized('Unauthorized');
    }
    const payload = await container.get(TokenService).verifyUserAccessToken(token);
    if (!payload?.userId) {
      throw unauthorized('Unauthorized');
    }

    let blobUrl: string;
    let format: string;

    if (jobId !== null && jobId.trim() !== '') {
      const job = await JobsService.getJobStatus(jobId);
      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      if (job.userId !== payload.userId) {
        throw forbidden('Forbidden');
      }

      if (job.status !== 'completed' || job.result?.downloadUrl === null || job.result?.downloadUrl === undefined) {
        return NextResponse.json({ error: 'Export not ready' }, { status: 404 });
      }

      blobUrl = job.result.downloadUrl as string;
      format = (job.result?.format as string) ?? 'json';
    } else {
      if (formatParam !== 'json' && formatParam !== 'csv' && formatParam !== 'student-insight-pdf') {
        throw badRequest('Invalid format');
      }
      const exam = await db.query.exams.findFirst({
        where: eq(exams.id, examId as string),
        columns: { userId: true, exportUrls: true }
      });

      if (!exam) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
      }

      if (exam.userId !== payload.userId) {
        throw forbidden('Forbidden');
      }

      const exportUrls = exam.exportUrls as { analytics_json?: string; analytics_csv?: string; student_insight_pdf?: string } | null;
      const url = formatParam === 'json'
        ? exportUrls?.analytics_json
        : formatParam === 'csv'
        ? exportUrls?.analytics_csv
        : exportUrls?.student_insight_pdf;

      if (url === null || url === undefined || url.trim() === '') {
        return NextResponse.json({ error: 'Export not ready' }, { status: 404 });
      }

      blobUrl = url;
      format = formatParam;
    }

    // If the job result didn't preserve format reliably, infer it from the blob key.
    // This prevents "PDF saved as JSON" issues when the underlying artifact is a PDF.
    const lowerUrl = blobUrl.toLowerCase();
    if (lowerUrl.endsWith('.pdf')) {
      format = 'student-insight-pdf';
    } else if (lowerUrl.endsWith('.zip')) {
      format = 'csv';
    } else if (lowerUrl.endsWith('.json')) {
      format = 'json';
    }

    // Fetch from private blob
    const response = await fetch(blobUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      log.error({ jobId, status: response.status }, 'Failed to fetch export from blob storage');
      if (response.status === 404) {
        // Blob was deleted or URL is stale. Tell client to regenerate.
        return NextResponse.json({ error: 'Export artifact missing. Please regenerate.' }, { status: 404 });
      }
      throw new Error(`Failed to fetch export from storage: ${response.statusText}`);
    }

    const contentType = format === 'csv'
      ? 'application/zip'
      : format === 'student-insight-pdf'
      ? 'application/pdf'
      : 'application/json';
    const extension = format === 'csv'
      ? 'zip'
      : format === 'student-insight-pdf'
      ? 'pdf'
      : 'json';
    const prefix = format === 'student-insight-pdf'
      ? 'Student-Insight'
      : format === 'csv'
      ? 'Data-Engineering'
      : 'Deep-Analytics';
    const filename = `${prefix}-${(jobId ?? examId ?? 'export').slice(0, 8)}.${extension}`;

    return new Response(response.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: unknown) {
    log.error({ err: error }, 'Export download failed');
    return ApiResponse.error(error);
  }
}
