import { cookies } from "next/headers";
import { getServerSession, fetchServerDashboard } from "@/lib/server-data";
import DashboardClientFallback from "@/components/dashboard/DashboardClientFallback";

export default async function DashboardPage() {
    // === DIAGNOSTIC: Prove server component runs ===
    const cookieStore = await cookies();
    const allCookieNames = cookieStore.getAll().map(c => c.name);
    const hasAccessToken = cookieStore.has('accessToken');
    console.log(`[SSR:DashboardPage] Server component executing. Cookies present: [${allCookieNames.join(', ')}]. accessToken: ${hasAccessToken}`);
    // === END DIAGNOSTIC ===

    // Try server-side data fetch — graceful fallback if it fails
    let serverUser = null;
    let serverData = null;

    try {
        serverUser = await getServerSession();
        if (serverUser) {
            serverData = await fetchServerDashboard('7d', 1, 3);
        }
    } catch {
        // Server-side fetch failed — client fallback will handle it
        console.error('[DashboardPage] Server-side fetch failed, falling back to client-side rendering');
    }

    return (
        <DashboardClientFallback
            serverUser={serverUser}
            serverData={serverData}
        />
    );
}
