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
 * Proxy for downloading private blob exports (JSON/CSV)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (jobId === null || jobId.trim() === '') {
      throw badRequest('Missing jobId');
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

    // Get job and verify ownership
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

    const blobUrl = job.result.downloadUrl as string;
    const format = (job.result?.format as string) ?? 'json';

    // Fetch from private blob
    const response = await fetch(blobUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      log.error({ jobId, status: response.status }, 'Failed to fetch export from blob storage');
      throw new Error(`Failed to fetch export from storage: ${response.statusText}`);
    }

    const contentType = format === 'csv' ? 'application/zip' : 'application/json';
    const extension = format === 'csv' ? 'zip' : 'json';
    const filename = `Export-${jobId.slice(0, 8)}.${extension}`;

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
