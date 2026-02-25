"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    Circle,
    FileText,
    Loader2,
    XCircle,
    Download,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    status: string;
    stage: string | null;
    error: string | null;
    downloadUrl: string | null;
    attemptId: string;
}

const STAGES = [
    { id: "queued", label: "Initialization", description: "Request received, preparing analytics engine..." },
    { id: "rendering", label: "Analysis & Rendering", description: "Synthesizing performance matrix & building PDF..." },
    { id: "uploading", label: "Finalizing", description: "Encrypting & uploading to secure storage..." },
    { id: "ready", label: "Complete", description: "Your insight report is ready for download." }
];

export function ReportGenerationModal({
    isOpen,
    onClose,
    status,
    stage,
    error,
    downloadUrl,
}: ReportGenerationModalProps) {
    // Use a local stage tracker to handle smooth transitions especially for the "ready" state
    const [currentStageIndex, setCurrentStageIndex] = useState(0);

    useEffect(() => {
        if (status === "ready") {
            setCurrentStageIndex(3);
        } else if (stage === "uploading") {
            setCurrentStageIndex(2);
        } else if (stage === "rendering") {
            setCurrentStageIndex(1);
        } else if (stage === "queued" || status === "pending") {
            setCurrentStageIndex(0);
        }
    }, [stage, status]);

    if (!isOpen) return null;

    const isFailed = status === "failed" || !!error;
    const isReady = status === "ready";

    const handleDownload = () => {
        if (downloadUrl) {
            window.open(downloadUrl, "_blank");
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-8"
                >
                    {/* Decorative background pulse */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-600/10 blur-[120px] pointer-events-none" />

                    {/* Header */}
                    <div className="relative mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 mb-6 group">
                            {isReady ? (
                                <FileText className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
                            ) : isFailed ? (
                                <AlertCircle className="w-8 h-8 text-rose-500" />
                            ) : (
                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            {isReady ? "Report Complete" : isFailed ? "Generation Failed" : "Synthesizing Report"}
                        </h2>
                        <p className="text-slate-400 mt-2 text-sm max-w-sm mx-auto">
                            {isReady
                                ? "Your high-fidelity neural diagnostic report has been generated and is ready for download."
                                : isFailed
                                    ? "An error occurred during the synthesis process. Please try again or contact support."
                                    : "We are processing your exam data through our diagnostic pipeline to generate your deep insight report."
                            }
                        </p>
                    </div>

                    {/* Progress Timeline */}
                    {!isFailed && (
                        <div className="relative space-y-6 mb-10">
                            {STAGES.map((s, idx) => {
                                const isActive = idx === currentStageIndex;
                                const isCompleted = idx < currentStageIndex || isReady;

                                return (
                                    <div key={s.id} className="relative flex items-start gap-4">
                                        {/* Vertical connector line */}
                                        {idx < STAGES.length - 1 && (
                                            <div className={cn(
                                                "absolute left-[11px] top-6 w-[2px] h-10",
                                                isCompleted ? "bg-indigo-600" : "bg-slate-800"
                                            )} />
                                        )}

                                        <div className="z-10 mt-1">
                                            {isCompleted ? (
                                                <CheckCircle2 className="w-6 h-6 text-indigo-500" />
                                            ) : isActive ? (
                                                <div className="relative">
                                                    <Circle className="w-6 h-6 text-indigo-400 animate-pulse" />
                                                    <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-full animate-pulse" />
                                                </div>
                                            ) : (
                                                <Circle className="w-6 h-6 text-slate-700" />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <div className={cn(
                                                "text-sm font-bold uppercase tracking-widest",
                                                isActive ? "text-white" : isCompleted ? "text-slate-300" : "text-slate-600"
                                            )}>
                                                {s.label}
                                            </div>
                                            {isActive && (
                                                <motion.p
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="text-xs text-indigo-400 font-medium mt-1"
                                                >
                                                    {s.description}
                                                </motion.p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Failure State */}
                    {isFailed && (
                        <div className="bg-rose-600/5 border border-rose-500/10 rounded-2xl p-4 mb-8">
                            <div className="flex gap-3">
                                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-sm font-bold text-rose-500 uppercase tracking-widest">Error Details</div>
                                    <p className="text-[13px] text-rose-400/80 mt-1 leading-relaxed">
                                        {error || "An unexpected system error occurred while generating the PDF buffer. Please check your connection and try again."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex flex-col gap-3">
                        {isReady ? (
                            <button
                                onClick={handleDownload}
                                className="flex items-center justify-center gap-3 w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
                            >
                                <Download className="w-5 h-5 group-hover:bounce" />
                                Download Report
                            </button>
                        ) : isFailed ? (
                            <button
                                onClick={onClose}
                                className="flex items-center justify-center gap-3 w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold uppercase tracking-widest transition-all"
                            >
                                Close & Retry
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="flex items-center justify-center gap-3 w-full py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded-2xl font-bold uppercase tracking-widest transition-all"
                            >
                                Continue in Background
                            </button>
                        )}

                        <p className="text-[10px] text-center text-slate-600 font-medium uppercase tracking-[0.2em] mt-2">
                            Neural Diagnostic Pipeline v4.0 • Secured by R2
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
