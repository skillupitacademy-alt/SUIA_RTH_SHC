import { db, questions } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withLogging } from '@/lib/withLogging';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { questionSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

async function _verifyAdmin(_req: NextRequest) {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        throw new Error('Unauthorized');
    }
    return await TokenService.verifyAccessToken(_token, true);
}

async function getHandler(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await _verifyAdmin(_req);
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

        if (question === null || question === undefined) {
            return NextResponse.json({ _error: 'Question not found' }, { status: 404 });
        }

        return NextResponse.json(question);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

async function patchHandler(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const auth = await _verifyAdmin(_req);
        const rawBody = await _req.json();
        const parsed = questionSchema.partial().safeParse(rawBody);
        if (!parsed.success) {
          return NextResponse.json({ _error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
        }
        const result = await AdminEngine.updateQuestion(id, parsed.data, auth.userId!);
        return NextResponse.json(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

async function deleteHandler(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const auth = await _verifyAdmin(_req);
        const result = await AdminEngine.deleteQuestion(id, auth.userId!);
        return NextResponse.json(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

export const GET = withLogging(getHandler, { component: 'admin', operation: 'get_question' });
export const PATCH = withLogging(patchHandler, { component: 'admin', operation: 'update_question' });
export const DELETE = withLogging(deleteHandler, { component: 'admin', operation: 'delete_question' });
