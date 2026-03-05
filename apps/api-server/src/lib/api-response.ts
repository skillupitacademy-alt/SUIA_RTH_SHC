import { NextResponse } from 'next/server';

import { ApiError } from './api-error';

/**
 * Standardized API Response Helpers (Task 45)
 */

export class ApiResponse {
    static success<T>(data: T, status: number = 200, headers: Record<string, string> = {}) {
        return NextResponse.json(data, { status, headers });
    }

    static created<T>(data: T) {
        return this.success(data, 201);
    }

    static noContent() {
        return new NextResponse(null, { status: 204 });
    }

    static error(err: unknown, status: number = 500, requestId?: string, headers: Record<string, string> = {}) {
        const apiError = ApiError.fromError(err, status, requestId);
        return NextResponse.json(apiError.toResponse(), { status: apiError.status, headers });
    }

    static paginated<T>(data: T[], total: number, page: number, limit: number) {
        return NextResponse.json({
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
}
