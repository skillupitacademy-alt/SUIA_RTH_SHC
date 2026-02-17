import { db, questions } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { CreateQuestionInput } from '@/modules/admin-engine/admin.engine';
import { AdminEngine } from '@/modules/admin-engine/admin.engine';
import { TokenService } from '@/modules/auth/token.service';
import { questionSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

async function _verifyAdmin(_req: NextRequest) {
    const _token = TokenService.getAccessToken(_req, { scope: 'admin' });
    if (_token === null || _token === undefined || _token.trim() === '') {
        return { _error: 'Unauthorized', scope: 'admin', status: 401 };
    }

    try {
        const _payload = await TokenService.verifyAccessToken(_token, true);
        return { userId: _payload.userId };
    } catch (_err) {
        return { _error: 'Unauthorized', status: 401 };
    }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auth = await _verifyAdmin(_req);
    if (auth._error !== undefined) return NextResponse.json({ _error: auth._error }, { status: auth.status });

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

        if (question === null || question === undefined) {
            return NextResponse.json({ _error: 'Question not found' }, { status: 404 });
        }

        return NextResponse.json(question);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        console.error('[ADMIN_QUESTION_GET] Error:', message);
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auth = await _verifyAdmin(_req);
    if (auth._error !== undefined) return NextResponse.json({ _error: auth._error }, { status: auth.status });

    try {
        const rawBody = await _req.json() as Partial<CreateQuestionInput>;
        const parsed = questionSchema.partial().safeParse(rawBody);
        const body = parsed.success ? parsed.data : rawBody;
        const result = await AdminEngine.updateQuestion(id, body, auth.userId!);
        return NextResponse.json(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        console.error('[ADMIN_QUESTION_PATCH] Error:', message);
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auth = await _verifyAdmin(_req);
    if (auth._error !== undefined) return NextResponse.json({ _error: auth._error }, { status: auth.status });

    try {
        const result = await AdminEngine.deleteQuestion(id, auth.userId!);
        return NextResponse.json(result);
    } catch (_error: unknown) {
        const message = _error instanceof Error ? _error.message : 'Internal Server Error';
        console.error('[ADMIN_QUESTION_DELETE] Error:', message);
        return NextResponse.json({ _error: message }, { status: 500 });
    }
}
