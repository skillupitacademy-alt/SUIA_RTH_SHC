import { cookies } from 'next/headers';
import { getApiBase } from '@/utils/apiBase';

/**
 * Build a valid Cookie header string from the Next.js cookie store.
 * cookieStore.toString() is unreliable in Next.js 16 — manually serialize.
 */
async function getAuthHeaders() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;
    const csrfToken = cookieStore.get('csrfToken')?.value;

    // Manually build Cookie header (cookieStore.toString() is unreliable)
    const cookieParts = [
        accessToken ? `accessToken=${accessToken}` : '',
        refreshToken ? `refreshToken=${refreshToken}` : '',
        csrfToken ? `csrfToken=${csrfToken}` : '',
    ].filter(Boolean).join('; ');

    return {
        accessToken,
        headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : '',
            'Cookie': cookieParts,
        },
    };
}

export async function getServerSession() {
    const { accessToken, headers } = await getAuthHeaders();

    if (!accessToken) return null;

    try {
        const apiUrl = getApiBase();
        const res = await fetch(`${apiUrl}/auth/me`, {
            headers,
            next: { revalidate: 0 }
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data.user || null;
    } catch (error) {
        console.error('Error fetching server session:', error);
        return null;
    }
}

export async function fetchServerDashboard(range = '7d', page = 1, limit = 3) {
    const { headers } = await getAuthHeaders();

    try {
        const apiUrl = getApiBase();
        const res = await fetch(`${apiUrl}/dashboard?range=${range}&page=${page}&limit=${limit}`, {
            headers,
            next: { revalidate: 60 }
        });

        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('Error fetching server dashboard:', error);
        return null;
    }
}

export async function fetchDrilldownMetadata() {
    const { headers } = await getAuthHeaders();

    try {
        const apiUrl = getApiBase();
        const res = await fetch(`${apiUrl}/dashboard/performance/metadata`, {
            headers,
            next: { revalidate: 3600 }
        });

        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('Error fetching drilldown metadata:', error);
        return null;
    }
}

export async function fetchPerformanceBreakdown(range = '28d') {
    const { headers } = await getAuthHeaders();

    try {
        const apiUrl = getApiBase();
        const res = await fetch(`${apiUrl}/dashboard/performance/breakdown?range=${range}`, {
            headers,
            next: { revalidate: 300 }
        });

        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('Error fetching performance breakdown:', error);
        return null;
    }
}
