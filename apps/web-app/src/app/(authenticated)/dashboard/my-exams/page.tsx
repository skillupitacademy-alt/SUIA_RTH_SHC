'use client';

import { useDashboardStore } from "@/store/dashboard-store";
import { useEffect, useState } from "react";
import { BookOpen, Calendar, ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { StackedBarBreakdown } from "@/components/dashboard/StackedBarBreakdown";
import { cn } from "@/lib/utils";
import { Filter, BarChart2, List, TrendingUp, Hash, Layers, BookOpen as BookIcon, Clock } from 'lucide-react';
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
    const allDomains = (drilldownMetadata?.domains || []).map((d) => ({
        id: d.dimensionId ?? d.name,
        name: d.name,
    }));
    const allSubjects = (drilldownMetadata?.subjects || []).map((s) => ({
        id: s.dimensionId ?? s.name,
        name: s.name,
    }));
    const allTopics = (drilldownMetadata?.topics || []).map((t) => ({
        id: t.dimensionId ?? t.name,
        name: t.name,
    }));

    // Cascading Filter Logic
    const availableDomains = allDomains;
    // In real-world, would filter by domainId if metadata included parentId
    const availableSubjects = allSubjects;
    const availableTopics = allTopics;

    // For better UX, we'll just use the raw metadata arrays since they represent attempted dims
    const domains = availableDomains;
    const subjects = availableSubjects;
    const topics = availableTopics;

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex items-center gap-5">
                <Link href="/dashboard" className="p-3 rounded-2xl border bg-white shadow-sm hover:bg-slate-50 transition-all">
                    <ChevronLeft size={22} className="text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#1A1A1A] characters-tight uppercase">My Quizzes</h1>
                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest mt-1 leading-relaxed">Detailed history of your completed assessments.</p>
                </div>
            </div>

            <div className="space-y-8">
                {/* Filter Console - FIXED GRID LAYOUT */}
                <div className="flex flex-col gap-6 p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm relative overflow-hidden group">
                    {/* View Switcher - Header Position */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-[#FF2D55]/10 text-[#FF2D55]">
                                <Filter size={18} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Filter Console</span>
                        </div>
                        <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100">
                            <button
                                onClick={() => setView('table')}
                                className={cn("px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                                    view === 'table' ? "bg-[#FF2D55] text-white shadow-lg shadow-[#FF2D55]/20" : "text-slate-400 hover:text-slate-600")}
                            >
                                <List size={14} />
                                List
                            </button>
                            <button
                                onClick={() => setView('trends')}
                                className={cn("px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                                    view === 'trends' ? "bg-[#FF2D55] text-white shadow-lg shadow-[#FF2D55]/20" : "text-slate-400 hover:text-slate-600")}
                            >
                                <TrendingUp size={14} />
                                Trends
                            </button>
                            <button
                                onClick={() => setView('breakdowns')}
                                className={cn("px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                                    view === 'breakdowns' ? "bg-[#FF2D55] text-white shadow-lg shadow-[#FF2D55]/20" : "text-slate-400 hover:text-slate-600")}
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
                                { id: '7d', name: '7 Days' },
                                { id: '14d', name: '14 Days' },
                                { id: '28d', name: '28 Days' },
                                { id: '90d', name: '90 Days' }
                            ]}
                            loading={loading}
                            onChange={handleRangeChange}
                            placeholder="Select Range"
                            icon={<Clock className="w-3.5 h-3.5 text-pink-500" />}
                        />

                        <SelectField
                            label="Domain"
                            value={filters.domain === 'all' ? null : filters.domain}
                            options={[{ id: 'all', name: 'All' }, ...domains]}
                            loading={metadataLoading}
                            onChange={(id: string) => setFilter('domain', id || 'all')}
                            placeholder="All Domains"
                            icon={<Layers className="w-3.5 h-3.5 text-pink-500" />}
                        />

                        <SelectField
                            label="Subject"
                            value={filters.subject === 'all' ? null : filters.subject}
                            options={[{ id: 'all', name: 'All' }, ...subjects]}
                            loading={metadataLoading}
                            onChange={(id: string) => setFilter('subject', id || 'all')}
                            placeholder="All Subjects"
                            icon={<BookIcon className="w-3.5 h-3.5 text-pink-500" />}
                        />

                        <SelectField
                            label="Topic"
                            value={filters.topic === 'all' ? null : filters.topic}
                            options={[{ id: 'all', name: 'All' }, ...topics]}
                            loading={metadataLoading}
                            onChange={(id: string) => setFilter('topic', id || 'all')}
                            placeholder="All Topics"
                            icon={<Hash className="w-3.5 h-3.5 text-pink-500" />}
                        />
                    </div>
                </div>

                {/* View Switcher Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 bg-white border border-slate-100 rounded-[2.5rem]">
                        <ZLoader text="Analyzing history..." />
                    </div>
                ) : activities.length === 0 ? (
                    <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/10">
                        <div className="mx-auto w-20 h-20 rounded-[2rem] bg-white shadow-sm flex items-center justify-center mb-6 border border-slate-100">
                            <BookOpen size={40} className="text-pink-500/20" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">No History Found</h3>
                        <p className="text-slate-500 mt-2 max-w-sm mx-auto font-bold uppercase text-[10px] tracking-widest leading-relaxed">
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
                                            className="p-6 rounded-[2.5rem] border border-slate-200 bg-white hover:border-[#FF2D55]/30 hover:shadow-xl hover:shadow-slate-200/40 transition-all group relative"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-[#FF2D55] group-hover:bg-[#FF2D55] group-hover:text-white transition-all duration-500">
                                                        <BookOpen size={28} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">{activity.title}</h4>
                                                        <div className="flex items-center gap-6 mt-2">
                                                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                                <Calendar size={14} /> {activity.relativeTime}
                                                            </span>
                                                            {activity.score !== null && (
                                                                <span className="text-[10px] font-black px-4 py-1.5 rounded-full bg-green-50 text-green-700 uppercase tracking-widest border border-green-100">
                                                                    {activity.score}% Mastery
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="h-12 w-12 rounded-[1.25rem] bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-[#FF2D55] group-hover:text-white group-hover:shadow-lg group-hover:shadow-[#FF2D55]/20 group-hover:border-none transition-all duration-300 border border-slate-100">
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
        </div>
    );
}
