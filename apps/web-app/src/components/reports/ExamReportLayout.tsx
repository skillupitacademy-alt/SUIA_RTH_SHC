'use client';

import React from 'react';
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import {
    LayoutDashboard,
    BrainCircuit,
    BarChart3,
    ListChecks,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Zap,
    Activity
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ZLoader } from "@quiz/ui";

// Multi-ring radial KPI
const RadialKPI = dynamic(() => import("./RadialKPI").then(mod => mod.RadialKPI), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-slate-900/20 animate-pulse rounded-[2.5rem]" />
});

// Subtopic accuracy horizontal bar
const SubtopicBarChart = dynamic(() => import("./SubtopicBarChart").then(mod => mod.SubtopicBarChart), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-slate-900/20 animate-pulse rounded-3xl" />
});

// Skill distribution doughnut (Subject Breakdown in image)
const SkillDonutChart = dynamic(() => import("./SkillDonutChart").then(mod => mod.SkillDonutChart), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-slate-900/20 animate-pulse rounded-3xl" />
});

// Time spent distribution doughnut
const TimeSpentDonut = dynamic(() => import("./TimeSpentDonut").then(mod => mod.TimeSpentDonut), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-slate-900/20 animate-pulse rounded-3xl" />
});

// Subtopic x Difficulty heatmap
const HeatmapGrid = dynamic(() => import("./HeatmapGrid").then(mod => mod.HeatmapGrid), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-slate-900/20 animate-pulse rounded-3xl" />
});

// Difficulty ladder vertical bar
const DifficultyBarChart = dynamic(() => import("./DifficultyBarChart").then(mod => mod.DifficultyBarChart), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-slate-900/20 animate-pulse rounded-3xl" />
});

// AI recommendation side panel
const AIRecommendationPanel = dynamic(() => import("./AIRecommendationPanel").then(mod => mod.AIRecommendationPanel), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-indigo-950/20 animate-pulse rounded-[2.5rem]" />
});

export interface ExamReport {
    score: number;
    mastery: number;
    readiness: number;
    percentile: number;
    totalTimeSpentSeconds: number;
    timeEfficiency: 'FAST' | 'OPTIMAL' | 'SLOW';
    subtopics: { name: string; accuracy: number }[];
    skills: { name: string; accuracy: number }[];
    difficulty: { level: string; accuracy: number }[];
    heatmap: { subtopic: string; difficulty: string; accuracy: number }[];
    ai: {
        status: "READY" | "BORDERLINE" | "NOT_READY";
        actions: string[];
        weakest_subtopic: string;
        weakest_skill: string;
    };
    questions?: {
        id: string;
        text: string;
        userAnswer: string | null;
        correctAnswer?: string;
        explanation?: string;
        isCorrect: boolean;
        timeSpent: number;
    }[];
}

export interface ExamReportLayoutProps {
    data: ExamReport;
    loading?: boolean;
}

