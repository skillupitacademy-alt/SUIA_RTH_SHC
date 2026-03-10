import { type NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCacheHeaders } from '@/lib/cache-headers';
import { withLogging } from '@/lib/withLogging';
import { TopicService } from '@/modules/domain/domain.service';

export const dynamic = 'force-dynamic';

async function getHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');

    if (subjectId === null || subjectId === undefined || subjectId === '') {
      throw badRequest('subjectId is required');
    }

    const topics = await TopicService.getTopicsBySubject(subjectId);
    return withCacheHeaders(ApiResponse.success(topics), 'IMMUTABLE');
  } catch (error: unknown) {
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'core', operation: 'get_topics' });
