'use client';

import { StatsGrid } from "@/components/dashboard/StatsCards";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ArrowRight, Play, BookOpen } from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { cn } from "@/lib/utils";
import { MobileNav } from "@/components/dashboard/MobileNav";

import { useAuthStore } from "@/store/auth-store";
import { useDashboardStore } from "@/store/dashboard-store";
import { useEffect } from "react";

export default function DashboardPage() {
    const { user } = useAuthStore();
    const { data, fetchDashboard } = useDashboardStore();

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return (
        <AuthGuard>
            <div className="flex min-h-[calc(100vh-64px)]">
                <Sidebar />
                <main className="flex-1 p-6 md:p-10 pb-24 md:pb-10 space-y-10 overflow-y-auto">
                    {/* Welcome Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard Overview</h1>
                            <p className="text-muted-foreground">Welcome back, {user?.name || 'User'}! Let&apos;s see your progress.</p>
                        </div>
                        <Link
                            href="/quiz/new"
                            className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-105"
                        >
                            <Play size={18} className="mr-2" />
                            Start New Exam
                        </Link>
                    </div>

                    {/* Stats Section */}
                    <StatsGrid overview={data?.overview} />

                    <div className="grid lg:grid-cols-3 gap-8 mt-10">
                        <div className="lg:col-span-2">
                            <ProgressChart trendData={data?.performanceTrend} />
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold px-1">Recent Activity</h3>
                            <div className="space-y-4">
                                {data?.recentActivity?.length === 0 ? (
                                    <div className="p-8 text-center border rounded-3xl border-dashed bg-muted/10 text-muted-foreground">
                                        <p className="text-sm font-medium">No exams taken yet</p>
                                    </div>
                                ) : (
                                    data?.recentActivity?.map((activity) => (
                                        <div key={activity.id} className="p-5 rounded-3xl border bg-muted/20 hover:bg-muted/40 transition-colors group">
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
                                                <Link href={activity.status === 'completed' ? `/reports/active-report?examId=${activity.id}` : `/exam/${activity.id}`} className="h-10 w-10 rounded-full bg-background border flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                    <ArrowRight size={18} />
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <Link href="/dashboard/my-exams" className="flex items-center justify-center w-full py-4 rounded-3xl border-2 border-dashed border-muted-foreground/20 text-muted-foreground font-bold hover:border-primary/40 hover:text-primary transition-all">
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
