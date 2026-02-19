"use client";

import { X, ExternalLink, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface NotesViewerProps {
    topicId: string;
    topicName: string;
    onClose: () => void;
}

export function NotesViewer({ topicId, topicName, onClose }: NotesViewerProps) {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchNotesUrl() {
            try {
                const res = await fetch(`/api/tutor/notes/view?topicId=${topicId}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to load notes");
                }
                const data = await res.json();
                setUrl(data.url);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load notes");
            } finally {
                setLoading(false);
            }
        }
        fetchNotesUrl();
    }, [topicId]);

    // Prevent background scrolling
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 bg-white border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                        <Loader2 className={loading ? "animate-spin" : ""} size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{topicName}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Refresher Notes</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {url && (
                        <>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
                            >
                                <ExternalLink size={14} /> Pop-out
                            </a>
                            <a
                                href={url}
                                download
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                            >
                                <Download size={14} /> Download
                            </a>
                        </>
                    )}
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center gap-4 text-white">
                        <Loader2 className="animate-spin text-orange-500" size={48} />
                        <p className="text-sm font-bold uppercase tracking-widest opacity-50">Fetching Secure Asset...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 bg-white rounded-3xl border border-slate-200 max-w-md text-center">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-4">
                            <X size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Access Denied</h3>
                        <p className="text-slate-500 mt-2 font-medium">{error}</p>
                        <button
                            onClick={onClose}
                            className="mt-6 px-8 py-3 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs"
                        >
                            Return to Mission
                        </button>
                    </div>
                ) : url ? (
                    <iframe
                        src={`${url}#toolbar=0`}
                        className="w-full h-full border-none bg-slate-800"
                        title={topicName}
                    />
                ) : null}
            </div>
        </div>
    );
}
