/* eslint-disable @typescript-eslint/no-explicit-any */
import { domains, getDb } from '@quiz/db';
import { and, desc, eq, ilike, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/domains - List domains with pagination and search
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');

    const conditions = [];
    
    if (search) {
      conditions.push(ilike(domains.name, `%${search}%`));
    }

    if (cursor) {
      conditions.push(eq(domains.id, cursor));
    }

    // Fetch domains
    const results = await db
      .select()
      .from(domains)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(domains.createdAt))
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return NextResponse.json({
      data,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

// POST /api/admin/domains - Create a new domain
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, description, category, status = 'active' } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    const [newDomain] = await db
      .insert(domains)
      .values({
        name,
        description,
        category,
        status,
      })
      .returning();

    return NextResponse.json(newDomain, { status: 201 });
  } catch (error) {
    console.error('Error creating domain:', error);
    return NextResponse.json(
      { error: 'Failed to create domain' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/domains - Update a domain
export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, name, description, category, status, order } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Domain ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    void order;

    const [updatedDomain] = await db
      .update(domains)
      .set(updateData)
      .where(eq(domains.id, id))
      .returning();

    if (!updatedDomain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedDomain);
  } catch (error) {
    console.error('Error updating domain:', error);
    return NextResponse.json(
      { error: 'Failed to update domain' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/domains - Delete a domain (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    if (!id && !ids) {
      return NextResponse.json(
        { error: 'Domain ID or IDs are required' },
        { status: 400 }
      );
    }

    if (ids) {
      const idArray = ids.split(',');
      await db
        .delete(domains)
        .where(inArray(domains.id, idArray));

      return NextResponse.json({ 
        message: `${idArray.length} domains deleted successfully` 
      });
    } else {
      const [deletedDomain] = await db
        .delete(domains)
        .where(eq(domains.id, id!))
        .returning();

      if (!deletedDomain) {
        return NextResponse.json(
          { error: 'Domain not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ 
        message: 'Domain deleted successfully' 
      });
    }
  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}
