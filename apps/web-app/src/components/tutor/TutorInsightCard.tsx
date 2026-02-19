"use client";

import { useEffect, useState } from "react";
import { Brain, ChevronDown, ChevronUp, ExternalLink, Sparkles, Zap, AlertCircle, FileText, MessagesSquare, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TopicProgressChart } from "./TopicProgressChart";
import { NotesViewer } from "./NotesViewer";

interface Recommendation {
    topicId: string;
    topicName: string;
    recommendationLevel: "revise" | "practice" | "advance";
    accuracy: number;
    learningUrl: string | null;
    totalQuestions: number;
    mistakeCount: number;
    weakSubareas: string[];
}

export function TutorInsightCard() {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
    const [viewingNotes, setViewingNotes] = useState<{ id: string; name: string } | null>(null);
    const [requestingHelp, setRequestingHelp] = useState<string | null>(null);
    const [requestedTopics, setRequestedTopics] = useState<Set<string>>(new Set());

    useEffect(() => {
        async function fetchRecommendations() {
            try {
                const res = await fetch("/api/recommendations/explain");
                if (res.ok) {
                    const data = await res.json();
                    setRecommendations(data);
                }
            } catch (err) {
                console.error("Failed to fetch recommendations", err);
            } finally {
                setLoading(false);
            }
        }
        fetchRecommendations();
    }, []);

    const toggleExpand = (topicId: string) => {
        setExpandedTopic(expandedTopic === topicId ? null : topicId);
    };

    const handleRequestHelp = async (topicId: string) => {
        setRequestingHelp(topicId);
        try {
            const res = await fetch("/api/tutor/help/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topicId }),
            });
            if (res.ok) {
                setRequestedTopics(prev => new Set(prev).add(topicId));
            }
        } catch (err) {
            console.error("Failed to request help", err);
        } finally {
            setRequestingHelp(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 animate-pulse">
                <div className="h-4 w-32 bg-slate-100 rounded mb-6" />
                <div className="space-y-4">
                    <div className="h-20 w-full bg-slate-50 rounded-2xl" />
                    <div className="h-20 w-full bg-slate-50 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) return null;

    return (
        <>
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:border-orange-500/20 transition-all duration-500 overflow-hidden relative group">
                {/* Decorative Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors duration-500" />

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                            <Brain size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">Smart Tutor Insights</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">AI-Powered Guidance</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <Zap size={10} className="text-orange-500 fill-orange-500" /> {recommendations.length} Focus Areas
                    </div>
                </div>

                <div className="space-y-3">
                    {recommendations.map((item) => (
                        <div
                            key={item.topicId}
                            className={cn(
                                "p-5 rounded-2xl border transition-all duration-300 group/card",
                                expandedTopic === item.topicId
                                    ? "bg-white border-orange-500/30 shadow-xl scale-[1.02]"
                                    : "bg-slate-50/50 border-slate-100 hover:border-orange-500/20 hover:bg-white hover:shadow-lg"
                            )}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className={cn(
                                            "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md",
                                            item.recommendationLevel === "revise" ? "bg-rose-50 text-rose-500 border border-rose-100" :
                                                item.recommendationLevel === "practice" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                                    "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                        )}>
                                            {item.recommendationLevel}
                                        </span>
                                        <div className="h-1 w-1 rounded-full bg-slate-200" />
                                        <span className="text-[10px] font-bold text-slate-400">{item.accuracy}% Accuracy</span>
                                    </div>
                                    <h4 className="text-base font-black text-slate-800 uppercase tracking-tight truncate">
                                        {item.topicName}
                                    </h4>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleExpand(item.topicId)}
                                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-500 hover:border-orange-500 transition-all flex items-center gap-1.5"
                                    >
                                        Why? {expandedTopic === item.topicId ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>
                                    <button
                                        onClick={() => setViewingNotes({ id: item.topicId, name: item.topicName })}
                                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-orange-500 hover:border-orange-500 transition-all active:scale-95 shadow-sm group-hover/card:shadow-md"
                                        title="View Study Notes"
                                    >
                                        <FileText size={16} />
                                    </button>
                                    {item.learningUrl && (
                                        <a
                                            href={item.learningUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-orange-500 hover:border-orange-500 transition-all active:scale-95 shadow-sm group-hover/card:shadow-md"
                                            title="Open Study Guide"
                                        >
                                            <ExternalLink size={16} />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Explainability Section */}
                            {expandedTopic === item.topicId && (
                                <div className="mt-5 pt-5 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50/50 border border-orange-100 mb-4">
                                        <AlertCircle className="text-orange-500 shrink-0" size={16} />
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 leading-tight">Reason for Recommendation</p>
                                            <p className="text-[11px] font-medium text-slate-600 mt-1">
                                                You answered <span className="text-orange-600 font-bold">{item.mistakeCount}</span> out of <span className="text-slate-900 font-bold">{item.totalQuestions}</span> questions incorrectly in your last mission.
                                            </p>
                                        </div>
                                    </div>

                                    {item.weakSubareas.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Weak Subareas Detected</p>
                                            <div className="flex flex-wrap gap-2">
                                                {item.weakSubareas.map(sub => (
                                                    <span key={sub} className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                                                        {sub}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <TopicProgressChart topicId={item.topicId} />

                                    {/* Live Help CTA for Revise level */}
                                    {item.recommendationLevel === "revise" && (
                                        <div className="mt-6 p-5 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800 shadow-xl shadow-slate-900/20 group/cta overflow-hidden relative">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-orange-400 group-hover/cta:scale-110 transition-transform">
                                                    <MessagesSquare size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black uppercase tracking-tight">Need 1-on-1 Guidance?</p>
                                                    <p className="text-[10px] font-medium text-slate-400">Request a live review session with a subject expert.</p>
                                                </div>
                                            </div>
                                            {requestedTopics.has(item.topicId) ? (
                                                <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black uppercase tracking-widest text-[10px]">
                                                    <CheckCircle2 size={14} /> Request Sent
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleRequestHelp(item.topicId)}
                                                    disabled={requestingHelp === item.topicId}
                                                    className="w-full md:w-auto px-6 py-3 rounded-xl bg-orange-500 text-white font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 relative z-10"
                                                >
                                                    {requestingHelp === item.topicId ? "Processing..." : "Request Live Help"}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-4 flex items-center gap-3">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-1000",
                                            item.accuracy < 50 ? "bg-rose-500" : item.accuracy < 75 ? "bg-amber-500" : "bg-emerald-500"
                                        )}
                                        style={{ width: `${item.accuracy}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-black text-slate-500">{item.accuracy}%</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center">
                    <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-500 transition-colors flex items-center gap-2">
                        <Sparkles size={12} /> Personalized Based on Your Mission Data
                    </button>
                </div>
            </div>

            {/* Notes Viewer Modal */}
            {viewingNotes && (
                <NotesViewer
                    topicId={viewingNotes.id}
                    topicName={viewingNotes.name}
                    onClose={() => setViewingNotes(null)}
                />
            )}
        </>
    );
}
