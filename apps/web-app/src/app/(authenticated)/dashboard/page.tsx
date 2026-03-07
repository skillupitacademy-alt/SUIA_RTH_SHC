import { StatsGrid } from "@/components/dashboard/StatsCards";
import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TutorInsightCard } from "@/components/tutor/TutorInsightCard";
import { DashboardHeaderActions } from "@/components/islands/DashboardHeaderActions";
import { getServerSession, fetchServerDashboard } from "@/lib/server-data";
import { redirect } from "next/navigation";

type RecentActivity = {
    id: string;
    status?: string | null;
    relativeTime?: string | null;
    title?: string | null;
    score?: number | null;
};

export default async function DashboardPage() {
    const user = await getServerSession();

    if (!user) {
        redirect('/login');
    }

    let data;
    try {
        data = await fetchServerDashboard('7d', 1, 3);
    } catch (err) {
        console.error('[Dashboard] Error fetching dashboard data:', err);
        // We still show the page layout even if data fails
    }

    return (
        <div className="space-y-10">
            {/* Debug Marker */}
            <div className="hidden">RENDER_READY_USER_{user.id}</div>

            {fetchError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-bold text-sm">
                    Dashboard Data Error: {fetchError}
                </div>
            )}
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard Overview</h1>
                    <p className="text-muted-foreground font-medium">Welcome back, <span className="text-pink-600 font-bold">{user?.name || 'User'}</span>! Let&apos;s see your progress.</p>
                </div>
                <DashboardHeaderActions />
            </div>

            {/* Stats Section */}
            <StatsGrid overview={data?.overview} deltaPct={data?.deltaPct} healthStatus={data?.healthStatus} />

            <div className="grid lg:grid-cols-4 gap-8 mt-10">
                <div className="lg:col-span-3 space-y-8">
                    <TutorInsightCard />
                </div>
                <div className="space-y-6">
                    <h3 className="text-xl font-bold px-1 text-slate-900 tracking-tight">Recent Activity</h3>
                    <div className="space-y-4">
                        {!data?.recentActivity || data.recentActivity.length === 0 ? (
                            <div className="p-8 text-center border-2 border-slate-200 rounded-[2rem] bg-slate-50 text-slate-600">
                                <p className="text-sm font-medium">No exams taken yet</p>
                            </div>
                        ) : (
                            data.recentActivity.map((activity: RecentActivity) => (
                                <div key={activity.id} className="p-5 rounded-[1.5rem] border border-slate-200 bg-white hover:border-pink-500/30 transition-all group shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                    activity.status === 'completed' ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"
                                                )}>
                                                    {activity.status}
                                                </p>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{activity.relativeTime}</span>
                                            </div>
                                            <h4 className="font-extrabold text-slate-800 truncate max-w-[150px]">{activity.title}</h4>
                                            {activity.score !== null && (
                                                <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-2">
                                                    <BookOpen size={14} className="text-pink-500" /> Score: {activity.score}%
                                                </p>
                                            )}
                                        </div>
                                        <Link href={activity.status === 'completed' ? `/reports/${activity.id}` : `/exam/${activity.id}`} className="h-10 w-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                            <ArrowRight size={18} />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <Link href="/dashboard/my-exams" className="flex items-center justify-center w-full py-4 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:border-pink-500 hover:text-pink-500 hover:bg-pink-50 transition-all">
                        View All Quizzes
                    </Link>
                </div>
            </div>
        </div>
    );
}
