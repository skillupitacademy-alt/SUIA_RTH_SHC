'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, AlertTriangle, XCircle, ArrowRight, ShieldCheck, Zap, Ghost } from 'lucide-react';
import { Badge } from "../ui/badge";

export interface AIRecommendation {
    status: "READY" | "BORDERLINE" | "NOT_READY";
    actions: string[];
    weakest_subtopic: string;
    weakest_skill: string;
}

export interface AIRecommendationPanelProps {
    ai: AIRecommendation;
}

export const AIRecommendationPanel = React.memo(({ ai }: AIRecommendationPanelProps) => {
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'READY':
                return {
                    icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
                    badgeIcon: <Zap className="h-3 w-3 mr-1" />,
                    label: 'System Status: Ready',
                    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                    desc: 'Confidence levels met for immediate progression.'
                };
            case 'BORDERLINE':
                return {
                    icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
                    badgeIcon: <AlertTriangle className="h-3 w-3 mr-1" />,
                    label: 'System Status: Borderline',
                    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                    desc: 'Inconsistent mastery detected. Tactical review suggested.'
                };
            case 'NOT_READY':
            default:
                return {
                    icon: <Ghost className="h-6 w-6 text-rose-500" />,
                    badgeIcon: <XCircle className="h-3 w-3 mr-1" />,
                    label: 'System Status: Not Ready',
                    color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                    desc: 'Foundational gaps present. Remedial phase required.'
                };
        }
    };

    const config = getStatusConfig(ai.status);

    return (
        <div className="w-full h-full p-6 flex flex-col bg-indigo-950/20 rounded-[2.5rem] border border-indigo-500/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-1000 ${ai.status === 'READY' ? 'bg-emerald-500' : ai.status === 'BORDERLINE' ? 'bg-amber-500' : 'bg-rose-500'}`} />

            <div className="flex items-center justify-between mb-8 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 group-hover:border-indigo-500/40 transition-all shadow-inner">
                        <BrainCircuit className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Neural synthesis</h3>
                        <p className="text-sm font-bold text-white tracking-tight">Expert Recommendations</p>
                    </div>
                </div>
                <Badge className={`px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest border shadow-lg ${config.color}`}>
                    <div className="flex items-center">
                        {config.badgeIcon}
                        {ai.status}
                    </div>
                </Badge>
            </div>

            <div className="space-y-6 flex-grow z-10">
                <div className="p-5 bg-slate-900/60 rounded-[1.5rem] border border-white/5 shadow-xl backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-slate-800/40 rounded-xl border border-white/5">
                            {config.icon}
                        </div>
                        <div className="pt-1">
                            <p className="text-xs font-black text-white mb-1 uppercase tracking-wider">{config.label}</p>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{config.desc}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-900/40 rounded-3xl border border-white/5 group/node hover:border-indigo-500/20 transition-all">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 opacity-60">Weakest Hub</p>
                        <p className="text-[11px] font-bold text-white truncate group-hover/node:text-indigo-300 transition-colors uppercase tracking-tight">{ai.weakest_subtopic}</p>
                    </div>
                    <div className="p-4 bg-slate-900/40 rounded-3xl border border-white/5 group/node hover:border-violet-500/20 transition-all">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 opacity-60">Skill Gap</p>
                        <p className="text-[11px] font-bold text-white truncate group-hover/node:text-violet-300 transition-colors uppercase tracking-tight">{ai.weakest_skill}</p>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tactical Prescriptions</p>
                        <div className="h-1 w-12 bg-indigo-500/20 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        {ai.actions.map((action, idx) => (
                            <motion.div
                                key={idx}
                                className="flex items-center gap-3 p-3 bg-slate-900/40 rounded-2xl border border-white/5 group/action hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all active:scale-[0.98] cursor-pointer"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + (idx * 0.1) }}
                            >
                                <div className="h-7 w-7 flex-shrink-0 flex items-center justify-center bg-slate-800/80 rounded-xl text-[10px] font-black text-slate-500 group-hover/action:text-indigo-400 group-hover/action:bg-indigo-500/10 border border-white/5 transition-all">
                                    {idx + 1}
                                </div>
                                <span className="text-[11px] font-bold text-slate-400 leading-tight group-hover/action:text-slate-100 transition-colors">
                                    {action}
                                </span>
                                <ArrowRight className="h-3 w-3 ml-auto text-slate-700 opacity-0 group-hover/action:opacity-100 transition-all -translate-x-2 group-hover/action:translate-x-0 group-hover/action:text-indigo-400" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-indigo-500/10 z-10">
                <button className="relative group/btn w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        Launch Remedial Module
                        <Zap className="h-3 w-3 animate-pulse" />
                    </span>
                </button>
            </div>
        </div>
    );
});

AIRecommendationPanel.displayName = "AIRecommendationPanel";
