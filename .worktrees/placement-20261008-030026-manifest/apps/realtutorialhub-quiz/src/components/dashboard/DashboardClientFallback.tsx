'use client';

import { StatsGrid } from "@/components/dashboard/StatsCards";
import { ArrowRight, Play, BookOpen, Activity, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@quiz/api-client";
import { recordCounter, recordTimer } from "@quiz/observability";
import { cn } from "@/lib/utils";
import { clientLogger } from "@/utils/clientLogger";

import { useAuthStore } from "@/store/auth-store";
import { useState } from "react";

import { ZLoader } from "@quiz/ui";
import dynamic from "next/dynamic";

const TutorInsightCard = dynamic(() => import("@/components/tutor/TutorInsightCard").then((mod) => mod.TutorInsightCard), {
    loading: () => (
        <div className="w-full max-w-full rounded-[2rem] border border-slate-200 bg-white p-8 animate-pulse">
            <div className="mb-6 h-4 w-32 rounded bg-slate-100" />
            <div className="space-y-4">
                <div className="h-20 w-full rounded-2xl bg-slate-50" />
                <div className="h-20 w-full rounded-2xl bg-slate-50" />
            </div>
        </div>
    ),
    ssr: false
});

import { DashboardActivity, DashboardData, useDashboardQuery } from "@/hooks/queries/dashboard.queries";

interface DashboardClientFallbackProps {
    serverUser?: { name?: string } | null;
    serverData?: DashboardData | null;
}

export default function DashboardClientFallback({ serverUser, serverData }: DashboardClientFallbackProps) {
    const clientUser = useAuthStore((s) => s.user);
    const router = useRouter();

    const { data: clientData, isLoading: loading } = useDashboardQuery("7d", 1, 3);

    const [isStarting, setIsStarting] = useState(false);

    const user = serverUser || clientUser;
    const data = serverData ?? clientData;

    if (!data && loading) {
        return (
            <div className="flex h-[calc(100vh-64px)] w-full max-w-full items-center justify-center overflow-x-hidden bg-muted/5">
                <ZLoader size="xl" text="Loading Dashboard..." />
            </div>
        );
    }

    return (
        <div className="w-full max-w-full space-y-10 overflow-x-hidden">
            <div className="flex w-full max-w-full min-w-0 flex-col justify-between gap-6 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-3xl font-extrabold tracking-tight text-slate-900 uppercase">Dashboard Overview</h1>
                    <p className="min-w-0 text-muted-foreground font-medium">
                        Welcome back, <span className="break-words text-pink-600 font-black">{user?.name || "User"}</span>! Let&apos;s see your progress.
                    </p>
                </div>
                <div className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center md:w-auto md:justify-end">
                    <button
                        onClick={async () => {
                            if (isStarting) return;
                            const start = Date.now();
                            try {
                                setIsStarting(true);
                                recordCounter("web.ui.dashboard.start_exam_click", 1);
                                const res = await apiClient.quiz.startAdaptiveExam();
                                const duration = Date.now() - start;
                                recordTimer("web.ui.dashboard.start_exam_time", duration);
                                recordCounter("web.ui.dashboard.start_exam_success", 1);
                                router.push(`/exam/${res.examId}`);
                            } catch (err) {
                                clientLogger.error("Failed to start adaptive exam", { error: err instanceof Error ? err.message : "unknown" });
                                recordCounter("web.ui.dashboard.start_exam_error", 1);
                                alert("Failed to start adaptive exam. Please try again.");
                            } finally {
                                setIsStarting(false);
                            }
                        }}
                        disabled={isStarting}
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-black px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:scale-105 hover:bg-gray-800 disabled:scale-100 disabled:opacity-50 sm:w-auto"
                    >
                        {isStarting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-pink-500" />
                                <span className="truncate">Recruiting...</span>
                            </>
                        ) : (
                            <>
                                <Activity size={18} className="mr-2 shrink-0 text-pink-500 animate-pulse" />
                                <span className="truncate">Start Adaptive Mission</span>
                            </>
                        )}
                    </button>
                    <Link
                        href="/quiz/new"
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-6 py-3 text-center text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90 sm:w-auto"
                    >
                        <Play size={18} className="mr-2 shrink-0" />
                        <span className="truncate">Start New Exam</span>
                    </Link>
                    <Link
                        href="/learn"
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 hover:bg-indigo-700 sm:w-auto"
                    >
                        <BookOpen size={18} className="mr-2 shrink-0" />
                        <span className="truncate">Resume Tutorial</span>
                    </Link>
                </div>
            </div>

            <StatsGrid overview={data?.overview} deltaPct={data?.deltaPct} healthStatus={data?.healthStatus} />

            <div className="mt-10 grid w-full max-w-full min-w-0 gap-8 overflow-x-hidden lg:grid-cols-4">
                <div className="min-w-0 space-y-8 lg:col-span-3">
                    <TutorInsightCard />
                </div>
                <div className="min-w-0 space-y-6">
                    <h3 className="px-1 text-xl font-bold tracking-tight text-slate-900 uppercase">Recent Activity</h3>
                    <div className="w-full max-w-full space-y-4">
                        {data?.recentActivity?.length === 0 ? (
                            <div className="w-full max-w-full rounded-[2rem] border-2 border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
                                <p className="text-sm font-medium">No exams taken yet</p>
                            </div>
                        ) : (
                            data?.recentActivity?.map((activity: DashboardActivity) => (
                                <div key={activity.id} className="w-full max-w-full min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-all group hover:border-pink-500/30">
                                    <div className="flex min-w-0 items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
                                                <p
                                                    className={cn(
                                                        "max-w-full rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
                                                        activity.status === "completed" ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"
                                                    )}
                                                >
                                                    {activity.status}
                                                </p>
                                                <span className="truncate text-[9px] font-bold text-slate-400 uppercase tracking-widest">{activity.relativeTime}</span>
                                            </div>
                                            <h4 className="truncate font-extrabold text-slate-800">{activity.title}</h4>
                                            {activity.score !== null && (
                                                <p className="mt-1 flex min-w-0 items-center gap-2 text-xs font-bold text-slate-500">
                                                    <BookOpen size={14} className="shrink-0 text-pink-500" />
                                                    <span className="truncate">Score: {activity.score}%</span>
                                                </p>
                                            )}
                                        </div>
                                        <Link
                                            href={activity.status === "completed" ? `/reports/${activity.id}` : `/exam/${activity.id}`}
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-all group-hover:bg-primary group-hover:text-white"
                                        >
                                            <ArrowRight size={18} />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <Link
                        href="/dashboard/my-exams"
                        className="flex w-full max-w-full items-center justify-center rounded-2xl border border-slate-200 py-4 text-center text-xs font-black uppercase tracking-widest text-slate-600 transition-all hover:border-pink-500 hover:bg-pink-50 hover:text-pink-500"
                    >
                        <span className="truncate">View All Quizzes</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
