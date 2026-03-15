"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    Circle,
    FileText,
    Loader2,
    XCircle,
    Download,
    AlertCircle,
    FileJson,
    Database,
    Bell
} from "lucide-react";
import { createPortal } from "react-dom";
import { useReportThemeTokens } from "./hooks/useReportThemeTokens";

export type ExportFormat = "pdf" | "json" | "csv" | "student-insight-pdf";

interface ReportGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    status: string;
    stage: string | null;
    error: string | null;
    downloadUrl: string | null;
    attemptId: string;
    format?: ExportFormat;
}

const STAGES_CONFIG: Record<ExportFormat, { id: string; label: string; description: string }[]> = {
    pdf: [
        { id: "queued", label: "Initialization", description: "Request received, preparing analytics engine..." },
        { id: "rendering", label: "Analysis & Rendering", description: "Synthesizing performance matrix & building PDF..." },
        { id: "uploading", label: "Finalizing", description: "Encrypting & uploading to secure storage..." },
        { id: "ready", label: "Complete", description: "Your insight report is ready for download." }
    ],
    json: [
        { id: "queued", label: "Initialization", description: "Requesting server-side analytical synthesis..." },
        { id: "processing", label: "Data Synthesis", description: "Aggregating 12 KPI layers into raw fact structure..." },
        { id: "finalizing", label: "Formatting", description: "Serializing JSON envelope and verifying schema..." },
        { id: "ready", label: "Complete", description: "Your data intelligence file is ready for download." }
    ],
    csv: [
        { id: "queued", label: "Initialization", description: "Triggering multi-stage aggregation pipeline..." },
        { id: "aggregating", label: "KPI Extraction", description: "Calculating domain, subtopic, and skill masteries..." },
        { id: "zipping", label: "ZIP Packaging", description: "Bundling 14 CSV files into a secure archive..." },
        { id: "ready", label: "Complete", description: "Your 14-file analytical bundle is ready for download." }
    ],
    "student-insight-pdf": [
        { id: "queued", label: "Neural Init", description: "Spinning up insight vector processing engine..." },
        { id: "processing", label: "Deep Synthesis", description: "Fusing 12 KPI layers with behavioral cognitive patterns..." },
        { id: "rendering", label: "Page Generation", description: "Building high-fidelity 3-page A4 insight matrix..." },
        { id: "ready", label: "Complete", description: "Your premium Student Insight PDF is ready for download." }
    ]
};

