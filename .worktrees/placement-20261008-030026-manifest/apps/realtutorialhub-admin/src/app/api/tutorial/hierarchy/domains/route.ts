import { db, tutorialDomains } from '@quiz/db-tutorial';
import { NextRequest, NextResponse } from 'next/server';

import { isTutorialAuthError, logRouteError, requireAdmin } from '@/lib/tutorial-content-api';

export const dynamic = 'force-dynamic';

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

    try {
        const rows = await db.select().from(tutorialDomains);
        const data = rows
            .filter((row) => row.deletedAt == null)
            .sort((left, right) => left.name.localeCompare(right.name))
            .map((row) => ({
                id: row.id,
                externalId: row.externalId,
                name: row.name,
                slug: row.slug,
                deletedAt: serializeDate(row.deletedAt),
                createdAt: row.createdAt.toISOString(),
                updatedAt: row.updatedAt.toISOString(),
            }));

        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        logRouteError('Tutorial hierarchy domains load failed', error, { route: 'GET /api/tutorial/hierarchy/domains' });
        return NextResponse.json({ error: 'Failed to load hierarchy domains' }, { status: 500 });
    }
}
