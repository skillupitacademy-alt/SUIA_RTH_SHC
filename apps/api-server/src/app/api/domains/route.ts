import { type NextRequest } from 'next/server';

import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCacheHeaders } from '@/lib/cache-headers';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { DomainService } from '@/modules/domain/domain.service';

export const dynamic = 'force-dynamic';

async function getHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id !== null && id !== undefined && id !== '') {
      const hierarchy = await DomainService.getDomainHierarchy(id);
      return withCacheHeaders(ApiResponse.success(hierarchy), 'static');
    }

    const domains = await DomainService.getAllDomains();
    return withCacheHeaders(ApiResponse.success(domains), 'static');
  } catch (error: unknown) {
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'core', operation: 'get_domains' });

async function postHandler(req: NextRequest) {
  try {
    let raw;
    try {
      raw = await req.json();
      validateJsonSize(raw);
      validateJsonDepth(raw);
    } catch {
      throw badRequest("Invalid payload");
    }
    const data = sanitizeJsonField(raw);
    const domain = await DomainService.createDomain(data);
    return ApiResponse.created(domain);
  } catch (error: unknown) {
    return ApiResponse.error(error);
  }
}

export const POST = withLogging(postHandler, { component: 'core', operation: 'create_domain' });
