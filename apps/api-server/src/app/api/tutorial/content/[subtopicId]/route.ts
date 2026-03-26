import { TutorialContentRepository } from '@quiz/db-tutorial';
import type { TutorialContentRecord } from '@quiz/types';
import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ subtopicId: string }> }
) {
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
