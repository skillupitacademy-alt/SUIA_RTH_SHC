import { db, exams } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { type NextRequest } from 'next/server';

import { badRequest, forbidden, notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';
const log = logger.child({ module: 'export-urls' });

function isValidStudentInsightPdfRef(ref: string): boolean {
  const lower = ref.toLowerCase();
  return lower.endsWith('.pdf') && (lower.includes('/reports/') || lower.startsWith('reports/'));
}

async function getHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawExamId = searchParams.get('examId') ?? '';
    const examId = rawExamId.trim();
    const format = (searchParams.get('format') ?? 'json').toLowerCase();

    if (examId === '') {
      throw badRequest('Missing examId');
    }
    if (format !== 'json' && format !== 'csv' && format !== 'student-insight-pdf') {
      throw badRequest('Invalid format');
    }

    const token = container.get(TokenService).getAccessToken(req, { scope: 'user' });
    if (token === undefined || token === null || token === '') {
      throw unauthorized('Unauthorized');
    }
    const payload = await container.get(TokenService).verifyUserAccessToken(token);
    const userId = payload.userId;

    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
      columns: { userId: true, exportUrls: true }
    });

    if (!exam) {
      throw notFound('Exam', examId);
    }
    if (exam.userId !== userId) {
      throw forbidden('Forbidden: ownership mismatch');
    }

    const cacheKey = `export:${examId}:${userId}:${format}`;
    try {
      const cachedUrl = await redis.get<string>(cacheKey);
      if (typeof cachedUrl === 'string' && cachedUrl.trim() !== '') {
        const { storage } = await import('@/lib/storage');
        if (format === 'student-insight-pdf' && !isValidStudentInsightPdfRef(cachedUrl)) {
          await redis.del(cacheKey).catch(() => {});
          return ApiResponse.success({ url: null, source: 'stale' }, 200);
        }
        const exists = await storage.exists(cachedUrl);
        if (!exists) {
          // Stale cache pointer (blob deleted). Clear cache and force regeneration path.
          await redis.del(cacheKey).catch(() => {});
          return ApiResponse.success({ url: null, source: 'stale' }, 200);
        }

        const formatKey = format === 'json'
          ? 'analytics_json'
          : format === 'csv'
          ? 'analytics_csv'
          : 'student_insight_pdf';
        const existingUrls = (exam.exportUrls as Record<string, string> | null) ?? {};
        if (typeof existingUrls[formatKey] !== 'string' || existingUrls[formatKey]?.trim() === '') {
          await db.update(exams)
            .set({ exportUrls: { ...existingUrls, [formatKey]: cachedUrl } })
            .where(eq(exams.id, examId));
        }
        return ApiResponse.success({ url: buildProxyUrl(examId, format), source: 'redis' }, 200);
      }
    } catch (err) {
      log.warn({ err, examId, userId }, 'Redis lookup failed');
    }

    const exportUrls = exam.exportUrls as { analytics_json?: string; analytics_csv?: string; student_insight_pdf?: string } | null;
    const url = format === 'json'
      ? exportUrls?.analytics_json
      : format === 'csv'
      ? exportUrls?.analytics_csv
      : exportUrls?.student_insight_pdf;

    if (typeof url === 'string' && url.trim() !== '') {
      const { storage } = await import('@/lib/storage');
      if (format === 'student-insight-pdf' && !isValidStudentInsightPdfRef(url)) {
        // Invalid pointer (e.g. JSON saved into student_insight_pdf). Clear it so the next click regenerates.
        const existingUrls = (exam.exportUrls as Record<string, unknown> | null) ?? {};
        const nextUrls = { ...existingUrls };
        delete (nextUrls as Record<string, unknown>).student_insight_pdf;
        await db.update(exams).set({ exportUrls: nextUrls }).where(eq(exams.id, examId)).catch(() => {});
        await redis.del(cacheKey).catch(() => {});
        return ApiResponse.success({ url: null, source: 'stale' }, 200);
      }
      const exists = await storage.exists(url);
      if (!exists) {
        // Stale DB pointer. Clear the field so future calls regenerate.
        const formatKey = format === 'json'
          ? 'analytics_json'
          : format === 'csv'
          ? 'analytics_csv'
          : 'student_insight_pdf';
        const existingUrls = (exam.exportUrls as Record<string, unknown> | null) ?? {};
        const nextUrls = { ...existingUrls };
        delete (nextUrls as Record<string, unknown>)[formatKey];
        await db.update(exams)
          .set({ exportUrls: nextUrls })
          .where(eq(exams.id, examId))
          .catch(() => {});
        await redis.del(cacheKey).catch(() => {});
        return ApiResponse.success({ url: null, source: 'stale' }, 200);
      }
      return ApiResponse.success({ url: buildProxyUrl(examId, format), source: 'db' }, 200);
    }

    return ApiResponse.success({ url: null, source: 'none' }, 200);
  } catch (err: unknown) {
    log.error({ err }, '[ExportUrls] Error');
    return ApiResponse.error(err instanceof Error ? err : new Error(String(err)));
  }
}

export const GET = withLogging(getHandler, { component: 'export', operation: 'get_export_urls' });

function buildProxyUrl(examId: string, format: string) {
  const rawBase = process.env.NEXT_PUBLIC_API_URL ?? '';
  if (rawBase.trim() === '') {
    return `/api/export/download?examId=${encodeURIComponent(examId)}&format=${encodeURIComponent(format)}`;
  }
  const base = rawBase.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  return `${base}/api/export/download?examId=${encodeURIComponent(examId)}&format=${encodeURIComponent(format)}`;
}
