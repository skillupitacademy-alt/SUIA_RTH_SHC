'use client';

import { StatsGrid } from "@/components/dashboard/StatsCards";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ArrowRight, Play, BookOpen } from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";

import { useAuthStore } from "@/store/auth-store";
import { useDashboardStore } from "@/store/dashboard-store";
import { useEffect } from "react";

export default function DashboardPage() {
    const { user } = useAuthStore();
    const { data, fetchDashboard, loading } = useDashboardStore();

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return (
        <AuthGuard>
            <div className="flex min-h-[calc(100vh-64px)]">
                <Sidebar />
                <main className="flex-1 p-6 md:p-10 space-y-10 overflow-y-auto">
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
                            <ProgressChart />
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold px-1">Upcoming Recommended</h3>
                            <div className="space-y-4">
                                {[
                                    { title: 'React Performance Hooks', time: '15m', subject: 'Frontend' },
                                    { title: 'Redis Caching Patterns', time: '20m', subject: 'Backend' },
                                    { title: 'Kubernetes Ingress-Nginx', time: '25m', subject: 'DevOps' },
                                ].map((quiz) => (
                                    <div key={quiz.title} className="p-5 rounded-3xl border bg-muted/20 hover:bg-muted/40 transition-colors group">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-primary uppercase mb-1">{quiz.subject}</p>
                                                <h4 className="font-bold">{quiz.title}</h4>
                                                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                                    <BookOpen size={14} /> {quiz.time}
                                                </p>
                                            </div>
                                            <button className="h-10 w-10 rounded-full bg-background border flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link href="/quiz" className="flex items-center justify-center w-full py-4 rounded-3xl border-2 border-dashed border-muted-foreground/20 text-muted-foreground font-bold hover:border-primary/40 hover:text-primary transition-all">
                                View All Quizzes
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
