import { requireAdminRequest } from '@/lib/admin-route-guard';
import { AcademicHierarchyService } from '@/lib/hierarchy/academic-hierarchy.service';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { subtopicSchema } from '@/schemas/hierarchy.schemas';
import { NextRequest, NextResponse } from 'next/server';

function serializeSubtopic<T extends { depth?: number | null; order?: number | null }>(row: T) {
  return {
    ...row,
    depth: row.depth ?? 1,
    depthLevel: row.depth ?? 1,
    order: row.order ?? 0,
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

    const sanitizedBody = sanitizeJsonField(rawBody);
    const parsed = subtopicSchema.partial().safeParse(sanitizedBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    const updated = await AcademicHierarchyService.updateSubtopic(id, parsed.data);
    if (!updated) return NextResponse.json({ error: 'Subtopic not found' }, { status: 404 });

    return NextResponse.json(serializeSubtopic(updated));
  } catch (error) {
    console.error('Error updating subtopic:', error);
    return NextResponse.json({ error: 'Failed to update subtopic' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const accessDenied = await requireAdminRequest(_request);
  if (accessDenied) return accessDenied;

  try {
    const { id } = await params;
    const result = await AcademicHierarchyService.deleteSubtopic(id);
    return NextResponse.json(
      result.status === 200 ? { message: result.message } : result,
      { status: result.status }
    );
  } catch (error) {
    console.error('Error deleting subtopic:', error);
    return NextResponse.json({ error: 'Failed to delete subtopic' }, { status: 500 });
  }
}
