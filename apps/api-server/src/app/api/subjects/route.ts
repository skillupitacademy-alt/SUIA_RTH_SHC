import { type NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCacheHeaders } from '@/lib/cache-headers';
import { withLogging } from '@/lib/withLogging';
import { SubjectService } from '@/modules/domain/domain.service';

export const dynamic = 'force-dynamic';

async function getHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domainId = searchParams.get('domainId');

    if (domainId === null || domainId === undefined || domainId === '') {
      throw badRequest('domainId is required');
    }

    const subjects = await SubjectService.getSubjectsByDomain(domainId);
    return withCacheHeaders(ApiResponse.success(subjects), 'static');
  } catch (error: unknown) {
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'core', operation: 'get_subjects' });
