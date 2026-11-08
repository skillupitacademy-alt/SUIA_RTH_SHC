import { requireAdminRequest } from '@/lib/admin-route-guard';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { subjectSchema } from '@/schemas/hierarchy.schemas';
import { domains, getDb, subjects } from '@quiz/db';
import { and, desc, eq, ilike, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const domainId = searchParams.get('domainId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');

    const conditions = [];

    if (search) {
      conditions.push(ilike(subjects.name, `%${search}%`));
    }

    if (domainId) {
      conditions.push(eq(subjects.domainId, domainId));
    }

    if (cursor) {
      conditions.push(eq(subjects.id, cursor));
    }

    const results = await db
      .select({
        subject: subjects,
        domain: domains,
      })
      .from(subjects)
      .leftJoin(domains, eq(subjects.domainId, domains.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(subjects.createdAt))
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const rows = hasMore ? results.slice(0, limit) : results;
    const data = rows.map(({ subject, domain }) => ({
      ...subject,
      domain:
        domain !== null
          ? {
              id: domain.id,
              name: domain.name,
            }
          : undefined,
    }));
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return NextResponse.json({ data, nextCursor, hasMore });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
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
    const parsed = subjectSchema.safeParse(sanitizedBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    const body = parsed.data;
    const db = getDb();

    const [newSubject] = await db
      .insert(subjects)
      .values({
        name: body.name,
        description: body.description,
        domainId: body.domainId,
        status: body.status ?? 'active',
        order: body.order ?? 0,
      })
      .returning();

    return NextResponse.json(newSubject, { status: 201 });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
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

    if (!id) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
    }

    const parsed = subjectSchema.partial().safeParse(sanitizedBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    const { name, description, domainId, status, order } = parsed.data;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (domainId !== undefined) updateData.domainId = domainId;
    if (status !== undefined) updateData.status = status;
    if (order !== undefined) updateData.order = order;

    const db = getDb();
    const [updated] = await db.update(subjects).set(updateData).where(eq(subjects.id, id)).returning();

    if (!updated) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    if (!id && !ids) {
      return NextResponse.json({ error: 'Subject ID or IDs required' }, { status: 400 });
    }

    const db = getDb();

    if (ids) {
      const idArray = ids.split(',');
      await db.delete(subjects).where(inArray(subjects.id, idArray));
      return NextResponse.json({ message: `${idArray.length} subjects deleted` });
    } else {
      const [deleted] = await db.delete(subjects).where(eq(subjects.id, id!)).returning();
      if (!deleted) {
        return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Subject deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}
