import { fetchDrilldownMetadata, fetchPerformanceBreakdown, fetchServerDashboard } from "@/lib/server-data";
import { ArrowRight, BookOpen, Calendar, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { StackedBarBreakdown } from "@/components/dashboard/StackedBarBreakdown";
import { cn } from "@/lib/utils";
import { ZPagination } from '@quiz/ui';
import { MyExamsFilters } from "@/components/islands/MyExamsFilters";

type DrilldownItem = { dimensionId?: string; name?: string };
type Activity = {
    id: string;
    status?: string | null;
    relativeTime?: string | null;
    title?: string | null;
    score?: number | null;
};

export default async function MyExamsPage(props: {
    searchParams: Promise<{
        page?: string;
        range?: string;
        domain?: string;
        subject?: string;
        topic?: string;
        view?: string;
    }>
}) {
    const searchParams = await props.searchParams;
    const currentPage = Number(searchParams.page) || 1;
    const limit = 10;
    const range = searchParams.range || '28d';
    const view = (searchParams.view as 'table' | 'trends' | 'breakdowns') || 'table';
    const filters = {
        domain: searchParams.domain || 'all',
        subject: searchParams.subject || 'all',
        topic: searchParams.topic || 'all'
    };

    // Parallel data fetching
    const [dashboardData, drilldownMetadata, performanceBreakdown] = await Promise.all([
        fetchServerDashboard(range, currentPage, limit),
        fetchDrilldownMetadata(),
        fetchPerformanceBreakdown(range)
    ]);

    const activities = dashboardData?.recentActivity || [];
    const totalCount = dashboardData?.pagination?.total || 0;
    const totalPages = dashboardData?.pagination?.totalPages || 0;

    const domains = (drilldownMetadata?.domains || []).map((d: DrilldownItem) => ({
        id: d.dimensionId ?? d.name ?? 'unknown-domain',
        name: d.name ?? 'Unknown',
    }));
    const subjects = (drilldownMetadata?.subjects || []).map((s: DrilldownItem) => ({
        id: s.dimensionId ?? s.name ?? 'unknown-subject',
        name: s.name ?? 'Unknown',
    }));
    const topics = (drilldownMetadata?.topics || []).map((t: DrilldownItem) => ({
        id: t.dimensionId ?? t.name ?? 'unknown-topic',
        name: t.name ?? 'Unknown',
    }));

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex items-center gap-5">
                <Link href="/dashboard" className="p-3 rounded-2xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all">
                    <ChevronLeft size={22} className="text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#1A1A1A] characters-tight uppercase leading-none">My Quizzes</h1>
                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest mt-2 leading-relaxed opacity-70">Detailed history of your completed assessments.</p>
                </div>
            </div>

            <div className="space-y-8">
                <MyExamsFilters
                    domains={domains}
                    subjects={subjects}
                    topics={topics}
                    currentFilters={{ ...filters, range, view }}
                />

                {activities.length === 0 && view === 'table' ? (
                    <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/10">
                        <div className="mx-auto w-20 h-20 rounded-[2rem] bg-white shadow-sm flex items-center justify-center mb-6 border border-slate-100">
                            <BookOpen size={40} className="text-rose-500/20" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">No Quizzes Found</h3>
                        <p className="text-slate-500 mt-2 max-w-sm mx-auto font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                            Launch your first quiz to start building your profile.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {view === 'table' && (
                            <div className="space-y-4">
                                <div className="grid gap-4">
                                    {activities.map((activity: Activity) => (
                                        <Link
                                            key={activity.id}
                                            href={`/reports/${activity.id}`}
                                            className="p-6 rounded-[2.5rem] border border-slate-200 bg-white hover:border-rose-500/30 hover:shadow-2xl hover:shadow-slate-200/40 transition-all group relative"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500">
                                                        <BookOpen size={28} className={cn(activity.status !== 'completed' && "animate-pulse")} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">{activity.title}</h4>
                                                        <div className="flex items-center gap-6 mt-3">
                                                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                                                                <Calendar size={13} className="text-slate-300" /> {activity.relativeTime}
                                                            </span>
                                                            {activity.score !== null && activity.score !== undefined && (
                                                                <span className={cn(
                                                                    "text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border transition-colors",
                                                                    (activity.score ?? 0) >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                                        (activity.score ?? 0) >= 50 ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                                            "bg-rose-50 text-rose-700 border-rose-100"
                                                                )}>
                                                                    {(activity.score ?? 0)}% Mastery
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                                                Vector: {activity.id.slice(0, 8).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="h-12 w-12 rounded-[1.25rem] bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-rose-500/20 group-hover:border-none transition-all duration-300 border border-slate-100">
                                                    <ArrowRight size={20} />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <ZPagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalCount={totalCount}
                                    pageSize={limit}
                                    // Note: In Server Components, we'd ideally use a wrapper that handles router.push
                                    // For now, let's assume ZPagination is interactive or we'll wrap it soon.
                                    onPageChange={() => { }}
                                    onPageSizeChange={() => { }}
                                    pageSizeOptions={[10, 25, 50]}
                                />
                            </div>
                        )}

                        {view === 'trends' && (
                            <div className="h-[450px]">
                                <ProgressChart trendData={dashboardData?.performanceTrend} />
                            </div>
                        )}

                        {view === 'breakdowns' && (
                            <div className="h-[450px]">
                                <StackedBarBreakdown data={performanceBreakdown?.breakdown || dashboardData?.drilldownBreakdown} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
