import { NextRequest, NextResponse } from 'next/server';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { db, userRoles, roles } from '@quiz/db';
import { eq, and, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function verifyAdmin(req: NextRequest) {
    const token = TokenService.getAccessToken(req);
    if (!token) {
        return { error: 'Unauthorized', status: 401 };
    }

    try {
        const payload = await TokenService.verifyAccessToken(token);

        const userRole = await db.select()
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(and(
                eq(userRoles.userId, payload.userId),
                inArray(roles.name, ['admin', 'ADMIN', 'super_admin', 'SUPER_ADMIN'])
            ))
            .limit(1);

        if (userRole.length === 0) {
            return { error: 'Forbidden', status: 403 };
        }

        return { userId: payload.userId };
    } catch (err) {
        return { error: 'Unauthorized', status: 401 };
    }
}

export async function POST(req: NextRequest) {
    const auth = await verifyAdmin(req);
    //@ts-ignore
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { ids } = await req.json();
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Missing or invalid IDs' }, { status: 400 });
        }

        //@ts-ignore
        const result = await AdminEngine.deleteSkillsBatch(ids, auth.userId!);
        return NextResponse.json({
            success: true,
            deletedCount: result.length,
            ids: result.map(r => r.id)
        });
    } catch (error: any) {
        console.error('[ADMIN_SKILLS_BATCH_DELETE] Error:', error.message);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
