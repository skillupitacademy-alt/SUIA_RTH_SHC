'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@quiz/api-client";
import { recordCounter } from "@quiz/observability";
import { type ExamReport } from "@/components/reports/ExamReportLayout";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { clientLogger } from '@/utils/clientLogger';
import { ReportDownloadButton } from "@/components/reports/ReportDownloadButton";
import { useInsightVectorData } from "@/hooks/useInsightVectorData";
import { useReportTheme } from "@/components/reports/context/ReportThemeContext";
import { ReportThemeToggle } from "@/components/reports/ui/ReportThemeToggle";
import dynamic from "next/dynamic";

const ExamReportLayout = dynamic(
    () => import("@/components/reports/ExamReportLayout").then((mod) => mod.ExamReportLayout),
    { ssr: false }
);

export default function PremiumReportPage() {
    const { id } = useParams();
    const [report, setReport] = useState<ExamReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    const { theme } = useReportTheme();

    // INSIGHT VECTOR HOOK
    const insight = useInsightVectorData(id as string, report?.userId);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        let isMounted = true;
        let retryCount = 0;
        const delays = [1000, 2000, 4000, 6000];

        const fetchReport = async () => {
            if (!id) return;

            try {
                // Fetch the premium infographic data
                const data = await apiClient.reports.getPremiumExamReport(id as string);

                // Handle processing state if the exam is still being scored
                if (data.status === 'processing' || data.status === 'started') {
                    if (isMounted) setIsProcessing(true);

                    if (retryCount < 15) {
                        const delay = delays[Math.min(retryCount, delays.length - 1)];
                        retryCount++;
                        setTimeout(fetchReport, delay);
                    } else {
                        if (isMounted) {
                            setErrorMsg("Analytics synthesis is taking longer than expected.");
                            setLoading(false);
                            setIsProcessing(false);
                            recordCounter('web.ui.report.fetch_timeout', 1, { examId: id as string });
                        }
                    }
                    return;
                }

                if (isMounted) {
                    setReport(data as ExamReport);
                    setIsProcessing(false);
                    setLoading(false);
                    recordCounter('web.ui.report.fetch_success', 1, { examId: id as string });
                }
            } catch (err) {
                clientLogger.error('Failed to fetch premium report', {
                    examId: id,
                    error: err instanceof Error ? err.message : 'unknown'
                });
                recordCounter('web.ui.report.fetch_error', 1, { examId: id as string });
                if (isMounted) {
                    setErrorMsg("Unable to retrieve neural diagnostics.");
                    setLoading(false);
                }
            }
        };

        fetchReport();
        return () => { isMounted = false; };
    }, [id]);

    // Handle SSR / Hydration guard
    if (!mounted) return null;

    // Handle Error State
    if (errorMsg) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-8 text-center bg-slate-950 px-6" data-report-theme={theme}>
                <div className="p-6 rounded-[2.5rem] bg-rose-500/10 border border-rose-500/20 text-rose-500 shadow-2xl shadow-rose-500/10">
                    <RefreshCw size={40} className="animate-spin-slow" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Data Link Severed</h1>
                    <p className="text-slate-500 max-w-sm font-bold uppercase text-[10px] tracking-[0.3em] leading-relaxed">
                        {errorMsg}
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link
                        href="/dashboard"
                        className="px-8 py-4 bg-slate-900 text-slate-400 font-black rounded-2xl border border-slate-800 hover:bg-slate-800 transition-all text-[10px] uppercase tracking-widest"
                    >
                        Return Home
                    </Link>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all text-[10px] uppercase tracking-widest"
                    >
                        Sync Retry
                    </button>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading || isProcessing || !report) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400" data-report-theme={theme}>
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-800 border-t-indigo-500" />
                <p className="text-[11px] font-bold uppercase tracking-[0.3em]">Synthesizing neural diagnostics...</p>
            </div>
        );
    }

    // Render the Premium Layout
    return (
        <div className="min-h-screen bg-slate-950" data-report-theme={theme}>
            {/* COMMAND HUB HEADER */}
            <header className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl py-5 px-8 md:px-16 flex items-center justify-between border-b border-white/[0.03] shadow-2xl">
                <div className="flex items-center gap-10">
                    <Link
                        href="/dashboard"
                        className="group relative p-4 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/50 transition-all duration-500 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors" />
                        <ArrowLeft size={20} className="relative z-10 text-slate-500 group-hover:text-indigo-400 group-hover:-translate-x-1 transition-all" />
                    </Link>

                    <div className="h-12 w-[1px] bg-gradient-to-b from-transparent via-slate-800 to-transparent" />
                    <div className="h-12 w-[1px] bg-gradient-to-b from-transparent via-slate-800 to-transparent" />

                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Neural Diagnostics</span>
                            </div>
                            {report.lineage && (
                                <div className="flex items-center gap-2.5">
                                    <div className="flex items-center gap-2.5">
                                        {report.lineage.domain && (
                                            <span className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap opacity-60">{report.lineage.domain}</span>
                                        )}
                                        {report.lineage.subject && (
                                            <>
                                                <div className="h-1 w-1 rounded-full bg-slate-800" />
                                                <span className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">{report.lineage.subject}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase leading-none drop-shadow-sm">
                                {report.lineage?.topic || "Diagnostic Attempt"}
                            </h1>
                            <div className="flex items-center gap-4">
                                {report.completedAt && (
                                    <div className="px-3 py-1 rounded-full bg-slate-900/80 border border-white/[0.05] flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                            {new Date(report.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                )}
                                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest border-l border-slate-800 pl-4 whitespace-nowrap">
                                    Vector: {id?.toString().slice(0, 8).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-8">
                    <ReportThemeToggle />
                    <button
                        onClick={() => window.location.reload()}
                        className="p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/50 text-slate-500 hover:text-indigo-400 transition-all active:scale-95 group"
                        title="Sync Neural Data"
                    >
                        <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                    </button>

                    <div className="h-8 w-[1px] bg-slate-800/50" />
                    <ReportDownloadButton 
                        attemptId={id as string} 
                        userId={report.userId || ""} 
                    />
                </div>
            </header>

            <ExamReportLayout
                data={report}
                loading={false}
                insightData={{
                    guidanceSignals: insight.data?.guidanceSignals || [],
                    historicalProgress: insight.data?.historicalProgress || [],
                    skillData: insight.data?.skillData || [],
                    loading: insight.loading,
                    error: insight.error,
                    onRetry: insight.retry,
                }}
            />
        </div>
    );
}
