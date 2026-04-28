import { PERMISSIONS } from '@quiz/auth/rbac/permissions';
import { RBACService } from '@quiz/auth/rbac/rbac.service';
import type { Role } from '@quiz/auth/rbac/roles';
import { TutorialContentRepository } from '@quiz/db-tutorial';
import type { TutorialContentRecord } from '@quiz/types';
import { NextRequest, NextResponse } from 'next/server';

import { withObservability } from '@/middleware/observability.middleware';
import type { RequestContext } from '@/middleware/request-context';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const repository = new TutorialContentRepository();

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function toDto(record: TutorialContentRecord) {
  return {
    id: record.id,
    subtopicId: record.subtopicId,
    difficulty: record.difficulty,
    contentType: record.contentType,
    content: record.content,
    version: record.version,
    language: record.language,
    isPublished: record.isPublished,
    generatedByAi: record.generatedByAi,
    aiModelUsed: record.aiModelUsed,
    generationJobId: record.generationJobId,
    adminApprovedBy: record.adminApprovedBy,
    adminApprovedAt: toIso(record.adminApprovedAt),
    qualityScore: record.qualityScore,
    regenerationCount: record.regenerationCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    deletedAt: toIso(record.deletedAt),
  };
}

async function handler(
  _request: NextRequest,
  obsCtx: RequestContext,
  context: { params: Promise<{ subtopicId: string }> }
) {
  const { requestId } = obsCtx; // 🔥 Observability context

  // 🔐 RBAC: Enforce tutorial content access permission
  const tokenService = container.get(TokenService);
  const token = tokenService.getAccessToken(_request, { scope: 'user' });
  
  if (typeof token !== 'string' || token.trim() === '') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await tokenService.verifyUserAccessToken(token);
  
  const roles = Array.isArray(payload.roles) ? payload.roles as Role[] : [];
  RBACService.requirePermission(
    roles,
    PERMISSIONS.TUTORIAL_VIEW,
    payload.userId,
    requestId
  );

  const { subtopicId } = await context.params;
  const rows = await repository.getPublished(subtopicId, 'simple');
  const record = rows[0];

  if (record === undefined || record === null) {
    return NextResponse.json({ error: 'Tutorial content not found' }, { status: 404 });
  }

  const response = NextResponse.json({ data: toDto(record) });
  response.headers.set('Cache-Control', 'public, max-age=3600');
  return response;
}

// 🔥 OBSERVABILITY: Wrap with withObservability for full request tracing
export const GET = withObservability(handler as (req: NextRequest, obsCtx: RequestContext, ...rest: unknown[]) => Promise<NextResponse>);
