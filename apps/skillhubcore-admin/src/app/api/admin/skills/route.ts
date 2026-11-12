import { requireAdminRequest } from '@/lib/admin-route-guard';
import { AcademicHierarchyService } from '@/lib/hierarchy/academic-hierarchy.service';
import { parsePaginationLimit } from '@/lib/pagination-helper';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { skillSchema } from '@/schemas/hierarchy.schemas';
import { getDb, skills } from '@quiz/db';
import { and, desc, eq, ilike } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') as 'technical' | 'cognitive' | 'process' | null;
    const limit = parsePaginationLimit(searchParams.get('limit'));

    const conditions = [];
    if (search) conditions.push(ilike(skills.name, `%${search}%`));
    if (category) conditions.push(eq(skills.category, category));

    const results = await db
      .select()
      .from(skills)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(skills.createdAt))
      .limit(limit + 1);
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;

    return NextResponse.json({ data, nextCursor: hasMore ? data[data.length - 1]?.id : null, hasMore });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const rawBody = await request.json();

    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return NextResponse.json({ error: 'Payload too deep or large' }, { status: 400 });
    }

    const sanitizedBody = sanitizeJsonField(rawBody);
    const parsed = skillSchema.safeParse(sanitizedBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    const newSkill = await AcademicHierarchyService.createSkill(parsed.data);

    return NextResponse.json(newSkill, { status: 201 });
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const rawBody = await request.json();

    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return NextResponse.json({ error: 'Payload too deep or large' }, { status: 400 });
    }

    const sanitizedBody = sanitizeJsonField(rawBody) as Record<string, unknown>;
    const id = typeof sanitizedBody?.id === 'string' ? sanitizedBody.id : '';

    if (!id) return NextResponse.json({ error: 'Skill ID required' }, { status: 400 });

    const parsed = skillSchema.partial().safeParse(sanitizedBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    const updated = await AcademicHierarchyService.updateSkill(id, parsed.data);

    if (!updated) return NextResponse.json({ error: 'Skill not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating skill:', error);
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    if (!id && !ids) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (ids) {
      const idArray = ids.split(',').map((s) => s.trim()).filter(Boolean);
      const result = await AcademicHierarchyService.batchDeleteSkills({ ids: idArray });
      return NextResponse.json(
        result.status === 200 ? { message: result.message } : result,
        { status: result.status }
      );
    } else {
      const result = await AcademicHierarchyService.deleteSkill(id!);
      return NextResponse.json(
        result.status === 200 ? { message: result.message } : result,
        { status: result.status }
      );
    }
  } catch (error) {
    console.error('Error deleting skill:', error);
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
  }
}
