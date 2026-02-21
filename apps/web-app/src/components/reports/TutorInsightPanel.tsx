'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lightbulb,
    Mail,
    CheckCircle,
    Loader2,
    Activity
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiClient } from "@quiz/api-client";
import { MethodologyDisclaimer } from './MethodologyDisclaimer';


export interface TutorInsight {
    topicId: string;
    topicName: string;
    priority: "critical" | "growth" | "stable";
    label: string;
    recommendation: string;
    learningUrl?: string;
    accuracy: number;
}

export interface TutorInsightPanelProps {
    insights: TutorInsight[];
}

export const TutorInsightPanel = React.memo(({ insights }: TutorInsightPanelProps) => {
    const [requesting, setRequesting] = useState<string | null>(null);
    const [completed, setCompleted] = useState<Set<string>>(new Set());

    const handleRequestNotes = async (topicId: string, topicName: string) => {
        try {
            setRequesting(topicId);

            await apiClient.tutor.requestMasterNotes(topicId);

            setCompleted(prev => new Set(prev).add(topicId));
            toast.success(`Master Notes for ${topicName} sent to your inbox!`);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to request master notes. Please try again.";
            toast.error(message);
        } finally {
            setRequesting(null);
        }
    };

    if (!insights || insights.length === 0) return null;

    return (
        <div className="w-full bg-[#0a0c12]/80 border border-indigo-500/10 rounded-[3rem] p-10 lg:p-14 backdrop-blur-xl relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none group-hover:bg-indigo-500/15 transition-colors duration-700" />

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12">
                    <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        <Lightbulb className="h-8 w-8 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Adaptive Tutor Insights</h3>
                        <p className="text-slate-400 max-w-2xl text-[15px] leading-relaxed">
                            Based on your DNA in this session, I have identified key areas that need immediate focus.
                            You can request <span className="text-indigo-400 font-bold">detailed master notes</span> for these topics to be sent to your inbox.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {insights.map((insight, idx) => (
                        <motion.div
                            key={insight.topicId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col h-full hover:bg-slate-900/60 hover:border-indigo-500/20 transition-all duration-500 group/card"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <span className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    insight.priority === 'critical'
                                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                        : (insight.priority === 'growth' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400")
                                )}>
                                    {insight.label}
                                </span>
                                <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest pt-0.5">
                                    Accuracy: <span className={cn(
                                        insight.accuracy < 50 ? "text-rose-400" : (insight.accuracy < 75 ? "text-amber-400" : "text-emerald-400")
                                    )}>{insight.accuracy}%</span>
                                </span>
                            </div>

                            <h4 className="text-xl font-bold text-white mb-4 group-hover/card:text-indigo-300 transition-colors">
                                {insight.topicName}
                            </h4>

                            <p className="text-slate-400 text-[14px] leading-relaxed mb-8 flex-grow">
                                {insight.recommendation}
                            </p>

                            <button
                                onClick={() => handleRequestNotes(insight.topicId, insight.topicName)}
                                disabled={requesting === insight.topicId || completed.has(insight.topicId)}
                                className={cn(
                                    "w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[13px] uppercase tracking-widest transition-all duration-300 overflow-hidden relative",
                                    completed.has(insight.topicId)
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default"
                                        : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_10px_20px_rgba(79,70,229,0.3)] active:scale-95"
                                )}
                            >
                                <AnimatePresence mode="wait">
                                    {requesting === insight.topicId ? (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="flex items-center gap-2"
                                        >
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Dispatching...</span>
                                        </motion.div>
                                    ) : completed.has(insight.topicId) ? (
                                        <motion.div
                                            key="completed"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-2"
                                        >
                                            <CheckCircle size={16} />
                                            <span>Notes Sent</span>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="default"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-2"
                                        >
                                            <Mail size={16} />
                                            <span>Send Master Notes</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Footer Mirroring AI Panel Style */}
                <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">
                    <div className="flex items-center gap-2">
                        <Activity size={12} className="text-indigo-400" />
                        <span>Vector Extraction active</span>
                    </div>
                </div>
            </div>

            <MethodologyDisclaimer
                className="mt-10"
                text="TUTOR INSIGHTS: DERIVED FROM CROSS-REFERENCE OF HISTORICAL STRESS-PERFORMANCE CURVES AND RECENT TOPIC FLUENCY DATA NODES."
            />
        </div>
    );
});

TutorInsightPanel.displayName = "TutorInsightPanel";
