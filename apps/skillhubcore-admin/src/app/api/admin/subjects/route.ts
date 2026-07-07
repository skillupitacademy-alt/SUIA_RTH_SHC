import { db, subjects } from '@quiz/db-skillhubcore';
import { eq, ilike, and, isNull, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const domainId = searchParams.get('domainId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');

    const conditions = [isNull(subjects.deletedAt)];
    
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
      .select()
      .from(subjects)
      .where(and(...conditions))
      .orderBy(desc(subjects.createdAt))
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return NextResponse.json({ data, nextCursor, hasMore });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, domainId, status = 'active', order = 0 } = body;

    if (!name || !domainId) {
      return NextResponse.json({ error: 'Name and domainId are required' }, { status: 400 });
    }

    const [newSubject] = await db.insert(subjects).values({
      name, description, domainId, status, order,
    }).returning();

    return NextResponse.json(newSubject, { status: 201 });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, status, order } = body;

    if (!id) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (order !== undefined) updateData.order = order;

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
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    if (!id && !ids) {
      return NextResponse.json({ error: 'Subject ID or IDs required' }, { status: 400 });
    }

    if (ids) {
      const idArray = ids.split(',');
      await db.update(subjects).set({ deletedAt: new Date() }).where(eq(subjects.id, idArray as any));
      return NextResponse.json({ message: `${idArray.length} subjects deleted` });
    } else {
      const [deleted] = await db.update(subjects).set({ deletedAt: new Date() }).where(eq(subjects.id, id!)).returning();
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