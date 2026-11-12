import { requireAdminRequest } from '@/lib/admin-route-guard';
import { AcademicHierarchyService, normalizeComplexity } from '@/lib/hierarchy/academic-hierarchy.service';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { TOPIC_COMPLEXITY_ENUM_TO_LEVEL, topicSchema } from '@/schemas/hierarchy.schemas';
import { NextRequest, NextResponse } from 'next/server';


function serializeTopic<T extends { complexity?: string | null; order?: number | null }>(row: T) {
  const normalizedComplexity = normalizeComplexity(row.complexity ?? 'beginner');
  return {
    ...row,
    complexity: row.complexity ?? normalizedComplexity,
    complexityLevel: TOPIC_COMPLEXITY_ENUM_TO_LEVEL[normalizedComplexity] ?? 1,
    orderIndex: row.order ?? 0,
  };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const { id } = await params;
    const rawBody = await request.json();

    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return NextResponse.json({ error: 'Payload too deep or large' }, { status: 400 });
    }

    const sanitizedBody = sanitizeJsonField(rawBody) as Record<string, unknown>;
    if (
      sanitizedBody?.order !== undefined &&
      sanitizedBody?.orderIndex !== undefined &&
      sanitizedBody.order !== sanitizedBody.orderIndex
    ) {
      return NextResponse.json({ error: 'Conflicting order and orderIndex values' }, { status: 400 });
    }

    const normalizedInput = {
      ...sanitizedBody,
      ...(sanitizedBody?.order === undefined && sanitizedBody?.orderIndex !== undefined
        ? { order: sanitizedBody.orderIndex }
        : {}),
    };

    const parsed = topicSchema.partial().safeParse(normalizedInput);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    const updated = await AcademicHierarchyService.updateTopic(id, parsed.data);
    if (!updated) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });

    return NextResponse.json(serializeTopic(updated));
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const accessDenied = await requireAdminRequest(_request);
  if (accessDenied) return accessDenied;

  try {
    const { id } = await params;
    const result = await AcademicHierarchyService.deleteTopic(id);
    return NextResponse.json(
      result.status === 200 ? { message: result.message } : result,
      { status: result.status }
    );
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
  }
}
