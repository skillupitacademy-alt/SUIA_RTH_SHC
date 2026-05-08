/**
 * Layman Sections List API
 * Phase 2B Week 3 - Controller Layer
 * -----------------------------------
 * GET /api/admin/layman/sections - List all Layman sections with filters
 */

import { LaymanService } from '@quiz/db-tutorial';
import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { withRateLimit } from '@/middleware/rate-limit.middleware';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';

export const dynamic = 'force-dynamic';

/**
 * List Layman sections with filters
 */
async function getHandler(req: NextRequest) {
  const start = Date.now();
  
  try {
    // Authenticate admin
    await requireAdminRouteAccess(req);
    
    const searchParams = req.nextUrl.searchParams;
    
    // Build filters
    const filters: Record<string, string> = {};
    
    if (searchParams.has('subtopicId')) {
      filters.subtopicId = searchParams.get('subtopicId')!;
    }
    
    if (searchParams.has('brandId')) {
      filters.brandId = searchParams.get('brandId')!;
    }
    
    if (searchParams.has('status')) {
      filters.status = searchParams.get('status')!;
    }
    
    if (searchParams.has('educationalArchitectureId')) {
      filters.educationalArchitectureId = searchParams.get('educationalArchitectureId')!;
    }
    
    if (searchParams.has('uiArchitectureId')) {
      filters.uiArchitectureId = searchParams.get('uiArchitectureId')!;
    }
    
    // Query sections
    const laymanService = new LaymanService();
    const sections = await laymanService.queryLaymanSections(filters);
    
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.sections.list.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.sections.list.duration', durationMs, { outcome: 'success' });
    
    return ApiResponse.success({
      sections,
      total: sections.length,
      filters,
    }, 200, { 'X-Duration-Ms': durationMs.toString() });
    
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.sections.list.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.layman.sections.list.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withRateLimit(
  withCorrelationId(
    withLogging(getHandler, { 
      component: 'layman', 
      operation: 'list_sections' 
    })
  ),
  { limit: 60, windowMs: 60000, keyPrefix: 'ratelimit:layman:sections:list' }
);
