"use client";

import React, { useEffect, useState } from "react";
import { useReportStatus } from "@/hooks/useReportStatus";
import { cn } from "@/lib/utils";
import { AlertCircle, FileText, Loader2, RefreshCw } from "lucide-react";

interface ReportDownloadButtonProps {
    attemptId: string;
    className?: string;
}

export function ReportDownloadButton({ attemptId, className }: ReportDownloadButtonProps) {
    const { status, loading, downloadUrl, error, triggerGeneration, cooldown } = useReportStatus(attemptId);
    const [secondsElapsed, setSecondsElapsed] = useState(0);

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        if (status === "generating") {
            timer = setInterval(() => setSecondsElapsed(prev => prev + 1), 1000);
        } else {
            setSecondsElapsed(0);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [status]);

    // If spinning for > 20s, allow the user to retry manually
    const isSoftTimeout = secondsElapsed > 20;

    const handleDownload = () => {
        if (downloadUrl) {
            window.open(downloadUrl, "_blank");
        }
    };

    if (loading) {
        return (
            <button
                disabled
                className={cn(
                    "flex items-center gap-3 px-6 py-2.5 bg-slate-800/50 text-slate-500 rounded-xl font-bold uppercase tracking-widest cursor-wait text-[11px] animate-pulse",
                    className
                )}
            >
                <Loader2 className="w-5 h-5 animate-spin opacity-30" />
                Checking Report...
            </button>
        );
    }

    if (status === "ready") {
        return (
            <button
                onClick={handleDownload}
                className={cn(
                    "flex items-center gap-3 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95 group text-[11px]",
                    className
                )}
            >
                <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Download Insight PDF
            </button>
        );
    }

    if (status === "generating" || status === "pending") {
        return (
            <div className={cn("flex flex-col items-center gap-3", className)}>
                {isSoftTimeout ? (
                    <button
                        onClick={() => triggerGeneration({ force: true })}
                        className="flex items-center gap-3 px-6 py-2.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-600/20 transition-all shadow-lg text-[11px]"
                    >
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Retry Now
                    </button>
                ) : (
                    <button
                        disabled
                        className="flex items-center gap-3 px-6 py-2.5 bg-slate-800 text-slate-400 rounded-xl font-bold uppercase tracking-widest cursor-wait text-[11px]"
                    >
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing Matrix...
                    </button>
                )}
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse text-center">
                    {isSoftTimeout ? "Server timed out. Tap to force retry." : "Synthesizing PDF Report"}
                </span>
            </div>
        );
    }

    if (cooldown > 0) {
        return (
            <button
                disabled
                className={cn(
                    "flex items-center gap-3 px-6 py-2.5 bg-slate-900 border border-slate-800 text-slate-500 rounded-xl font-bold uppercase tracking-widest transition-all text-[11px] cursor-not-allowed opacity-80",
                    className
                )}
            >
                <RefreshCw size={18} className="animate-spin-slow opacity-20" />
                Next Report in {cooldown}s
            </button>
        );
    }

    if (status === "failed" || error) {
        return (
            <button
                onClick={() => triggerGeneration({ force: true })}
                className={cn(
                    "flex items-center gap-3 px-6 py-2.5 bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600/20 text-rose-500 rounded-xl font-bold uppercase tracking-widest transition-all text-[11px]",
                    className
                )}
            >
                <AlertCircle size={18} />
                {error || "Generation Failed"}
            </button>
        );
    }

    return (
        <button
            onClick={() => triggerGeneration()}
            className={cn(
                "flex items-center gap-3 px-6 py-2.5 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-400 rounded-xl font-bold uppercase tracking-widest transition-all text-[11px]",
                className
            )}
        >
            <RefreshCw size={18} />
            Generate PDF Report
        </button>
    );
}

