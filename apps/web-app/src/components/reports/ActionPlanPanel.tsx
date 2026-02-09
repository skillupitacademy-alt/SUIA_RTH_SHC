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
                    icon: <AlertCircle className="w-5 h-5 text-red-400" />,
                    labelColor: 'text-red-400'
                };
            case 'growth':
                return {
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/20',
                    icon: <BookOpen className="w-5 h-5 text-amber-400" />,
                    labelColor: 'text-amber-400'
                };
            case 'stable':
                return {
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500/20',
                    icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
                    labelColor: 'text-emerald-400'
                };
            default:
                return {
                    bg: 'bg-slate-500/10',
                    border: 'border-slate-500/20',
                    icon: <ChevronRight className="w-5 h-5 text-slate-400" />,
                    labelColor: 'text-slate-400'
                };
        }
    };

    return (
        <div className="mt-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                Execution Plan
                <span className="text-xs font-normal text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                    AI Generated
                </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => {
                    const styles = getPriorityStyles(item.priority);
                    return (
                        <div
                            key={item.id}
                            className={`p-5 rounded-2xl border ${styles.border} ${styles.bg} backdrop-blur-sm transition-all hover:scale-[1.01]`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-black/40`}>
                                        {styles.icon}
                                    </div>
                                    <div>
                                        <span className={`text-xs font-bold uppercase tracking-wider ${styles.labelColor}`}>
                                            {item.label}
                                        </span>
                                        <h3 className="text-white font-semibold">
                                            {item.skills.join(', ')}
                                        </h3>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-400 block">Accuracy</span>
                                    <span className={`font-mono font-bold ${styles.labelColor}`}>
                                        {Math.round(item.accuracy)}%
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-slate-300 leading-relaxed mb-4">
                                {item.recommendation}
                            </p>

                            <button className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2">
                                Retry Skill Sequence
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ActionPlanPanel;
