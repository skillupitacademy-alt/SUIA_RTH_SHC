'use client';

import { useState } from 'react';
import { Lightbulb, Mail, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';
import { apiClient } from '@quiz/api-client';
import { cn } from '@/lib/utils';

interface Insight {
    topicId: string;
    topicName: string;
    priority: 'critical' | 'growth' | 'stable';
    label: string;
    recommendation: string;
    learningUrl?: string;
    accuracy: number;
}

interface TutorInsightsPanelProps {
    insights: Insight[];
}

export function TutorInsightsPanel({ insights }: TutorInsightsPanelProps) {
    const [requestedTopics, setRequestedTopics] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
    const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

    const handleRequestNotes = async (topicId: string) => {
        setRequestedTopics(prev => ({ ...prev, [topicId]: 'loading' }));
        try {
            await apiClient.quiz.requestMasterNotes(topicId);
            setRequestedTopics(prev => ({ ...prev, [topicId]: 'success' }));
            setErrorMessages(prev => {
                const next = { ...prev };
                delete next[topicId];
                return next;
            });
        } catch {
            setRequestedTopics(prev => ({ ...prev, [topicId]: 'error' }));
            setErrorMessages(prev => ({ ...prev, [topicId]: 'Unable to send master notes right now. Please try again.' }));
        }
    };

    if (insights.length === 0) return null;

    return (
        <section className="space-y-6 mt-12 bg-indigo-50/50 p-8 rounded-[3rem] border-2 border-indigo-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-600 rounded-xl text-white">
                    <Lightbulb size={24} />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Adaptive Tutor Insights</h3>
            </div>

            <p className="text-slate-600 font-medium max-w-2xl mb-8">
                Based on your DNA in this session, I’ve identified key areas that need immediate focus.
                You can request detailed master notes for these topics to be sent to your inbox.
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {insights.map((insight) => (
                    <div key={insight.topicId} className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex flex-col h-full group hover:border-indigo-200 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                                insight.priority === 'critical' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                            )}>
                                {insight.label}
                            </span>
                            <span className="text-xs font-bold text-slate-400">Accuracy: {insight.accuracy}%</span>
                        </div>

                        <h4 className="text-lg font-bold text-slate-800 mb-2 truncate">{insight.topicName}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-grow">
                            {insight.recommendation}
                        </p>

                        <div className="space-y-3 pt-4 border-t border-slate-50">
                            {insight.learningUrl && (
                                <a
                                    href={insight.learningUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-50 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-all"
                                >
                                    <ExternalLink size={16} /> Quick Refresher
                                </a>
                            )}

                            <button
                                onClick={() => handleRequestNotes(insight.topicId)}
                                disabled={requestedTopics[insight.topicId] === 'loading' || requestedTopics[insight.topicId] === 'success'}
                                className={cn(
                                    "flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all",
                                    requestedTopics[insight.topicId] === 'success'
                                        ? "bg-green-100 text-green-700 cursor-default"
                                        : "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                )}
                            >
                                {requestedTopics[insight.topicId] === 'loading' ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : requestedTopics[insight.topicId] === 'success' ? (
                                    <>
                                        <CheckCircle2 size={16} /> Sent to Inbox
                                    </>
                                ) : (
                                    <>
                                        <Mail size={16} /> Send Master Notes
                                    </>
                                )}
                            </button>
                            {requestedTopics[insight.topicId] === 'error' && (
                                <p className="text-xs text-red-500 text-center font-medium">{errorMessages[insight.topicId]}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
