'use client';

import { Sidebar } from "@/components/dashboard/Sidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useDashboardStore } from "@/store/dashboard-store";
import { useEffect, useState, useMemo } from "react";
import { BookOpen, Calendar, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { StackedBarBreakdown } from "@/components/dashboard/StackedBarBreakdown";
import { cn } from "@/lib/utils";
import { Filter, BarChart2, List, TrendingUp, Info, Hash, Layers, BookOpen as BookIcon, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { SelectField, ZLoader, ZPagination } from '@quiz/ui';

// Standardized pagination state

export default function MyExamsPage() {
    const {
        data,
        drilldownMetadata,
        filters,
        setFilter,
        fetchDashboard,
        fetchPerformanceTrend,
        fetchPerformanceBreakdownMetadata,
        fetchPerformanceBreakdown,
        loading,
        metadataLoading
    } = useDashboardStore();

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10); // Standardize to 10
    const [range, setRange] = useState('28d');
    const [view, setView] = useState<'table' | 'trends' | 'breakdowns'>('table');

    useEffect(() => {
        // Initial fetch: 28 days history + metadata
        fetchDashboard(range, currentPage, limit);
        fetchPerformanceBreakdownMetadata();
        fetchPerformanceBreakdown(range);
    }, [fetchDashboard, fetchPerformanceBreakdownMetadata, fetchPerformanceBreakdown, currentPage, range, limit]);

    const handleRangeChange = (newRange: string) => {
        if (newRange === '90d') return; // Strictly enforced contract
        setRange(newRange);
        fetchPerformanceTrend(newRange);
        fetchPerformanceBreakdown(newRange);
    };

    // Direct access to activities (already paginated by server)
    const activities = data?.recentActivity || [];
    const totalCount = data?.pagination?.total || 0;
    const totalPages = data?.pagination?.totalPages || 0;

    // Filter metadata - Source from decoupled store state
    const allDomains = drilldownMetadata?.domains || [];
    const allSubjects = drilldownMetadata?.subjects || [];
    const allTopics = drilldownMetadata?.topics || [];

    // Cascading Filter Logic
    const availableDomains = allDomains;
    // In real-world, would filter by domainId if metadata included parentId
    const availableSubjects = allSubjects;
    const availableTopics = allTopics;

    // For better UX, we'll just use the raw metadata arrays since they represent attempted dims
    const domains = availableDomains;
    const subjects = availableSubjects;
    const topics = availableTopics;

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
                        {/* Filter Console - FIXED GRID LAYOUT */}
                        <div className="flex flex-col gap-6 p-8 rounded-[2rem] bg-slate-50 border border-slate-100 shadow-sm relative overflow-hidden group">
                            {/* Ambient Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF2D55]/5 rounded-full blur-3xl -z-10 group-hover:bg-[#FF2D55]/10 transition-all duration-700" />

                            {/* View Switcher - Header Position */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-[#FF2D55]/10 text-[#FF2D55]">
                                        <Filter size={18} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Filter Console</span>
                                </div>
                                <div className="flex items-center bg-white p-1 rounded-xl border shadow-sm">
                                    <button
                                        onClick={() => setView('table')}
                                        className={cn("px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider",
                                            view === 'table' ? "bg-[#FF2D55] text-white shadow-md shadow-[#FF2D55]/20" : "text-slate-400 hover:text-slate-600")}
                                    >
                                        <List size={14} />
                                        List
                                    </button>
                                    <button
                                        onClick={() => setView('trends')}
                                        className={cn("px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider",
                                            view === 'trends' ? "bg-[#FF2D55] text-white shadow-md shadow-[#FF2D55]/20" : "text-slate-400 hover:text-slate-600")}
                                    >
                                        <TrendingUp size={14} />
                                        Trends
                                    </button>
                                    <button
                                        onClick={() => setView('breakdowns')}
                                        className={cn("px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider",
                                            view === 'breakdowns' ? "bg-[#FF2D55] text-white shadow-md shadow-[#FF2D55]/20" : "text-slate-400 hover:text-slate-600")}
                                    >
                                        <BarChart2 size={14} />
                                        Stats
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                <SelectField
                                    label="Time Range"
                                    value={range}
                                    options={[
                                        { id: '7d', name: 'Last 7 Days' },
                                        { id: '14d', name: 'Last 14 Days' },
                                        { id: '28d', name: 'Last 28 Days' },
                                        { id: '90d', name: 'Last 90 Days (Coming Soon)' }
                                    ]}
                                    loading={loading}
                                    onChange={handleRangeChange}
                                    placeholder="Select Range"
                                    active={true}
                                    hideCreate={true}
                                    accentColor="#FF2D55"
                                    icon={<Clock className="w-3.5 h-3.5" />}
                                />

                                <SelectField
                                    label="Domain"
                                    value={filters.domain === 'all' ? null : filters.domain}
                                    options={[{ dimensionId: 'all', name: 'All Domains' }, ...domains]}
                                    loading={metadataLoading}
                                    onChange={(id: string) => setFilter('domain', id || 'all')}
                                    placeholder="All Domains"
                                    active={true}
                                    hideCreate={true}
                                    accentColor="#FF2D55"
                                    icon={<Layers className="w-3.5 h-3.5" />}
                                />

                                <SelectField
                                    label="Subject"
                                    value={filters.subject === 'all' ? null : filters.subject}
                                    options={[{ dimensionId: 'all', name: 'All Subjects' }, ...subjects]}
                                    loading={metadataLoading}
                                    onChange={(id: string) => setFilter('subject', id || 'all')}
                                    placeholder="All Subjects"
                                    active={true}
                                    hideCreate={true}
                                    accentColor="#FF2D55"
                                    icon={<BookIcon className="w-3.5 h-3.5" />}
                                />

                                <SelectField
                                    label="Topic"
                                    value={filters.topic === 'all' ? null : filters.topic}
                                    options={[{ dimensionId: 'all', name: 'All Topics' }, ...topics]}
                                    loading={metadataLoading}
                                    onChange={(id: string) => setFilter('topic', id || 'all')}
                                    placeholder="All Topics"
                                    active={true}
                                    hideCreate={true}
                                    accentColor="#FF2D55"
                                    icon={<Hash className="w-3.5 h-3.5" />}
                                />
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

                                        {/* Pagination Standard */}
                                        <ZPagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            totalCount={totalCount}
                                            pageSize={limit}
                                            onPageChange={setCurrentPage}
                                            onPageSizeChange={(size) => {
                                                setLimit(size);
                                                setCurrentPage(1);
                                            }}
                                            pageSizeOptions={[10, 25, 50]}
                                        />
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
