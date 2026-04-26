import { TutorialContentRepository } from '@quiz/db-tutorial';
import type { TutorialContentRecord } from '@quiz/types';
import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '@quiz/auth/rbac/rbac.service';
import { PERMISSIONS } from '@quiz/auth/rbac/permissions';
import { withObservability } from '@/middleware/observability.middleware';
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
  obsCtx: any,
  context: { params: Promise<{ subtopicId: string }> }
) {
  const { requestId } = obsCtx; // 🔥 Observability context

  // 🔐 RBAC: Enforce tutorial content access permission
  const tokenService = container.get(TokenService);
  const token = tokenService.getAccessToken(_request, { scope: 'user' });
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await tokenService.verifyUserAccessToken(token);
  
  RBACService.requirePermission(
    (payload.roles || []) as any,
    PERMISSIONS.TUTORIAL_VIEW,
    payload.userId,
    requestId
  );

  const { subtopicId } = await context.params;
  const rows = await repository.getPublished(subtopicId, 'simple');
  const record = rows[0];

  if (record === undefined) {
    return NextResponse.json({ error: 'Tutorial content not found' }, { status: 404 });
  }

  const response = NextResponse.json({ data: toDto(record) });
  response.headers.set('Cache-Control', 'public, max-age=3600');
  return response;
}

// 🔥 OBSERVABILITY: Wrap with withObservability for full request tracing
export const GET = withObservability(handler);
