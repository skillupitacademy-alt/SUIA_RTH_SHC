'use client';

import { Sidebar } from "@/components/dashboard/Sidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useDashboardStore } from "@/store/dashboard-store";
import { useEffect, useState, useMemo } from "react";
import { BookOpen, Calendar, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { ZLoader } from "@/components/ui/ZLoader";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { StackedBarBreakdown } from "@/components/dashboard/StackedBarBreakdown";
import { cn } from "@/lib/utils";
import { Filter, BarChart2, List, TrendingUp, Info } from 'lucide-react';

const ITEMS_PER_PAGE = 6;

export default function MyExamsPage() {
    const { data, fetchDashboard, fetchPerformanceTrend, fetchDrilldownMetadata, fetchDrilldownAnalytics, loading } = useDashboardStore();
    const [currentPage, setCurrentPage] = useState(1);
    const [range, setRange] = useState('28d');
    const [view, setView] = useState<'table' | 'trends' | 'breakdowns'>('table');

    // Dimension Filters
    const [domainFilter, setDomainFilter] = useState('all');
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [topicFilter, setTopicFilter] = useState('all');

    useEffect(() => {
        // Initial fetch: 28 days history + metadata
        fetchDashboard(range, currentPage, ITEMS_PER_PAGE);
        fetchDrilldownMetadata();
        fetchDrilldownAnalytics(range);
    }, [fetchDashboard, fetchDrilldownMetadata, fetchDrilldownAnalytics, currentPage, range]);

    const handleRangeChange = (newRange: string) => {
        if (newRange === '90d') return; // Strictly enforced contract
        setRange(newRange);
        fetchPerformanceTrend(newRange);
        fetchDrilldownAnalytics(newRange);
    };

    // Direct access to activities (already paginated by server)
    const activities = data?.recentActivity || [];
    const totalCount = data?.pagination?.total || 0;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // Filter metadata
    const allDomains = data?.drilldownMetadata?.domains || [];
    const allSubjects = data?.drilldownMetadata?.subjects || [];
    const allTopics = data?.drilldownMetadata?.topics || [];

    // Cascading Filter Logic
    const availableDomains = allDomains;
    const availableSubjects = subjectFilter === 'all'
        ? allSubjects
        : allSubjects; // In real-world, would filter by domainId if metadata included parentId

    // For better UX, we'll just use the raw metadata arrays since they represent attempted dims
    const domains = availableDomains;
    const subjects = allSubjects;
    const topics = allTopics;

    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
            // Scroll to top on page change
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrev = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <AuthGuard>
            <div className="flex min-h-[calc(100vh-64px)] bg-white">
                <Sidebar />
                <main className="flex-1 p-6 md:p-10 pb-24 md:pb-10 space-y-8 overflow-y-auto">
                    {/* Header Section */}
                    <div className="flex items-center gap-5">
                        <Link href="/dashboard" className="p-3 rounded-2xl border bg-white shadow-sm hover:bg-slate-50 transition-all">
                            <ChevronLeft size={22} className="text-slate-600" />
                        </Link>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#1A1A1A] characters-tight">My Quizzes</h1>
                            <p className="text-slate-500 font-medium text-base">Detailed history of your completed assessments.</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Filter Bar */}
                        <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500 mr-2">
                                <Filter size={18} />
                                <span className="text-xs font-black uppercase tracking-widest">Filters</span>
                            </div>

                            <select
                                value={range}
                                onChange={(e) => handleRangeChange(e.target.value)}
                                className="px-4 py-2 rounded-xl border bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FF2D55]/20"
                            >
                                <option value="7d">Last 7 Days</option>
                                <option value="14d">Last 14 Days</option>
                                <option value="28d">Last 28 Days</option>
                                <option value="90d" disabled>Last 90 Days (Coming Soon)</option>
                            </select>

                            <select
                                value={domainFilter}
                                onChange={(e) => setDomainFilter(e.target.value)}
                                className="px-4 py-2 rounded-xl border bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FF2D55]/20"
                            >
                                <option value="all">All Domains</option>
                                {domains.map(d => (
                                    <option key={d.dimensionId} value={d.dimensionId}>{d.name}</option>
                                ))}
                            </select>

                            <select
                                value={subjectFilter}
                                onChange={(e) => setSubjectFilter(e.target.value)}
                                className="px-4 py-2 rounded-xl border bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FF2D55]/20"
                            >
                                <option value="all">All Subjects</option>
                                {subjects.map(s => (
                                    <option key={s.dimensionId} value={s.dimensionId}>{s.name}</option>
                                ))}
                            </select>

                            <select
                                value={topicFilter}
                                onChange={(e) => setTopicFilter(e.target.value)}
                                className="px-4 py-2 rounded-xl border bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FF2D55]/20"
                            >
                                <option value="all">All Topics</option>
                                {topics.map(t => (
                                    <option key={t.dimensionId} value={t.dimensionId}>{t.name}</option>
                                ))}
                            </select>

                            <div className="ml-auto flex items-center bg-white p-1 rounded-xl border shadow-sm">
                                <button
                                    onClick={() => setView('table')}
                                    className={cn("p-2 rounded-lg transition-all", view === 'table' ? "bg-[#FF2D55] text-white" : "text-slate-400 hover:text-slate-600")}
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    onClick={() => setView('trends')}
                                    className={cn("p-2 rounded-lg transition-all", view === 'trends' ? "bg-[#FF2D55] text-white" : "text-slate-400 hover:text-slate-600")}
                                >
                                    <TrendingUp size={18} />
                                </button>
                                <button
                                    onClick={() => setView('breakdowns')}
                                    className={cn("p-2 rounded-lg transition-all", view === 'breakdowns' ? "bg-[#FF2D55] text-white" : "text-slate-400 hover:text-slate-600")}
                                >
                                    <BarChart2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* View Switcher Content */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-20 bg-white border border-slate-100 rounded-[2rem]">
                                <ZLoader text="Analyzing history..." />
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30">
                                <div className="mx-auto w-20 h-20 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-6">
                                    <BookOpen size={40} className="text-[#FF2D55] opacity-20" />
                                </div>
                                <h3 className="text-2xl font-black text-[#1A1A1A]">No History Found</h3>
                                <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium text-lg leading-relaxed">
                                    Launch your first evaluation to start building your profile.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {view === 'table' && (
                                    <div className="space-y-4">
                                        <div className="grid gap-4">
                                            {activities.map((activity) => (
                                                <Link
                                                    key={activity.id}
                                                    href={`/reports/active-report?examId=${activity.id}`}
                                                    className="p-6 rounded-[2rem] border border-slate-100 bg-white hover:border-[#FF2D55]/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative active:scale-[0.99]"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-[#FF2D55] group-hover:bg-[#FF2D55]/5 transition-colors duration-300">
                                                                <BookOpen size={28} />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xl md:text-2xl font-black text-[#1A1A1A]">{activity.title}</h4>
                                                                <div className="flex items-center gap-5 mt-2">
                                                                    <span className="flex items-center gap-2 text-sm font-bold text-slate-400">
                                                                        <Calendar size={16} /> {activity.relativeTime}
                                                                    </span>
                                                                    {activity.score !== null && (
                                                                        <span className="text-xs font-black px-3 py-1 rounded-full bg-[#E8F8F0] text-[#10B981]">
                                                                            {activity.score}% Correct
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="h-12 w-12 rounded-2xl bg-[#FF2D55] flex items-center justify-center text-white shadow-lg shadow-[#FF2D55]/20 group-hover:scale-110 transition-transform">
                                                            <ArrowRight size={20} />
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between pt-6 px-2">
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                                    Page {currentPage} of {totalPages}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={handlePrev}
                                                        disabled={currentPage === 1}
                                                        className="p-4 rounded-2xl border bg-white disabled:opacity-30 disabled:grayscale hover:bg-slate-50 transition-all active:scale-95"
                                                    >
                                                        <ChevronLeft size={20} />
                                                    </button>
                                                    <button
                                                        onClick={handleNext}
                                                        disabled={currentPage === totalPages}
                                                        className="p-4 rounded-2xl border bg-white disabled:opacity-30 disabled:grayscale hover:bg-slate-50 transition-all active:scale-95"
                                                    >
                                                        <ChevronRight size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {view === 'trends' && (
                                    <div className="h-[450px]">
                                        <ProgressChart trendData={data?.performanceTrend} />
                                    </div>
                                )}

                                {view === 'breakdowns' && (
                                    <div className="h-[450px]">
                                        <StackedBarBreakdown data={data?.drilldownBreakdown} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
                <MobileNav />
            </div>
        </AuthGuard>
    );
}