export function ReportGenerationModal({
    isOpen,
    onClose,
    status,
    stage,
    error,
    downloadUrl,
    format = "pdf"
}: ReportGenerationModalProps) {
    const { tokens } = useReportThemeTokens();
    const [displayStageIndex, setDisplayStageIndex] = useState(0);
    const [targetStageIndex, setTargetStageIndex] = useState(0);
    const [mounted, setMounted] = useState(false);
    const timeoutsRef = useRef<number[]>([]);

    const stages = STAGES_CONFIG[format];

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Compute a target stage index from the latest backend state.
        // Backend can jump quickly (e.g. queued -> ready in a single poll),
        // so we animate displayStageIndex separately to keep stages legible.
        const lastIdx = stages.length - 1;

        let nextTarget = 0;
        if (status === "ready" || status === "completed") {
            nextTarget = lastIdx;
        } else if (status === "failed" || !!error) {
            nextTarget = Math.min(targetStageIndex, lastIdx);
        } else if (stage === "uploading" || stage === "finalizing" || stage === "zipping") {
            nextTarget = Math.min(2, lastIdx);
        } else if (stage === "rendering") {
            // For Student Insight, rendering is stage #2 (queued -> processing -> rendering -> ready).
            // For Visual PDF, rendering is stage #1 (queued -> rendering -> uploading -> ready).
            nextTarget = format === "student-insight-pdf" ? Math.min(2, lastIdx) : Math.min(1, lastIdx);
        } else if (stage === "processing" || stage === "aggregating") {
            nextTarget = Math.min(1, lastIdx);
        } else {
            nextTarget = 0;
        }

        setTargetStageIndex(nextTarget);
    }, [stage, status, format, stages.length, error, targetStageIndex]);

    useEffect(() => {
        // Clear any in-flight timers when target changes or modal closes.
        timeoutsRef.current.forEach((t) => window.clearTimeout(t));
        timeoutsRef.current = [];

        if (!isOpen) return;

        // Snap backwards immediately (new run).
        if (targetStageIndex < displayStageIndex) {
            setDisplayStageIndex(targetStageIndex);
            return;
        }

        // Step forward with minimum dwell time so users perceive each stage.
        const minStageMs = format === "pdf" ? 700 : 550;
        let delay = 0;
        for (let idx = displayStageIndex + 1; idx <= targetStageIndex; idx += 1) {
            delay += minStageMs;
            const t = window.setTimeout(() => setDisplayStageIndex(idx), delay);
            timeoutsRef.current.push(t);
        }

        return () => {
            timeoutsRef.current.forEach((t) => window.clearTimeout(t));
            timeoutsRef.current = [];
        };
    }, [targetStageIndex, displayStageIndex, format, isOpen]);

    if (!isOpen || !mounted) return null;

    const isFailed = status === "failed" || !!error;
    const isReady = status === "ready" || status === "completed";
    const uiReady = isReady && displayStageIndex >= stages.length - 1;

    const handleDownload = () => {
        if (downloadUrl) {
            const frameId = "artifact-download-frame";
            let frame = document.getElementById(frameId) as HTMLIFrameElement | null;
            if (!frame) {
                frame = document.createElement("iframe");
                frame.id = frameId;
                frame.title = "Download frame";
                frame.style.display = "none";
                document.body.appendChild(frame);
            }
            frame.src = downloadUrl;
        }
    };

    const modalContent = (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex flex-col"
                style={{ backgroundColor: tokens.pageBg }}
            >
                <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-indigo-600/10 blur-[100px] rounded-full" />
                    <div className="absolute bottom-[-5%] right-[-5%] w-[20%] h-[40%] bg-blue-600/5 blur-[100px] rounded-full" />
                </div>

                <div className="absolute top-0 inset-x-0 p-6 flex justify-end z-50">
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-xl border transition-all group active:scale-95"
                        style={{ backgroundColor: tokens.cardBg, borderColor: tokens.borderSubtle }}
                    >
                        <XCircle className="w-5 h-5 group-hover:text-indigo-400" style={{ color: tokens.textSecondary }} />
                    </button>
                </div>

                <div className="relative flex-1 flex flex-col items-center justify-center p-6 md:p-8 overflow-y-auto">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="w-full max-w-xl mx-auto"
                    >
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-indigo-600/5 border border-indigo-500/10 mb-6 backdrop-blur-xl">
                                {isReady ? (
                                    format === "pdf" ? <FileText className="w-10 h-10 text-indigo-400" /> :
                                    format === "json" ? <FileJson className="w-10 h-10 text-amber-400" /> :
                                    format === "csv" ? <Database className="w-10 h-10 text-emerald-400" /> :
                                    <Bell className="w-10 h-10 text-indigo-400" />
                                ) : isFailed ? (
                                    <AlertCircle className="w-10 h-10 text-rose-500" />
                                ) : (
                                    <Loader2 className="w-10 h-10 text-indigo-400/80 animate-spin" />
                                )}
                            </div>

                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 uppercase" style={{ color: tokens.textPrimary }}>
                                {isReady ? "Export Complete" : isFailed ? "System Fault" : "Synthesis Pipeline"}
                            </h2>
                            <p className="text-base md:text-lg max-w-md mx-auto font-medium leading-relaxed" style={{ color: tokens.textSecondary }}>
                                {isReady
                                    ? `Your ${format.toUpperCase().replace("-PDF", "")} artifact has been synthesized and is prepared for download.`
                                    : isFailed
                                        ? "A critical error occurred during synthesis. The pipeline has been halted."
                                        : `Executing deep-layer ${format.toUpperCase().replace("-PDF", "")} synthesis...`
                                }
                            </p>
                        </div>

                        {!isFailed && (
                            <div className="relative space-y-8 mb-10 px-4 md:px-8">
                                {stages.map((s, idx) => {
                                    const isActive = idx === displayStageIndex && !isFailed;
                                    const isCompleted = idx < displayStageIndex || (uiReady && idx === stages.length - 1);

                                    return (
                                        <div key={s.id} className="relative flex items-center gap-6">
                                            {idx < stages.length - 1 && (
                                                <div
                                                    className="absolute left-[13px] top-9 w-[1px] h-10"
                                                    style={{ backgroundColor: isCompleted ? "rgba(79,70,229,0.50)" : tokens.borderSubtle }}
                                                />
                                            )}

                                            <div className="z-10 p-1" style={{ backgroundColor: tokens.pageBg }}>
                                                {isCompleted ? (
                                                    <CheckCircle2 className="w-6 h-6 text-indigo-500" />
                                                ) : isActive ? (
                                                    <div className="relative">
                                                        <Circle className="w-6 h-6 text-indigo-400" />
                                                        <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full animate-pulse" />
                                                    </div>
                                                ) : (
                                                    <Circle className="w-6 h-6 text-slate-800" />
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <div
                                                    className="text-base font-semibold uppercase tracking-wider"
                                                    style={{
                                                        color: isActive
                                                            ? tokens.textPrimary
                                                            : isCompleted
                                                                ? tokens.textSecondary
                                                                : tokens.textMuted
                                                    }}
                                                >
                                                    {s.label}
                                                </div>
                                                {isActive && (
                                                    <motion.p
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="text-[13px] font-medium mt-0.5"
                                                        style={{ color: tokens.textSecondary }}
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

                        {isFailed && (
                            <div className="bg-rose-600/5 border border-rose-500/10 rounded-[2rem] p-6 mb-10 backdrop-blur-xl">
                                <div className="flex gap-4">
                                    <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-base font-bold text-rose-500 uppercase tracking-wider mb-1">Diagnostic Error</div>
                                        <p className="text-sm text-rose-400/80 leading-relaxed font-medium">
                                            {error || `An internal error occurred during ${format.toUpperCase()} buffer allocation.`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
                            {uiReady ? (
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center justify-center gap-3 w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold uppercase tracking-wider transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] group text-sm"
                                >
                                    <Download className="w-5 h-5" />
                                    Download Artifact
                                </button>
                            ) : isReady ? (
                                <button
                                    disabled
                                    className="flex items-center justify-center gap-3 w-full py-4 bg-indigo-600/40 text-white/80 rounded-2xl font-bold uppercase tracking-wider transition-all shadow-xl shadow-indigo-600/10 text-sm cursor-not-allowed"
                                >
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Preparing Download
                                </button>
                            ) : isFailed ? (
                                <button
                                    onClick={onClose}
                                    className="flex items-center justify-center gap-3 w-full py-4 border rounded-2xl font-bold uppercase tracking-wider transition-all text-sm active:scale-[0.98]"
                                    style={{ backgroundColor: tokens.cardBg, color: tokens.textPrimary, borderColor: tokens.borderMedium }}
                                >
                                    Abort Process
                                </button>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="flex items-center justify-center gap-3 w-full py-4 border rounded-2xl font-bold uppercase tracking-wider transition-all text-sm active:scale-[0.98]"
                                    style={{ backgroundColor: tokens.cardBg, color: tokens.textSecondary, borderColor: tokens.borderSubtle }}
                                >
                                    Return to Hub
                                </button>
                            )}

                            <div className="flex flex-col items-center gap-2 mt-6">
                                <div className="h-px w-16 bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: tokens.textMuted }}>
                                    Analytical Engine v4.5 • Secure Synthesis
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );

    const target = typeof document !== "undefined" ? document.getElementById("modal-root") : null;
    return target ? createPortal(modalContent, target) : null;
}
