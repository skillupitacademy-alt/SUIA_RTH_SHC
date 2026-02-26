"use client";

import React, { useEffect, useState, useRef } from "react";
import { useReportStatus } from "@/hooks/useReportStatus";
import { cn } from "@/lib/utils";
import { AlertCircle, FileText, Loader2, RefreshCw, Bell } from "lucide-react";
import { ReportGenerationModal } from "./ReportGenerationModal";
import { motion, AnimatePresence } from "framer-motion";

interface ReportDownloadButtonProps {
    attemptId: string;
    className?: string;
}

export function ReportDownloadButton({ attemptId, className }: ReportDownloadButtonProps) {
    const { status, stage, loading, downloadUrl, error, triggerGeneration, cooldown } = useReportStatus(attemptId);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const lastStatus = useRef(status);

    // Auto-open modal when generation starts
    useEffect(() => {
        if (status === "generating" && lastStatus.current !== "generating") {
            setIsModalOpen(true);
        }

        // Show notification if report becomes ready while modal is closed
        if (status === "ready" && lastStatus.current === "generating" && !isModalOpen) {
            setShowNotification(true);
            // Hide notification after 8 seconds
            setTimeout(() => setShowNotification(false), 8000);
        }

        lastStatus.current = status;
    }, [status, isModalOpen]);

    const handleDownload = () => {
        if (downloadUrl) {
            // High-reliability iframe download trigger
            const frameId = "pdf-download-frame";
            let frame = document.getElementById(frameId) as HTMLIFrameElement;
            if (!frame) {
                frame = document.createElement("iframe");
                frame.id = frameId;
                frame.style.display = "none";
                document.body.appendChild(frame);
            }
            frame.src = downloadUrl;
            setShowNotification(false);
        }
    };

    const handleTrigger = async (options?: { force?: boolean }) => {
        await triggerGeneration(options);
        setIsModalOpen(true);
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

    return (
        <>
            {/* Success Notification (Toast) */}
            <AnimatePresence>
                {showNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-8 right-8 z-[110] flex items-center gap-4 p-4 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-600/40 border border-indigo-500/50 cursor-pointer"
                        onClick={handleDownload}
                    >
                        <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl">
                            <Bell className="w-5 h-5 animate-bounce" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider">Report Ready</div>
                            <p className="text-[11px] opacity-90 font-medium">Your Insight PDF is now available for download.</p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowNotification(false); }}
                            className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <AlertCircle className="w-4 h-4 rotate-45" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Button States */}
            {status === "ready" ? (
                <div className="relative">
                    {/* Visual Pulse Nudge */}
                    <div className="absolute inset-0 bg-indigo-500/30 blur-xl rounded-xl animate-pulse" />

                    <button
                        onClick={handleDownload}
                        className={cn(
                            "relative flex items-center gap-3 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95 group text-[11px]",
                            className
                        )}
                    >
                        <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Download Insight PDF
                    </button>
                </div>
            ) : (status === "generating" || status === "pending") ? (
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={cn(
                        "flex items-center gap-3 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl font-bold uppercase tracking-widest transition-all text-[11px] border border-slate-700/50",
                        className
                    )}
                >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {stage === "rendering" ? "Rendering PDF..." : stage === "uploading" ? "Finalizing..." : "Analyzing Matrix..."}
                </button>
            ) : cooldown > 0 ? (
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
            ) : (status === "failed" || error) ? (
                <button
                    onClick={() => handleTrigger({ force: true })}
                    className={cn(
                        "flex items-center gap-3 px-6 py-2.5 bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600/20 text-rose-500 rounded-xl font-bold uppercase tracking-widest transition-all text-[11px]",
                        className
                    )}
                >
                    <AlertCircle size={18} />
                    {error || "Generation Failed"}
                </button>
            ) : (
                <button
                    onClick={() => handleTrigger()}
                    className={cn(
                        "flex items-center gap-3 px-6 py-2.5 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-400 rounded-xl font-bold uppercase tracking-widest transition-all text-[11px]",
                        className
                    )}
                >
                    <RefreshCw size={18} />
                    Generate PDF Report
                </button>
            )}

            {/* Premium Generation Modal */}
            <ReportGenerationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                status={status}
                stage={stage}
                error={error}
                downloadUrl={downloadUrl}
                attemptId={attemptId}
            />
        </>
    );
}


