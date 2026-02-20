'use client';

import { StatsGrid } from "@/components/dashboard/StatsCards";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ArrowRight, Play, BookOpen, Activity, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@quiz/api-client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { cn } from "@/lib/utils";
import { MobileNav } from "@/components/dashboard/MobileNav";

import { useAuthStore } from "@/store/auth-store";
import { useDashboardStore } from "@/store/dashboard-store";
import { useEffect, useState } from "react";

import { ZLoader } from "@quiz/ui";
import { TutorInsightCard } from "@/components/tutor/TutorInsightCard";

export default function DashboardPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { data, fetchDashboard, loading } = useDashboardStore();
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        fetchDashboard('7d', 1, 3);
    }, [fetchDashboard]);

    if (!data && loading) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-muted/5">
                <ZLoader size="xl" text="Loading Dashboard..." />
            </div>
        );
    }

    return (
        <AuthGuard>
            <div className="flex min-h-[calc(100vh-64px)]">
                <Sidebar />
                <main className="flex-1 md:ml-64 p-6 md:p-10 pb-24 md:pb-10 space-y-10 overflow-y-auto bg-muted/5">
                    {/* Welcome Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard Overview</h1>
                            <p className="text-muted-foreground">Welcome back, <span className="text-pink-600 font-black">{user?.name || 'User'}</span>! Let&apos;s see your progress.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                onClick={async () => {
                                    if (isStarting) return;
                                    try {
                                        setIsStarting(true);
                                        const res = await apiClient.quiz.startAdaptiveExam();
                                        router.push(`/exam/${res.examId}`);
                                    } catch (err) {
                                        console.error('Failed to start adaptive exam', err);
                                        alert('Failed to start adaptive exam. Please try again.');
                                    } finally {
                                        setIsStarting(false);
                                    }
                                }}
                                disabled={isStarting}
                                className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-3 text-sm font-bold text-white shadow-lg shadow-black/10 hover:bg-gray-800 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
                            >
                                {isStarting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-pink-500" />
                                        Recruiting...
                                    </>
                                ) : (
                                    <>
                                        <Activity size={18} className="mr-2 text-pink-500 animate-pulse" />
                                        Start Adaptive Mission
                                    </>
                                )}
                            </button>
                            <Link
                                href="/quiz/new"
                                className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-105"
                            >
                                <Play size={18} className="mr-2" />
                                Start New Exam
                            </Link>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <StatsGrid overview={data?.overview} deltaPct={data?.deltaPct} healthStatus={data?.healthStatus} />

                    <div className="grid lg:grid-cols-4 gap-8 mt-10">
                        <div className="lg:col-span-3 space-y-8">
                            <TutorInsightCard />
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold px-1">Recent Activity</h3>
                            <div className="space-y-4">
                                {data?.recentActivity?.length === 0 ? (
                                    <div className="p-8 text-center border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600">
                                        <p className="text-sm font-medium">No exams taken yet</p>
                                    </div>
                                ) : (
                                    data?.recentActivity?.map((activity) => (
                                        <div key={activity.id} className="p-5 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-colors group">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                            activity.status === 'completed' ? "bg-green-100 text-green-700" : "bg-primary/20 text-primary"
                                                        )}>
                                                            {activity.status}
                                                        </p>
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{activity.relativeTime}</span>
                                                    </div>
                                                    <h4 className="font-bold truncate max-w-[150px]">{activity.title}</h4>
                                                    {activity.score !== null && (
                                                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                                            <BookOpen size={14} /> Score: {activity.score}%
                                                        </p>
                                                    )}
                                                </div>
                                                <Link href={activity.status === 'completed' ? `/reports/active-report?examId=${activity.id}` : `/exam/${activity.id}`} className="h-10 w-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-all">
                                                    <ArrowRight size={18} />
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <Link href="/dashboard/my-exams" className="flex items-center justify-center w-full py-4 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:border-pink-500 hover:text-pink-500 hover:bg-pink-50 transition-all">
                                View All Quizzes
                            </Link>
                        </div>
                    </div>
                </main>
                <MobileNav />
            </div>
        </AuthGuard>
    );
}
