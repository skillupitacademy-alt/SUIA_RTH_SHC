import { NextRequest, NextResponse } from 'next/server';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { verifyAdmin } from '@/modules/auth/rbac.service';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const token = TokenService.getAccessToken(req);
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await TokenService.verifyAccessToken(token);

        if (!(await verifyAdmin(payload))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const data = await AdminEngine.getSkillsByTopic(id);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[TOPIC_SKILLS_GET] Error:', error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const token = TokenService.getAccessToken(req);
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await TokenService.verifyAccessToken(token);

        if (!(await verifyAdmin(payload))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json(); // Expected { skillIds: string[] }
        const result = await AdminEngine.mapTopicToSkills(id, body.skillIds, payload.userId);
        
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[TOPIC_SKILLS_POST] Error:', error.message);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
