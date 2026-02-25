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
                className="fixed inset-0 z-[100] flex flex-col bg-[#020617]"
            >
                {/* Immersive Background Texture */}
                <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.8)_100%)]" />
                </div>

                <div className="relative flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="w-full max-w-2xl mx-auto"
                    >
                        {/* Header Section */}
                        <div className="text-center mb-16">
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 mb-8 backdrop-blur-xl"
                            >
                                {isReady ? (
                                    <FileText className="w-12 h-12 text-indigo-400" />
                                ) : isFailed ? (
                                    <AlertCircle className="w-12 h-12 text-rose-500" />
                                ) : (
                                    <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
                                )}
                            </motion.div>

                            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 uppercase italic">
                                {isReady ? "Analysis Complete" : isFailed ? "System Fault" : "Neural Pipeline"}
                            </h2>
                            <p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto font-medium leading-relaxed">
                                {isReady
                                    ? "Your high-fidelity diagnostic report has been synthesized and is prepared for download."
                                    : isFailed
                                        ? "A critical error occurred during the synthesis process. The pipeline has been halted."
                                        : "Executing deep-layer synthesis of your examination performance data..."
                                }
                            </p>
                        </div>

                        {/* Progress Timeline - Large Scale */}
                        {!isFailed && (
                            <div className="relative space-y-12 mb-16 px-4 md:px-12">
                                {STAGES.map((s, idx) => {
                                    const isActive = idx === currentStageIndex;
                                    const isCompleted = idx < currentStageIndex || isReady;

                                    return (
                                        <div key={s.id} className="relative flex items-center gap-8">
                                            {/* Vertical connector line */}
                                            {idx < STAGES.length - 1 && (
                                                <div className={cn(
                                                    "absolute left-[15px] top-10 w-[2px] h-16",
                                                    isCompleted ? "bg-indigo-600" : "bg-slate-800"
                                                )} />
                                            )}

                                            <div className="z-10 bg-[#020617] p-1">
                                                {isCompleted ? (
                                                    <CheckCircle2 className="w-8 h-8 text-indigo-500" />
                                                ) : isActive ? (
                                                    <div className="relative">
                                                        <Circle className="w-8 h-8 text-indigo-400 animate-pulse" />
                                                        <div className="absolute inset-0 bg-indigo-500/30 blur-xl rounded-full animate-pulse" />
                                                    </div>
                                                ) : (
                                                    <Circle className="w-8 h-8 text-slate-800" />
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <div className={cn(
                                                    "text-lg font-black uppercase tracking-[0.2em]",
                                                    isActive ? "text-white" : isCompleted ? "text-slate-400" : "text-slate-700"
                                                )}>
                                                    {s.label}
                                                </div>
                                                {isActive && (
                                                    <motion.p
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="text-sm text-indigo-400 font-semibold mt-1"
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

                        {/* Error Context */}
                        {isFailed && (
                            <div className="bg-rose-600/5 border border-rose-500/10 rounded-3xl p-8 mb-12 backdrop-blur-xl">
                                <div className="flex gap-6">
                                    <XCircle className="w-8 h-8 text-rose-500 shrink-0 mt-1" />
                                    <div>
                                        <div className="text-xl font-black text-rose-500 uppercase tracking-widest mb-2">Diagnostic Error</div>
                                        <p className="text-lg text-rose-400/80 leading-relaxed font-medium">
                                            {error || "An internal timeout occurred during PDF buffer allocation. High-memory usage detected."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Region */}
                        <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
                            {isReady ? (
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center justify-center gap-4 w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 group text-lg"
                                >
                                    <Download className="w-6 h-6 group-hover:bounce" />
                                    Download Result
                                </button>
                            ) : isFailed ? (
                                <button
                                    onClick={onClose}
                                    className="flex items-center justify-center gap-4 w-full py-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-3xl font-black uppercase tracking-[0.2em] transition-all text-lg"
                                >
                                    Abort & Recovery
                                </button>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="flex items-center justify-center gap-4 w-full py-6 bg-indigo-600/5 hover:bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 rounded-3xl font-black uppercase tracking-[0.2em] transition-all text-lg"
                                >
                                    Return to Hub
                                </button>
                            )}

                            <div className="flex flex-col items-center gap-2 mt-8">
                                <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                                <p className="text-xs text-slate-600 font-extrabold uppercase tracking-[0.4em]">
                                    Neural Architecture v4.2 • Secured by R2
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
