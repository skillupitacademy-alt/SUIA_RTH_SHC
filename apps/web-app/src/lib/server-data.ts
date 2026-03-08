import { cookies } from 'next/headers';
import { getApiBase } from '@/utils/apiBase';

export async function getServerSession() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) return null;

    try {
        const apiUrl = getApiBase();
        const res = await fetch(`${apiUrl}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Cookie': cookieStore.toString()
            },
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
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    try {
        const apiUrl = getApiBase();
        const res = await fetch(`${apiUrl}/dashboard?range=${range}&page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': accessToken ? `Bearer ${accessToken}` : '',
                'Cookie': cookieStore.toString()
            },
            next: { revalidate: 60 } // Cache for 1 minute
        });

        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('Error fetching server dashboard:', error);
        return null;
    }
}

export async function fetchDrilldownMetadata() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    const apiUrl = getApiBase();
    const res = await fetch(`${apiUrl}/dashboard/performance/metadata`, {
        headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : '',
            'Cookie': cookieStore.toString()
        },
        next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) return null;
    return res.json();
}

export async function fetchPerformanceBreakdown(range = '28d') {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    const apiUrl = getApiBase();
    const res = await fetch(`${apiUrl}/dashboard/performance/breakdown?range=${range}`, {
        headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : '',
            'Cookie': cookieStore.toString()
        },
        next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!res.ok) return null;
    return res.json();
}
