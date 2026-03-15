"use client";

import React, { useEffect, useState, useRef } from "react";
import { useReportStatus } from "@/hooks/useReportStatus";
import { useExportJob } from "@/hooks/useExportJob";
import { cn } from "@/lib/utils";
import { getApiBase } from "@/utils/apiBase";
import { 
  AlertCircle, 
  FileText, 
  Loader2, 
  RefreshCw, 
  Bell, 
  ChevronDown, 
  Database, 
  FileJson, 
  CheckCircle2
} from "lucide-react";
import { ReportGenerationModal, type ExportFormat } from "./ReportGenerationModal";
import { motion, AnimatePresence } from "framer-motion";
import { useReportTheme } from "./context/ReportThemeContext";
import { useReportThemeTokens } from "./hooks/useReportThemeTokens";

interface ReportDownloadButtonProps {
    attemptId: string;
    userId: string;
    className?: string;
}

export function ReportDownloadButton({ attemptId, userId, className }: ReportDownloadButtonProps) {
    const { status: pdfStatus, stage: pdfStage, loading: pdfLoading, downloadUrl: pdfUrl, error: pdfError, triggerGeneration: triggerPdf, cooldown: pdfCooldown } = useReportStatus(attemptId);
    const { triggerExport, status: exportStatus, stage: exportStage, downloadUrl: exportUrl, isExporting, error: exportError } = useExportJob();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeFormat, setActiveFormat] = useState<ExportFormat>("pdf");
    const [showNotification, setShowNotification] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [exportUrlMap, setExportUrlMap] = useState<{ json?: string; csv?: string; "student-insight-pdf"?: string }>({});
    const dropdownRef = useRef<HTMLDivElement>(null);
    const lastPdfStatus = useRef(pdfStatus);
    const lastExportStatus = useRef(exportStatus);

    // Sync modal/notifications for PDF
    useEffect(() => {
        if (pdfStatus === "generating" && lastPdfStatus.current !== "generating") {
            setActiveFormat("pdf");
            setIsModalOpen(true);
        }

        if (pdfStatus === "ready" && lastPdfStatus.current === "generating" && !isModalOpen) {
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 8000);
        }

        lastPdfStatus.current = pdfStatus;
    }, [pdfStatus, isModalOpen]);

    // Sync modal for JSON/CSV/Insight exports
    useEffect(() => {
        if (exportStatus === "processing" && lastExportStatus.current !== "processing") {
            setIsModalOpen(true);
        }
        lastExportStatus.current = exportStatus;
    }, [exportStatus]);

    useEffect(() => {
        if ((activeFormat === "json" || activeFormat === "csv" || activeFormat === "student-insight-pdf") && exportStatus === "ready" && exportUrl) {
            setExportUrlMap((prev) => ({ ...prev, [activeFormat]: exportUrl }));
        }
    }, [activeFormat, exportStatus, exportUrl]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Prefetch export URLs so ticks show for completed exports
    useEffect(() => {
        const shouldFetch = isDropdownOpen && attemptId && userId;
        if (!shouldFetch) return;

        const controller = new AbortController();
        const apiBase = getApiBase();
        const formats: Array<Exclude<ExportFormat, "pdf">> = ["json", "csv", "student-insight-pdf"];

        (async () => {
            for (const format of formats) {
                if (exportUrlMap[format]) continue;
                try {
                    const res = await fetch(`${apiBase}/export/urls?examId=${encodeURIComponent(attemptId)}&format=${encodeURIComponent(format)}`, {
                        credentials: "include",
                        signal: controller.signal
                    });
                    if (!res.ok) continue;
                    const data = (await res.json()) as { url?: string | null };
                    if (data.url) {
                        setExportUrlMap((prev) => ({ ...prev, [format]: data.url as string }));
                    }
                } catch (err) {
                    if ((err as { name?: string }).name === "AbortError") return;
                }
            }
        })();

        return () => controller.abort();
    }, [isDropdownOpen, attemptId, userId, exportUrlMap]);

    const handlePdfDownload = (urlParam?: string) => {
        const url = urlParam || pdfUrl;
        if (url) {
            const frameId = "pdf-download-frame";
            let frame = document.getElementById(frameId) as HTMLIFrameElement;
            if (!frame) {
                frame = document.createElement("iframe");
                frame.id = frameId;
                frame.title = "PDF download frame";
                frame.style.display = "none";
                document.body.appendChild(frame);
            }
            frame.src = url;
            setShowNotification(false);
            setIsDropdownOpen(false);
        }
    };

    const handleExportDownload = (url: string) => {
        const frameId = "export-download-frame";
        let frame = document.getElementById(frameId) as HTMLIFrameElement;
        if (!frame) {
            frame = document.createElement("iframe");
            frame.id = frameId;
            frame.title = "Export download frame";
            frame.style.display = "none";
            document.body.appendChild(frame);
        }
        frame.src = url;
        setIsDropdownOpen(false);
    };

    const handleExport = async (format: Exclude<ExportFormat, "pdf">) => {
        // Even if we have a cached/ticked URL, revalidate with the server.
        // This prevents "green tick but nothing downloads" when blob objects were deleted.
        const apiBase = getApiBase();
        try {
            const res = await fetch(`${apiBase}/export/urls?examId=${encodeURIComponent(attemptId)}&format=${encodeURIComponent(format)}`, {
                credentials: "include",
            });
            if (res.ok) {
                const data = (await res.json()) as { url?: string | null };
                if (typeof data.url === "string" && data.url.trim() !== "") {
                    setExportUrlMap((prev) => ({ ...prev, [format]: data.url as string }));
                    handleExportDownload(data.url);
                    return;
                }
            }
        } catch {
            // Fall through to regeneration path.
        }

        // No valid URL (or server unreachable) -> regenerate via export job.
        setExportUrlMap((prev) => {
            if (prev[format] === undefined) return prev;
            const next = { ...prev };
            delete next[format];
            return next;
        });
        setActiveFormat(format);
        triggerExport(attemptId, userId, format);
        setIsDropdownOpen(false);
        setIsModalOpen(true);
    };

    const { theme } = useReportTheme();
    const { tokens } = useReportThemeTokens();

    const handleTriggerPdf = async (options?: { force?: boolean }) => {
        setActiveFormat("pdf");
        if (pdfStatus === "ready" && pdfUrl) {
            handlePdfDownload();
            return;
        }
        await triggerPdf({ ...options, theme });
        setIsModalOpen(true);
        setIsDropdownOpen(false);
    };

    if (pdfLoading) {
        return (
            <button disabled className={cn("flex items-center gap-3 px-6 py-2.5 bg-slate-950/70 text-slate-500 rounded-2xl font-black uppercase tracking-[0.2em] cursor-wait text-[11px] animate-pulse border border-white/5", className)}>
                <Loader2 className="w-5 h-5 animate-spin opacity-30" />
                Preparing...
            </button>
        );
    }

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            {/* Success Notification (Toast) */}
            <AnimatePresence>
                {showNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-8 right-8 z-[110] flex items-center gap-4 p-4 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-600/40 border border-indigo-500/50 cursor-pointer"
                        onClick={() => handlePdfDownload()}
                    >
                        <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl">
                            <Bell className="w-5 h-5 animate-bounce" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider">Report Ready</div>
                            <p className="text-[11px] opacity-90 font-medium">Your Insight PDF is now available for download.</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setShowNotification(false); }} className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors">
                            <AlertCircle className="w-4 h-4 rotate-45" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Split Button Strategy */}
            <div className="flex items-stretch overflow-hidden rounded-2xl border border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
                {pdfStatus === "ready" ? (
                    <button
                        onClick={() => handlePdfDownload()}
                        className={cn(
                            "flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] group text-[11px] border-r border-indigo-500/50",
                            className
                        )}
                    >
                        <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Download PDF
                    </button>
                ) : (pdfStatus === "generating" || pdfStatus === "pending") ? (
                    <button
                        onClick={() => { setActiveFormat("pdf"); setIsModalOpen(true); }}
                        className={cn("flex items-center gap-3 px-6 py-3 bg-slate-950/70 text-indigo-400 font-black uppercase tracking-[0.2em] transition-all text-[11px] border-r border-white/5", className)}
                    >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {pdfStatus === "pending" ? "Preparing..." : "Generating..."}
                    </button>
                ) : (
                    <button
                        onClick={() => handleTriggerPdf()}
                        disabled={pdfCooldown > 0}
                        className={cn(
                            "flex items-center gap-3 px-6 py-3 bg-slate-950/70 border-r border-white/5 hover:bg-slate-900/80 text-indigo-400 font-black uppercase tracking-[0.2em] transition-all text-[11px] disabled:opacity-50",
                            className
                        )}
                    >
                        <RefreshCw className={cn("w-4 h-4", pdfCooldown > 0 && "animate-spin-slow opacity-30")} />
                        {pdfCooldown > 0 ? `Retry in ${pdfCooldown}s` : "Generate PDF"}
                    </button>
                )}

                {/* Dropdown Toggle */}
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="px-3 bg-indigo-700 hover:bg-indigo-600 text-white transition-colors border-l border-indigo-400/20"
                >
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isDropdownOpen && "rotate-180")} />
                </button>
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isDropdownOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-72 border rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] p-3 z-[120] backdrop-blur-2xl"
                        style={{ backgroundColor: tokens.cardBg, borderColor: tokens.borderSubtle }}
                    >
                        <div className="mb-2 px-3 py-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: tokens.textMuted }}>
                                Data Intelligence Export
                            </span>
                        </div>

                        {/* PDF Option (Duplicate of main but helpful in menu) */}
                        <button 
                            disabled={pdfStatus === "generating" || pdfStatus === "pending" || pdfCooldown > 0}
                            onClick={pdfStatus === "ready" ? () => handlePdfDownload() : () => handleTriggerPdf()}
                            className={cn(
                                "w-full flex items-center justify-between p-4 rounded-2xl transition-all group disabled:opacity-30 disabled:cursor-not-allowed border border-transparent",
                                theme === "dark" ? "hover:bg-slate-900/70 hover:border-white/5" : "hover:bg-slate-100/90 hover:border-black/5"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                    <FileText size={16} />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-black italic uppercase tracking-wider" style={{ color: tokens.textPrimary }}>Visual Report</div>
                                    <div className="text-[10px]" style={{ color: tokens.textSecondary }}>
                                        {pdfStatus === "ready" ? "Download PDF" : "Premium Insights PDF"}
                                    </div>
                                </div>
                            </div>
                            {pdfStatus === "ready" && <CheckCircle2 size={14} className="text-emerald-500" />}
                            {(pdfStatus === "generating" || pdfStatus === "pending") && <Loader2 size={14} className="text-indigo-500 animate-spin" />}
                        </button>

                        <div className="h-px my-1 mx-2" style={{ backgroundColor: tokens.borderSubtle }} />

                        {/* Student Insight PDF */}
                        <button 
                            onClick={() => { void handleExport("student-insight-pdf"); }}
                            disabled={isExporting}
                            className={cn(
                                "w-full flex items-center justify-between p-4 rounded-2xl transition-all group disabled:opacity-50 border border-transparent",
                                theme === "dark" ? "hover:bg-slate-900/70 hover:border-white/5" : "hover:bg-slate-100/90 hover:border-black/5"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                    <Bell size={16} />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-black uppercase tracking-wider italic" style={{ color: tokens.textPrimary }}>Neural Insight</div>
                                    <div className="text-[10px]" style={{ color: tokens.textSecondary }}>3-Page High Fidelity PDF</div>
                                </div>
                            </div>
                            {exportStatus === "processing" && activeFormat === "student-insight-pdf" && <Loader2 size={14} className="text-indigo-500 animate-spin" />}
                            {exportUrlMap["student-insight-pdf"] && <CheckCircle2 size={14} className="text-emerald-500" />}
                        </button>

                        <div className="h-px my-1 mx-2" style={{ backgroundColor: tokens.borderSubtle }} />

                        {/* JSON Export */}
                        <button 
                            onClick={() => { void handleExport("json"); }}
                            disabled={isExporting}
                            className={cn(
                                "w-full flex items-center justify-between p-4 rounded-2xl transition-all group disabled:opacity-50 border border-transparent",
                                theme === "dark" ? "hover:bg-slate-900/70 hover:border-white/5" : "hover:bg-slate-100/90 hover:border-black/5"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                    <FileJson size={16} />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-black uppercase tracking-wider" style={{ color: tokens.textPrimary }}>Deep Analytics</div>
                                    <div className="text-[10px]" style={{ color: tokens.textSecondary }}>JSON Fact Structure</div>
                                </div>
                            </div>
                            {exportStatus === "processing" && activeFormat === "json" && <Loader2 size={14} className="text-amber-500 animate-spin" />}
                            {exportUrlMap["json"] && <CheckCircle2 size={14} className="text-emerald-500" />}
                        </button>

                        {/* CSV Export */}
                        <button 
                            onClick={() => { void handleExport("csv"); }}
                            disabled={isExporting}
                            className={cn(
                                "w-full flex items-center justify-between p-4 rounded-2xl transition-all group disabled:opacity-50 border border-transparent",
                                theme === "dark" ? "hover:bg-slate-900/70 hover:border-white/5" : "hover:bg-slate-100/90 hover:border-black/5"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                    <Database size={16} />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-black uppercase tracking-wider" style={{ color: tokens.textPrimary }}>Data Engineering</div>
                                    <div className="text-[10px]" style={{ color: tokens.textSecondary }}>14-File CSV Bundle (ZIP)</div>
                                </div>
                            </div>
                            {exportStatus === "processing" && activeFormat === "csv" && <Loader2 size={14} className="text-emerald-500 animate-spin" />}
                            {exportUrlMap["csv"] && <CheckCircle2 size={14} className="text-emerald-500" />}
                        </button>

                        {(pdfError || exportError) && (
                            <div className="mt-2 p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                                <span className="text-[9px] text-rose-400 font-medium leading-tight block">
                                    {pdfError || exportError}
                                </span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden download frame */}
            <iframe id="pdf-download-frame-hidden" title="PDF download frame" className="hidden" />
            <iframe id="export-download-frame-hidden" title="Export download frame" className="hidden" />

            <ReportGenerationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                status={activeFormat === "pdf" ? pdfStatus : exportStatus}
                stage={activeFormat === "pdf" ? pdfStage : exportStage}
                error={activeFormat === "pdf" ? pdfError : exportError}
                downloadUrl={activeFormat === "pdf" ? pdfUrl : exportUrl}
                attemptId={attemptId}
                format={activeFormat}
            />
        </div>
    );
}
