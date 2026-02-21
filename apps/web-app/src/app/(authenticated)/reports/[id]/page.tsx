'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@quiz/api-client";
import { ExamReportLayout, ExamReport } from "@/components/reports/ExamReportLayout";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { clientLogger } from '@/utils/clientLogger';

export default function PremiumReportPage() {
    const { id } = useParams();
    const [report, setReport] = useState<ExamReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
                        }
                    }
                    return;
                }

                if (isMounted) {
                    setReport(data as ExamReport);
                    setIsProcessing(false);
                    setLoading(false);
                }
            } catch (err) {
                clientLogger.error('Failed to fetch premium report', {
                    examId: id,
                    error: err instanceof Error ? err.message : 'unknown'
                });

                if (isMounted) {
                    setErrorMsg("Unable to retrieve neural diagnostics.");
                    setLoading(false);
                }
            }
        };

        fetchReport();
        return () => { isMounted = false; };
    }, [id]);

    // Handle Error State
    if (errorMsg) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-8 text-center bg-slate-950 px-6">
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
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-800 border-t-indigo-500" />
                <p className="text-[11px] font-bold uppercase tracking-[0.3em]">Synthesizing neural diagnostics...</p>
            </div>
        );
    }

    // Render the Premium Layout
    return (
        <div className="min-h-screen bg-slate-950">
            <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md h-20 px-6 md:px-12 flex items-center justify-between border-b border-slate-900">
                <div className="flex items-center gap-6">
                    <Link
                        href="/dashboard"
                        className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all text-slate-500 hover:text-indigo-400"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="h-6 w-[1px] bg-slate-800" />
                    <div>
                        <h1 className="text-[11px] font-black text-white uppercase tracking-[0.3em] leading-none">Neural Diagnostics</h1>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mt-1.5 opacity-60">
                            Attempt Vector: {id?.toString().slice(0, 12).toUpperCase()}
                        </p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <div className="px-4 py-2 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[9px] font-black text-indigo-400/80 uppercase tracking-[0.2em]">
                        Authenticated Command View
                    </div>
                </div>
            </header>

            <ExamReportLayout
                data={report}
                loading={false}
            />
        </div>
    );
}
