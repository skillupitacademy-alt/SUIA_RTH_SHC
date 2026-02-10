'use client';

import React from 'react';
import { ActionPlanItem } from '@quiz/api-client';
import { AlertCircle, BookOpen, CheckCircle, ChevronRight } from 'lucide-react';

interface ActionPlanPanelProps {
    items: ActionPlanItem[];
}

const ActionPlanPanel: React.FC<ActionPlanPanelProps> = ({ items }) => {
    if (!items || items.length === 0) return null;

    const getPriorityStyles = (priority: ActionPlanItem['priority']) => {
        switch (priority) {
            case 'critical':
                return {
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/20',
                    icon: <AlertCircle className="w-5 h-5 text-red-600" />,
                    labelColor: 'text-red-900'
                };
            case 'growth':
                return {
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/20',
                    icon: <BookOpen className="w-5 h-5 text-amber-600" />,
                    labelColor: 'text-amber-900'
                };
            case 'stable':
                return {
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500/20',
                    icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
                    labelColor: 'text-emerald-900'
                };
            default:
                return {
                    bg: 'bg-slate-500/10',
                    border: 'border-slate-500/20',
                    icon: <ChevronRight className="w-5 h-5 text-slate-600" />,
                    labelColor: 'text-slate-700'
                };
        }
    };

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2 uppercase tracking-tight">
                Execution Plan
                <span className="text-[10px] font-bold text-slate-500 px-3 py-1 rounded-full border border-slate-300 bg-white/50">
                    AI Generated
                </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => {
                    const styles = getPriorityStyles(item.priority);
                    return (
                        <div
                            key={item.id}
                            className={`p-6 rounded-[2rem] border ${styles.border} ${styles.bg} backdrop-blur-md transition-all hover:scale-[1.01] shadow-sm`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl bg-white/80 shadow-sm`}>
                                        {styles.icon}
                                    </div>
                                    <div>
                                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${styles.labelColor}`}>
                                            {item.label}
                                        </span>
                                        <h3 className="text-black font-black text-lg">
                                            {item.skills.join(', ')}
                                        </h3>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-700 font-black uppercase tracking-wider block">Accuracy</span>
                                    <span className={`text-xl font-black ${styles.labelColor}`}>
                                        {Math.round(item.accuracy)}%
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-slate-900 font-semibold leading-relaxed mb-6">
                                {item.recommendation}
                            </p>

                            <button className="w-full py-3 rounded-2xl bg-white/60 hover:bg-white/90 border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-800 transition-all shadow-sm">
                                Retry Skill Sequence
                                <ChevronRight className="w-3 h-3 ml-1 inline" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ActionPlanPanel;
