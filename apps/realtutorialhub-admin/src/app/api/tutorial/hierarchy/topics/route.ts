import { db, tutorialTopics } from '@quiz/db-tutorial';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { isTutorialAuthError, logRouteError, requireAdmin } from '@/lib/tutorial-content-api';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
    subjectId: z.string().uuid(),
});

function serializeDate(value: Date | null | undefined) {
    return value instanceof Date ? value.toISOString() : null;
}

export async function GET(req: NextRequest) {
    try {
        await requireAdmin(req);
    } catch (error) {
        if (isTutorialAuthError(error)) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = querySchema.safeParse({
        subjectId: req.nextUrl.searchParams.get('subjectId') ?? undefined,
    });

    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid query', issues: parsed.error.issues }, { status: 400 });
    }

    try {
        const rows = await db.select().from(tutorialTopics);
        const data = rows
            .filter((row) => row.deletedAt == null && row.subjectId === parsed.data.subjectId)
            .sort((left, right) => left.name.localeCompare(right.name))
            .map((row) => ({
                id: row.id,
                externalId: row.externalId,
                subjectId: row.subjectId,
                name: row.name,
                slug: row.slug,
                deletedAt: serializeDate(row.deletedAt),
                createdAt: row.createdAt.toISOString(),
                updatedAt: row.updatedAt.toISOString(),
            }));

        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        logRouteError('Tutorial hierarchy topics load failed', error, { route: 'GET /api/tutorial/hierarchy/topics' });
        return NextResponse.json({ error: 'Failed to load hierarchy topics' }, { status: 500 });
    }
}
