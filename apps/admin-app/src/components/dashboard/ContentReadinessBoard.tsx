'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { FileWarning, CheckCircle2, AlertCircle, Layers, Weight, Activity } from 'lucide-react';

export function ContentReadinessBoard() {
    const [topics, setTopics] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await apiClient.admin.getContentHealth();
                setTopics(data);
            } catch (err) {
                console.error("Failed to fetch content health", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, []);

    if (isLoading) return null;

    const criticalTopics = topics.filter(t => !t.isReady);
    const healthyTopicsCount = topics.length - criticalTopics.length;

    return (
        <div className="p-10 rounded-[3.5rem] border border-primary/10 bg-muted/5 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic text-[#1A1A1A]">Domain Structure & Readiness</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Syllabus overview • Question Bank Distribution</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-5 py-2 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <span className="text-[11px] font-black text-green-600 uppercase tracking-widest">{healthyTopicsCount} Ready</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                {topics.map((topic) => (
                    <div key={topic.topicId} className={`p-7 rounded-[2.5rem] bg-background border transition-all group flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-6 ${topic.isReady ? 'border-muted/50 hover:border-primary/30' : 'border-red-500/30 hover:border-red-500/50 bg-red-500/[0.02]'}`}>
                        <div className="flex items-center gap-6 flex-1 min-w-[300px]">
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border shadow-sm ${topic.isReady ? 'bg-primary/5 text-primary border-primary/10 shadow-primary/5' : 'bg-red-500/5 text-red-500 border-red-500/10 shadow-red-500/5'}`}>
                                {topic.isReady ? <Layers size={28} /> : <FileWarning size={28} />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="text-xl font-black tracking-tight text-[#1A1A1A]">{topic.topicName}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${topic.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {topic.status}
                                        </span>
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted border border-muted-foreground/10 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            <Weight size={10} />
                                            <span>W: {topic.weight}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted border border-muted-foreground/10 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            <Activity size={10} />
                                            <span>Lvl: {topic.complexity}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">{topic.domainName} • {topic.subjectName}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center px-4 py-2 rounded-2xl bg-muted/30 border border-muted-foreground/5 min-w-[70px]">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Simple</p>
                                    <p className={`text-sm font-black ${topic.stats.simple < 4 ? 'text-red-500' : 'text-[#1A1A1A]'}`}>{topic.stats.simple}/4</p>
                                </div>
                                <div className="text-center px-4 py-2 rounded-2xl bg-muted/30 border border-muted-foreground/5 min-w-[70px]">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Inter.</p>
                                    <p className={`text-sm font-black ${topic.stats.intermediate < 4 ? 'text-red-500' : 'text-[#1A1A1A]'}`}>{topic.stats.intermediate}/4</p>
                                </div>
                                <div className="text-center px-4 py-2 rounded-2xl bg-muted/30 border border-muted-foreground/5 min-w-[70px]">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Expert</p>
                                    <p className={`text-sm font-black ${topic.stats.expert < 5 ? 'text-red-500' : 'text-[#1A1A1A]'}`}>{topic.stats.expert}/5</p>
                                </div>
                            </div>
                            <div className="hidden md:block w-px h-12 bg-muted-foreground/10" />
                            <div className="min-w-[80px] text-right">
                                {topic.isReady ? (
                                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest italic">Standard_Met</span>
                                ) : (
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-tight italic">Action<br />Required</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
