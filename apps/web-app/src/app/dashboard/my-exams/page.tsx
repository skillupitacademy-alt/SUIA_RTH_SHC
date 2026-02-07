'use client';

import { Sidebar } from "@/components/dashboard/Sidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useDashboardStore } from "@/store/dashboard-store";
import { useEffect, useState, useMemo } from "react";
import { BookOpen, Calendar, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { MobileNav } from "@/components/dashboard/MobileNav";

const ITEMS_PER_PAGE = 7;

export default function MyExamsPage() {
    const { data, fetchDashboard, loading } = useDashboardStore();
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        // Fetch 30 days of history
        fetchDashboard('30d');
    }, [fetchDashboard]);

    // Sorting: TODO - API currently only returns relativeTime string.
    // DashboardEngine.getUserDashboard already sorts by e.completedAt DESC on the server.
    // We maintain that order here. 
    const activities = useMemo(() => data?.recentActivity || [], [data]);

    // Pagination logic
    const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE);
    const paginatedActivities = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return activities.slice(start, start + ITEMS_PER_PAGE);
    }, [activities, currentPage]);

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    return (
        <AuthGuard>
            <div className="flex min-h-[calc(100vh-64px)] bg-slate-50/50">
                <Sidebar />
                <main className="flex-1 p-6 md:p-10 pb-24 md:pb-10 space-y-8 overflow-y-auto">
                    {/* Header Section */}
                    <div className="flex items-center gap-5">
                        <Link href="/dashboard" className="p-3 rounded-2xl border bg-white shadow-sm hover:bg-slate-50 transition-all">
                            <ChevronLeft size={22} className="text-slate-600" />
                        </Link>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 characters-tight">My History</h1>
                            <p className="text-slate-500 font-medium text-base">Comprehensive log of your completed assessments.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* State Container: Mutually exclusive rendering to prevent layout shift */}
                        {loading ? (
                            <div className="p-16 text-center border-2 border-slate-100 rounded-[2.5rem] bg-white animate-pulse flex flex-col items-center justify-center space-y-4">
                                <div className="w-12 h-12 rounded-full bg-slate-100" />
                                <p className="text-slate-400 font-bold text-lg">Analyzing history...</p>
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white">
                                <div className="mx-auto w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6">
                                    <BookOpen size={40} className="text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">No History Found</h3>
                                <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium text-lg leading-relaxed">
                                    You haven&apos;t completed any assessments yet. Launch your first evaluation to start building your profile.
                                </p>
                                <Link
                                    href="/quiz/new"
                                    className="inline-flex mt-8 px-8 py-4 bg-slate-900 text-white rounded-[1.25rem] font-black shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all"
                                >
                                    Start Evaluation
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Activity Grid */}
                                <div className="grid gap-4">
                                    {paginatedActivities.map((activity) => (
                                        <Link
                                            key={activity.id}
                                            href={`/reports/active-report?examId=${activity.id}`}
                                            className="p-6 rounded-[2rem] border border-slate-100 bg-white hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden active:scale-[0.99]"
                                        >
                                            <div className="flex items-center justify-between relative z-10">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                                                        <BookOpen size={28} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl md:text-2xl font-black text-slate-900 group-hover:translate-x-1 transition-transform">{activity.title}</h4>
                                                        <div className="flex items-center gap-5 mt-2">
                                                            <span className="flex items-center gap-2 text-sm font-bold text-slate-400">
                                                                <Calendar size={16} /> {activity.relativeTime}
                                                            </span>
                                                            {activity.score !== null && (
                                                                <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-900 text-white ring-4 ring-slate-50">
                                                                    {activity.score}% PERFORMANCE
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="hidden md:flex h-12 w-12 rounded-2xl bg-slate-50 items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                                                    <ArrowRight size={24} className="text-slate-900" />
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
                    </div>
                </main>
                <MobileNav />
            </div>
        </AuthGuard>
    );
}
