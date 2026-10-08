import { db, tutorialSubtopics } from '@quiz/db-tutorial';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { isTutorialAuthError, logRouteError, requireAdmin } from '@/lib/tutorial-content-api';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
    topicId: z.string().uuid(),
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
        topicId: req.nextUrl.searchParams.get('topicId') ?? undefined,
    });

    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid query', issues: parsed.error.issues }, { status: 400 });
    }

    try {
        const rows = await db.select().from(tutorialSubtopics);
        const data = rows
            .filter((row) => row.deletedAt == null && row.topicId === parsed.data.topicId)
            .sort((left, right) => left.name.localeCompare(right.name))
            .map((row) => ({
                id: row.id,
                externalId: row.externalId,
                topicId: row.topicId,
                name: row.name,
                slug: row.slug,
                difficultyLevels: row.difficultyLevels,
                deletedAt: serializeDate(row.deletedAt),
                createdAt: row.createdAt.toISOString(),
                updatedAt: row.updatedAt.toISOString(),
            }));

        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        logRouteError('Tutorial hierarchy subtopics load failed', error, { route: 'GET /api/tutorial/hierarchy/subtopics' });
        return NextResponse.json({ error: 'Failed to load hierarchy subtopics' }, { status: 500 });
    }
}
