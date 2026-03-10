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
    const topicId = searchParams.get('topicId');

    if (topicId === null || topicId === undefined || topicId === '') {
      throw badRequest('topicId is required');
    }

    const subtopics = await TopicService.getSubtopicsByTopic(topicId);
    return withCacheHeaders(ApiResponse.success(subtopics), 'static');
  } catch (error: unknown) {
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'core', operation: 'get_subtopics' });
