import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getApiBase } from '@/utils/apiBase';
import { QuestionCounts, applyBffCacheHeaders } from '@quiz/api-client';

function getInternalApiBase(): string {
    const internal = process.env.INTERNAL_API_URL?.trim();
    if (internal) {
        const withoutTrailingSlash = internal.replace(/\/+$/, '');
        return withoutTrailingSlash.toLowerCase().endsWith('/api')
            ? withoutTrailingSlash
            : `${withoutTrailingSlash}/api`;
    }
    return getApiBase();
}

async function getAuthHeaders() {
    let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
    try {
        cookieStore = await cookies();
    } catch {
        return {
            headers: {
                Cookie: '',
            },
        };
    }

    const cookieParts = cookieStore
        .getAll()
        .map(({ name, value }) => `${name}=${value}`)
        .join('; ');

    return {
        headers: {
            Cookie: cookieParts,
        },
    };
}

function parseList(value: string | null): string[] {
    if (!value) return [];
    return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export async function GET(req: NextRequest) {
    const { headers } = await getAuthHeaders();
    const apiUrl = getInternalApiBase();

    const domainId = req.nextUrl.searchParams.get('domainId');
    if (!domainId) {
        return NextResponse.json({ error: 'domainId is required' }, { status: 400 });
    }

    const subjectIds = parseList(req.nextUrl.searchParams.get('subjectIds'));
    const topicIds = parseList(req.nextUrl.searchParams.get('topicIds'));
    const subtopicIds = parseList(req.nextUrl.searchParams.get('subtopicIds'));

    const payload: {
        domainId: string;
        subjects?: string[];
        topicIds?: string[];
        subtopicIds?: string[];
    } = {
        domainId,
    };

    if (subjectIds.length > 0) payload.subjects = subjectIds;
    if (topicIds.length > 0) payload.topicIds = topicIds;
    if (subtopicIds.length > 0) payload.subtopicIds = subtopicIds;

    const res = await fetch(`${apiUrl}/quiz/count`, {
        method: 'POST',
        headers: {
            ...headers,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        next: { revalidate: 300 }
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        return applyBffCacheHeaders(
            NextResponse.json(
                { error: 'Failed to fetch question counts', details: body },
                { status: res.status }
            ),
            'BFF_NOCACHE'
        );
    }

    const counts = (await res.json()) as QuestionCounts;

    return applyBffCacheHeaders(
        NextResponse.json({
            questionCount: counts,
            minQuestions: 5,
            maxQuestions: 30,
            availableBlueprints: [] as Array<{ id: string; name: string }>,
        }),
        'BFF_AGGREGATE'
    );
}
