'use client';

import { Sidebar } from "@/components/dashboard/Sidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useDashboardStore } from "@/store/dashboard-store";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, Calendar, ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default function MyExamsPage() {
    const { data, fetchDashboard, loading } = useDashboardStore();

    useEffect(() => {
        fetchDashboard('30d'); // Show 30 days by default on this listing
    }, [fetchDashboard]);

    return (
        <AuthGuard>
            <div className="flex min-h-[calc(100vh-64px)]">
                <Sidebar />
                <main className="flex-1 p-6 md:p-10 pb-24 md:pb-10 space-y-8 overflow-y-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 rounded-xl border hover:bg-muted transition-colors">
                            <ChevronLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">My Quizzes</h1>
                            <p className="text-muted-foreground">Detailed history of your completed assessments.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {loading && (
                            <div className="p-12 text-center border rounded-3xl bg-muted/5 animate-pulse">
                                <p className="text-sm font-medium text-muted-foreground">Loading your history...</p>
                            </div>
                        )}

                        {!loading && data?.recentActivity?.length === 0 ? (
                            <div className="p-20 text-center border-2 border-dashed rounded-3xl bg-muted/5">
                                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <BookOpen size={32} className="text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-bold">No quizzes found</h3>
                                <p className="text-muted-foreground mt-2 max-w-xs mx-auto">You haven&apos;t completed any assessments yet. Start your first journey today!</p>
                                <Link
                                    href="/quiz/new"
                                    className="inline-flex mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                                >
                                    Start Your First Quiz
                                </Link>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {data?.recentActivity?.map((activity) => (
                                    <div key={activity.id} className="p-6 rounded-3xl border bg-card hover:shadow-md transition-all group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <BookOpen size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold">{activity.title}</h4>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                                            <Calendar size={14} /> {activity.relativeTime}
                                                        </span>
                                                        {activity.score !== null && (
                                                            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                                                {activity.score}% Correct
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/reports/active-report?examId=${activity.id}`}
                                                className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                                            >
                                                <ArrowRight size={20} />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
                <MobileNav />
            </div>
        </AuthGuard>
    );
}
