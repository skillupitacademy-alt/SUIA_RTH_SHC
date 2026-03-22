import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getApiBase } from '@/utils/apiBase';
import { Domain, DomainHierarchy, applyBffCacheHeaders } from '@quiz/api-client';

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
            accessToken: undefined,
            headers: {
                Authorization: '',
                Cookie: '',
            },
        };
    }

    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;
    const csrfToken = cookieStore.get('csrfToken')?.value;

    const cookieParts = [
        accessToken ? `accessToken=${accessToken}` : '',
        refreshToken ? `refreshToken=${refreshToken}` : '',
        csrfToken ? `csrfToken=${csrfToken}` : '',
    ].filter(Boolean).join('; ');

    return {
        accessToken,
        headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : '',
            Cookie: cookieParts,
        },
    };
}

export async function GET() {
    const { headers } = await getAuthHeaders();
    const apiUrl = getInternalApiBase();

    const domainsRes = await fetch(`${apiUrl}/domains`, {
        headers,
        next: { revalidate: 300 }
    });

    if (!domainsRes.ok) {
        const body = await domainsRes.text().catch(() => '');
        return applyBffCacheHeaders(
            NextResponse.json(
                { error: 'Failed to fetch domains', details: body },
                { status: domainsRes.status }
            ),
            'BFF_NOCACHE'
        );
    }

    const domains = (await domainsRes.json()) as Domain[];

    try {
        const hierarchies = await Promise.all(
            domains.map(async (domain) => {
                const hierarchyRes = await fetch(`${apiUrl}/domains?id=${domain.id}`, {
                    headers,
                    next: { revalidate: 300 }
                });

                if (!hierarchyRes.ok) {
                    const body = await hierarchyRes.text().catch(() => '');
                    throw new Error(`Hierarchy fetch failed for ${domain.id}: ${hierarchyRes.status} ${body}`);
                }

                return hierarchyRes.json() as Promise<DomainHierarchy>;
            })
        );

        return applyBffCacheHeaders(
            NextResponse.json({ domains: hierarchies }),
            'BFF_AGGREGATE'
        );
    } catch (error) {
        return applyBffCacheHeaders(
            NextResponse.json(
                { error: 'Failed to fetch domain hierarchy', details: error instanceof Error ? error.message : 'unknown' },
                { status: 502 }
            ),
            'BFF_NOCACHE'
        );
    }
}
