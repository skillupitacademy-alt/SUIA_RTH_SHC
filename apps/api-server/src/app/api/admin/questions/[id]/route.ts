import { db, questions } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { badRequest, notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { AdminQuestionEngine } from "@/modules/admin-engine/admin.engine";
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { questionSchema } from '@/schemas/admin.schemas';

export const dynamic = 'force-dynamic';

async function _verifyAdmin(_req: NextRequest) {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'admin' });
    if (_token === undefined || _token === null || _token.trim() === '') {
        throw unauthorized('Unauthorized', 'UNAUTHORIZED');
    }
    return await container.get(TokenService).verifyAccessToken(_token, true);
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

        if (!question) {
            return ApiResponse.error(notFound('Question', id));
        }

        return ApiResponse.success(question);
    } catch (_error: unknown) {
        return ApiResponse.error(_error);
    }
}

async function patchHandler(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const auth = await _verifyAdmin(_req);
        const rawBody = await _req.json();
        
        if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
          return ApiResponse.error(badRequest('Payload too deep or large'));
        }

        const sanitizedBody = sanitizeJsonField(rawBody);
        const parsed = questionSchema.partial().safeParse(sanitizedBody);
        
        if (!parsed.success) {
          return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
        }

        const result = await AdminQuestionEngine.updateQuestion(id, parsed.data, auth.userId!);
        return ApiResponse.success(result);
    } catch (_error: unknown) {
        return ApiResponse.error(_error);
    }
}

async function deleteHandler(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const auth = await _verifyAdmin(_req);
        const result = await AdminQuestionEngine.deleteQuestion(id, auth.userId!);
        return ApiResponse.success(result);
    } catch (_error: unknown) {
        return ApiResponse.error(_error);
    }
}

export const GET = withLogging(getHandler, { component: 'admin', operation: 'get_question' });
export const PATCH = withLogging(patchHandler, { component: 'admin', operation: 'update_question' });
export const DELETE = withLogging(deleteHandler, { component: 'admin', operation: 'delete_question' });