type TabType = 'summary' | 'performance' | 'complexity' | 'audit';

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: LucideIcon, label: string }) => (
    <button
        onClick={onClick}
        className={cn(
            "relative flex items-center gap-3 px-8 py-4 rounded-2xl transition-all duration-500 group overflow-hidden",
            active ? "bg-indigo-600 shadow-lg shadow-indigo-600/20" : "bg-slate-950/50 hover:bg-slate-900"
        )}
    >
        {active && (
            <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
        )}
        <Icon size={18} className={cn("relative z-10 transition-colors", active ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
        <span className={cn("relative z-10 text-[11px] font-black uppercase tracking-[0.2em] transition-colors", active ? "text-white" : "text-slate-500 group-hover:text-slate-300")}>
            {label}
        </span>
    </button>
);

const HeuristicPanel = ({
    title,
    details = []
}: {
    title: string,
    details?: { label: string, status: string, items: string[], color: string, progress: number, icon: LucideIcon }[]
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full flex flex-col p-8 lg:p-10 bg-[#0a0c12]/90 border border-slate-800/60 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl relative overflow-hidden group"
        >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                {/* Header matching image exactly */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-inner group-hover:border-indigo-500/40 transition-all">
                            <BrainCircuit className="h-6 w-6 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">{title}</h3>
                    </div>
                    <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-lg">
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            AI STATUS: OPTIMIZED
                        </span>
                    </div>
                </div>

                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 border-b border-white/5 pb-4">Tactical Prescription</h4>

                <div className="space-y-5 flex-grow overflow-y-auto scrollbar-hide pr-1">
                    {details.map((tier, idx) => (
                        <div key={idx} className="p-5 bg-slate-900/40 rounded-[2rem] border border-white/5 relative overflow-hidden group/tier hover:bg-slate-900/60 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-xl border border-white/5", tier.color.replace('bg-', 'text-').split(' ')[0])}>
                                        <tier.icon className="h-3.5 w-3.5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{tier.label}</span>
                                        <span className={cn("text-[9px] font-bold ml-2", tier.color.replace('bg-', 'text-').split(' ')[0])}>({tier.status})</span>
                                    </div>
                                </div>
                                <div className="h-1.5 w-20 bg-slate-800/50 rounded-full overflow-hidden p-[1px] border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${tier.progress}%` }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className={cn("h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]", tier.color.split(' ')[0])}
                                    />
                                </div>
                            </div>

                            <ul className="space-y-2 relative z-10">
                                {tier.items.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 group/item">
                                        <div className={cn("h-1 w-1 rounded-full mt-1.5 shrink-0", tier.color.split(' ')[0])} />
                                        <span className="text-[10px] text-slate-400 font-medium leading-relaxed group-hover/item:text-slate-200 transition-colors">
                                            {item}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 opacity-40">
                    <div className="flex items-center justify-between text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">
                        <div className="flex items-center gap-2">
                            <Activity size={10} className="text-indigo-400" />
                            <span>Diagnostic Logs v9.4</span>
                        </div>
                        <span className="italic">SYS_{Math.random().toString(36).substring(7).toUpperCase()}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export function ExamReportLayout({ data, loading }: ExamReportLayoutProps) {
    const [activeTab, setActiveTab] = React.useState<TabType>('summary');

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
                <ZLoader />
                <motion.p
                    className="mt-8 text-[11px] font-black text-slate-500 tracking-[0.4em] uppercase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    Synthesizing Personal Neural Matrix...
                </motion.p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8 lg:p-12 mb-20 scrollbar-hide">
            <div className="max-w-[1600px] mx-auto">
                <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
                    <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} icon={LayoutDashboard} label="Executive Core" />
                    <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} icon={BrainCircuit} label="Neural Matrix" />
                    <TabButton active={activeTab === 'complexity'} onClick={() => setActiveTab('complexity')} icon={BarChart3} label="Complexity Ladder" />
                    <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={ListChecks} label="Question Audit" />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.02, y: -10 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="space-y-12"
                    >
                        {/* EXECUTIVE CORE TAB */}
                        {activeTab === 'summary' && (
                            <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8 items-stretch pt-4">
                                <div className="h-[650px] rounded-[2.5rem] bg-slate-900/50 border border-white/5 overflow-hidden shadow-2xl relative group">
                                    <RadialKPI data={data} />
                                </div>
                                <div className="h-full min-h-[650px]">
                                    <AIRecommendationPanel ai={data.ai} />
                                </div>
                            </div>
                        )}

                        {/* NEURAL MATRIX TAB */}
                        {activeTab === 'performance' && (
                            <div className="space-y-12 pt-4">
                                {/* Section 1: Subtopic Variance */}
                                <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8">
                                    <div className="min-h-[450px] rounded-[2.5rem] bg-slate-900/50 border border-white/5 p-8 lg:p-12 flex items-center">
                                        <SubtopicBarChart data={data.subtopics} weakest={data.ai.weakest_subtopic} />
                                    </div>
                                    <HeuristicPanel
                                        title="Tactical Prescription"
                                        details={[
                                            {
                                                label: "Focus Areas",
                                                status: "Critical",
                                                items: [`Review ${data.ai.weakest_subtopic} logic`, "Practice dynamic integration"],
                                                color: "bg-rose-500 text-rose-400",
                                                progress: 35,
                                                icon: AlertTriangle
                                            },
                                            {
                                                label: "Strengthen",
                                                status: "Proficient",
                                                items: ["Deepen ML model context", "Improve physics section timing"],
                                                color: "bg-amber-500 text-amber-400",
                                                progress: 65,
                                                icon: Zap
                                            },
                                            {
                                                label: "Maintain",
                                                status: "Mastered",
                                                items: ["Stable neural baseline stability", "Continue daily vector drills"],
                                                color: "bg-emerald-500 text-emerald-400",
                                                progress: 95,
                                                icon: CheckCircle2
                                            }
                                        ]}
                                    />
                                </div>

                                {/* Section 2: Skill & Time Matrix */}
                                <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="h-[550px]">
                                            <SkillDonutChart data={data.skills} />
                                        </div>
                                        <div className="h-[550px]">
                                            <TimeSpentDonut data={{
                                                totalSeconds: data.totalTimeSpentSeconds,
                                                questions: data.questions || []
                                            }} />
                                        </div>
                                    </div>
                                    <HeuristicPanel
                                        title="Tactical Prescription"
                                        details={[
                                            {
                                                label: "Focus Areas",
                                                status: "Critical",
                                                items: [`Reduce friction in ${data.ai.weakest_skill}`, "Minimize 'Review' cycle time"],
                                                color: "bg-rose-500 text-rose-400",
                                                progress: 42,
                                                icon: AlertTriangle
                                            },
                                            {
                                                label: "Strengthen",
                                                status: "Proficient",
                                                items: ["Stabilize high-friction nodes", "Optimize logic-branch speed"],
                                                color: "bg-amber-500 text-amber-400",
                                                progress: 58,
                                                icon: Zap
                                            },
                                            {
                                                label: "Maintain",
                                                status: "Mastered",
                                                items: ["Stable Study zone processing", "Flow-state neural baseline"],
                                                color: "bg-emerald-500 text-emerald-400",
                                                progress: 95,
                                                icon: CheckCircle2
                                            }
                                        ]}
                                    />
                                </div>

                                {/* Section 3: Heatmap Projection */}
                                <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8">
                                    <div className="min-h-[500px] rounded-[2.5rem] bg-slate-900/50 border border-white/5 p-8 lg:p-12">
                                        <HeatmapGrid data={data.heatmap} />
                                    </div>
                                    <HeuristicPanel
                                        title="Tactical Prescription"
                                        details={[
                                            {
                                                label: "Focus Areas",
                                                status: "Critical",
                                                items: ["Eliminate 'Red Out' at Expert Level", "Tackle high-entropy vectors"],
                                                color: "bg-rose-500 text-rose-400",
                                                progress: 25,
                                                icon: AlertTriangle
                                            },
                                            {
                                                label: "Strengthen",
                                                status: "Proficient",
                                                items: ["Bridge Intermediate to Expert gap", "Stabilize operational thresholds"],
                                                color: "bg-amber-500 text-amber-400",
                                                progress: 62,
                                                icon: Zap
                                            },
                                            {
                                                label: "Maintain",
                                                status: "Mastered",
                                                items: ["Perfect Score on Simple difficulty", "Stable Intermediate performance"],
                                                color: "bg-emerald-500 text-emerald-400",
                                                progress: 98,
                                                icon: CheckCircle2
                                            }
                                        ]}
                                    />
                                </div>
                            </div>
                        )}

                        {/* COMPLEXITY LADDER TAB */}
                        {activeTab === 'complexity' && (
                            <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8 items-stretch pt-4">
                                <div className="min-h-[500px] rounded-[2.5rem] bg-slate-900/50 border border-white/5 p-8 lg:p-12 flex items-center">
                                    <DifficultyBarChart data={data.difficulty} />
                                </div>
                                <HeuristicPanel
                                    title="Tactical Prescription"
                                    details={[
                                        {
                                            label: "Focus Areas",
                                            status: "Critical",
                                            items: ["Target 'Expert' implementation rigidity", "Address 45% complexity drop-off"],
                                            color: "bg-rose-500 text-rose-400",
                                            progress: 30,
                                            icon: AlertTriangle
                                        },
                                        {
                                            label: "Strengthen",
                                            status: "Proficient",
                                            items: ["Shift from linear to non-linear logic", "Practice multi-variable problems"],
                                            color: "bg-amber-500 text-amber-400",
                                            progress: 55,
                                            icon: Zap
                                        },
                                        {
                                            label: "Maintain",
                                            status: "Mastered",
                                            items: ["Perfect Score on Simple difficulty", "Stable Intermediate performance"],
                                            color: "bg-emerald-500 text-emerald-400",
                                            progress: 100,
                                            icon: CheckCircle2
                                        }
                                    ]}
                                />
                            </div>
                        )}

                        {/* RAW AUDIT TAB */}
                        {activeTab === 'audit' && (
                            <div className="max-w-4xl mx-auto space-y-6 pt-4">
                                <div className="p-8 lg:p-12 bg-slate-950 rounded-[3rem] border border-white/5 mb-12 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Raw Audit</h2>
                                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Vector Diagnostic Log</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center px-6 border-r border-slate-800">
                                            <span className="text-2xl font-black text-indigo-400">{data.questions?.filter(q => q.isCorrect).length}</span>
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Hits</span>
                                        </div>
                                        <div className="flex flex-col items-center px-6">
                                            <span className="text-2xl font-black text-rose-500">{data.questions?.filter(q => !q.isCorrect).length}</span>
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Misses</span>
                                        </div>
                                    </div>
                                </div>

                                {data.questions?.map((q, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="p-8 rounded-[2.5rem] bg-slate-900/40 border border-white/5 hover:border-indigo-500/20 transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-6">
                                            <div className="flex gap-6">
                                                <div className={cn(
                                                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm",
                                                    q.isCorrect ? "bg-indigo-600/10 text-indigo-400" : "bg-rose-500/10 text-rose-500"
                                                )}>
                                                    {(idx + 1).toString().padStart(2, '0')}
                                                </div>
                                                <div className="space-y-4">
                                                    <h4 className="text-lg font-bold text-slate-200 leading-relaxed max-w-2xl">{q.text}</h4>
                                                    <div className="flex flex-wrap gap-4 pt-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Your Pulse</span>
                                                            <div className={cn("text-xs font-bold", q.isCorrect ? "text-indigo-400" : "text-rose-500")}>
                                                                {q.userAnswer || "No Data"}
                                                            </div>
                                                        </div>
                                                        {!q.isCorrect && q.correctAnswer && (
                                                            <div className="flex flex-col gap-1 ml-4 border-l border-slate-800 pl-4">
                                                                <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Target Sync</span>
                                                                <div className="text-xs font-bold text-indigo-400">{q.correctAnswer}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {q.explanation && (
                                                        <div className="mt-6 p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-slate-400 text-xs leading-relaxed italic">
                                                            {q.explanation}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {q.isCorrect ? (
                                                <CheckCircle2 size={24} className="text-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <XCircle size={24} className="text-rose-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
