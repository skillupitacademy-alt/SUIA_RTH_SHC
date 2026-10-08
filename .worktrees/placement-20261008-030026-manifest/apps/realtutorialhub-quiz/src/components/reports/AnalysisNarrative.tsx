'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisNarrativeProps {
    title?: string;
    bullets: string[];
    type?: 'default' | 'critical' | 'insight';
    className?: string;
}

export function AnalysisNarrative({ title, bullets, type = 'default', className }: AnalysisNarrativeProps) {
    if (!bullets || bullets.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "p-6 lg:p-8 rounded-[2rem] border transition-all duration-500",
                type === 'critical'
                    ? "bg-rose-500/5 border-rose-500/10 hover:border-rose-500/20"
                    : "bg-indigo-500/[0.03] border-indigo-500/10 hover:border-indigo-500/20",
                className
            )}
        >
            <div className="flex items-center gap-3 mb-6">
                <div className={cn(
                    "p-2 rounded-xl border",
                    type === 'critical' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                )}>
                    {type === 'critical' ? <AlertCircle size={16} /> : <Terminal size={16} />}
                </div>
                <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">
                    {title || "Analytical Interpretation"}
                </h4>
            </div>

            <ul className="space-y-4">
                {bullets.map((bullet, idx) => {
                    // Detect certain labels to emphasize
                    const isWarning = bullet.toLowerCase().includes('warning') || bullet.toLowerCase().includes('critical') || bullet.toLowerCase().includes('alert');
                    const isStability = bullet.toLowerCase().includes('stability') || bullet.toLowerCase().includes('mastery') || bullet.toLowerCase().includes('established');

                    return (
                        <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-4 group"
                        >
                            <div className={cn(
                                "mt-2 h-1.5 w-1.5 rounded-full shrink-0",
                                isWarning ? "bg-rose-500" : (isStability ? "bg-emerald-500" : "bg-indigo-500")
                            )} />
                            <p className="text-[14px] font-medium leading-relaxed text-slate-300 group-hover:text-slate-100 transition-colors">
                                {bullet}
                            </p>
                        </motion.li>
                    );
                })}
            </ul>
        </motion.div>
    );
}
