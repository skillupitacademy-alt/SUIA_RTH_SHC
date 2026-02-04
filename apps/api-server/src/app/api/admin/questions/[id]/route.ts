import { NextRequest, NextResponse } from 'next/server';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { db, userRoles, roles, questions } from '@quiz/db';
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auth = await verifyAdmin(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const question = await db.query.questions.findFirst({
            where: eq(questions.id, id),
            with: {
                questionSkills: true,
                topic: {
                    with: {
                        subject: {
                            with: {
                                domain: true
                            }
                        }
                    }
                }
            }
        });

        if (!question) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        return NextResponse.json(question);
    } catch (error: any) {
        console.error('[ADMIN_QUESTION_GET] Error:', error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auth = await verifyAdmin(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const body = await req.json();
        const result = await AdminEngine.updateQuestion(id, body, auth.userId!);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[ADMIN_QUESTION_PATCH] Error:', error.message);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auth = await verifyAdmin(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const result = await AdminEngine.deleteQuestion(id, auth.userId!);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[ADMIN_QUESTION_DELETE] Error:', error.message);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
