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
    Lightbulb
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ZLoader } from "@quiz/ui";
import { AnalysisNarrative } from "./AnalysisNarrative";
import { PrecisionGuidanceCard } from "./PrecisionGuidanceCard";
import { InsightVectorTab } from "./InsightVectorTab";
import { GuidanceSignalRow, HistoricalProgressRow, AggregationRow } from "@/hooks/useInsightVectorData";

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

const TutorInsightPanel = dynamic(() => import("./TutorInsightPanel").then(mod => mod.TutorInsightPanel), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-slate-900/20 animate-pulse rounded-[3rem]" />
});

export interface ExamReport {
    examId: string;
    userId?: string;
    score: number;
    mastery: number;
    readiness: number;
    percentile: number;
    totalTimeSpentSeconds: number;
    timeEfficiency: 'FAST' | 'OPTIMAL' | 'SLOW';
    timeBuckets?: { stable: number; logic: number; neural: number };
    subtopics: { name: string; accuracy: number; attempts: number }[];
    skills: { name: string; accuracy: number; attempts: number }[];
    difficulty: { level: string; accuracy: number; attempts: number }[];
    heatmap: { subtopic: string; difficulty: string; accuracy: number; attempts: number }[];
    ai: {
        status: "READY" | "BORDERLINE" | "NOT_READY";
        actions: string[];
        weakest_subtopic: string;
        weakest_skill: string;
    };
    tutorInsights?: {
        topicId: string;
        topicName: string;
        priority: "critical" | "growth" | "stable";
        label: string;
        recommendation: string;
        learningUrl?: string;
        accuracy: number;
    }[];
    confidence?: "HIGH" | "MEDIUM" | "LOW";
    isInconsistent?: boolean;
    expertDropOff?: boolean;
    timePattern?: 'slow_and_wrong' | 'fast_and_wrong' | 'slow_but_correct' | 'fast_and_correct';
    weakest_difficulty?: string;
    questions?: {
        id: string;
        text: string;
        userAnswer: string | null;
        correctAnswer?: string;
        explanation?: string;
        isCorrect: boolean;
        timeSpent: number;
        difficulty?: string;
    }[];
    interpreter?: {
        kpi: string[];
        subtopics: string[];
        skills: string[];
        heatmap: string[];
        difficulty: string[];
        time: string[];
        meta: string[];
    };
    lineage?: {
        domain?: string;
        subject?: string;
        topic?: string;
    };
    completedAt?: string;
    candidateName?: string;
}

export interface ExamReportLayoutProps {
    data: ExamReport;
    loading?: boolean;
    insightData?: {
        guidanceSignals: GuidanceSignalRow[];
        historicalProgress: HistoricalProgressRow[];
        skillData: AggregationRow[];
        loading: boolean;
        error: string | null;
        onRetry: () => void;
    };
}

type TabType = 'summary' | 'insight' | 'performance' | 'complexity' | 'audit';

const TabButton = React.memo(({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: LucideIcon, label: string }) => (
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
        <span className={cn("relative z-10 text-[14px] font-black uppercase tracking-[0.2em] transition-colors", active ? "text-white" : "text-slate-500 group-hover:text-slate-300")}>
            {label}
        </span>
    </button>
));
TabButton.displayName = 'TabButton';

const AuditQuestionCard = React.memo(({ question, index }: { question: NonNullable<ExamReport['questions']>[number], index: number }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="p-8 rounded-[2.5rem] bg-slate-900/40 border border-white/5 hover:border-indigo-500/20 transition-all group"
    >
        <div className="flex items-start justify-between gap-8">
            <div className="flex gap-8">
                <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg",
                    question.isCorrect ? "bg-indigo-600/10 text-indigo-400" : "bg-rose-500/10 text-rose-500"
                )}>
                    {(index + 1).toString().padStart(2, '0')}
                </div>
                <div className="space-y-5">
                    <h4 className="text-2xl font-bold text-slate-200 leading-snug max-w-4xl">{question.text}</h4>
                    <div className="flex flex-wrap gap-8 pt-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[13px] font-black uppercase text-slate-500 tracking-widest">User Pulse</span>
                            <div className={cn("text-[15px] font-bold", question.isCorrect ? "text-indigo-400" : "text-rose-400")}>
                                {question.userAnswer || "No Data"}
                            </div>
                        </div>
                        {!question.isCorrect && question.correctAnswer && (
                            <div className="flex flex-col gap-1.5 ml-6 border-l border-slate-800 pl-6">
                                <span className="text-[13px] font-black uppercase text-slate-500 tracking-widest">Target Sync</span>
                                <div className="text-[15px] font-bold text-indigo-400">{question.correctAnswer}</div>
                            </div>
                        )}
                    </div>
                    {question.explanation && (
                        <div className="mt-8 p-8 rounded-3xl bg-indigo-500/[0.03] border border-indigo-500/10 text-slate-300 text-[15px] leading-relaxed italic">
                            {question.explanation}
                        </div>
                    )}
                </div>
            </div>
            {question.isCorrect ? (
                <CheckCircle2 size={28} className="text-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" />
            ) : (
                <XCircle size={28} className="text-rose-500 opacity-20 group-hover:opacity-100 transition-opacity" />
            )}
        </div>
    </motion.div>
));
AuditQuestionCard.displayName = 'AuditQuestionCard';

const HeuristicPanel = ({
    title,
    details = [],
    horizontal
}: {
    title: string,
    details?: { label: string, status: string, items: string[], color: string, progress: number, icon: LucideIcon }[],
    horizontal?: boolean
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col p-8 lg:p-10 bg-[#0a0c12]/90 border border-slate-800/60 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl relative overflow-hidden group min-h-full"
        >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-inner group-hover:border-indigo-500/40 transition-all">
                            <BrainCircuit className="h-6 w-6 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Tactical Prescription</h3>
                    </div>
                    <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <span className="text-[12px] font-black text-emerald-400 uppercase tracking-widest leading-none flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            AI STATUS: OPTIMIZED
                        </span>
                    </div>
                </div>

                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 border-b border-white/5 pb-4">{title}</h4>

                <div className={cn(
                    "flex-grow overflow-visible",
                    horizontal ? "grid grid-cols-1 md:grid-cols-3 gap-6" : "space-y-6"
                )}>
                    {Array.isArray(details) && details.map((tier, idx) => (
                        <div key={idx} className="p-6 bg-slate-900/40 rounded-[2rem] border border-white/5 relative overflow-hidden group/tier hover:bg-slate-900/60 transition-all duration-300">
                            <div className="flex items-center justify-between mb-5 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-2.5 rounded-xl border border-white/5 shadow-inner", tier.color.replace('bg-', 'text-').split(' ')[0])}>
                                        <tier.icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="text-[13px] font-black text-white uppercase tracking-widest">{tier.label}</span>
                                        <span className={cn("text-[11px] font-bold ml-2", tier.color.replace('bg-', 'text-').split(' ')[0])}>({tier.status})</span>
                                    </div>
                                </div>
                                <div className="h-1.5 w-24 bg-slate-800/50 rounded-full overflow-hidden p-[1px] border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${tier.progress}%` }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className={cn("h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]", tier.color.split(' ')[0])}
                                    />
                                </div>
                            </div>

                            <ul className="space-y-3 relative z-10">
                                {tier.items.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 group/item">
                                        <div className={cn("h-1.5 w-1.5 rounded-full mt-2 shrink-0 shadow-sm", tier.color.split(' ')[0])} />
                                        <span className="text-[13px] text-slate-300 font-medium leading-relaxed group-hover/item:text-slate-100 transition-colors">
                                            {item}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-10 pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                        <div className="flex items-center gap-2">
                            <span>DIAGNOSTIC LOGS V9.4</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-700">SYS_5DNJLE</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export function ExamReportLayout({ data, loading, insightData }: ExamReportLayoutProps) {
    const [activeTab, setActiveTab] = React.useState<TabType>('summary');

    // Pre-calculate Audit Stats for the 5 Data Pods
    const totalQuestions = data.questions?.length || 0;
    const auditHits = data.questions?.filter(q => q.isCorrect).length || 0;
    const auditMisses = totalQuestions - auditHits;
    const auditAccuracy = totalQuestions > 0 ? Math.round((auditHits / totalQuestions) * 100) : 0;
    const auditAvgLatency = totalQuestions > 0 ? Math.round(data.totalTimeSpentSeconds / totalQuestions) : 0;


    if (loading || !data) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
                <ZLoader />
                <motion.p
                    className="mt-8 text-[14px] font-black text-slate-400 tracking-[0.4em] uppercase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    {loading ? "Synthesizing Personal Neural Matrix..." : "Loading matrix data..."}
                </motion.p>
            </div>
        );
    }

    // Defensive guards for arrays to prevent t.map is not a function (Task 125)
    const subtopics = Array.isArray(data.subtopics) ? data.subtopics : [];
    const skills = Array.isArray(data.skills) ? data.skills : [];
    const difficulty = Array.isArray(data.difficulty) ? data.difficulty : [];
    const heatmap = Array.isArray(data.heatmap) ? data.heatmap : [];
    const questions = Array.isArray(data.questions) ? data.questions : [];

    const guidanceSignals = insightData?.guidanceSignals ?? [];
    const insightLoading = insightData?.loading ?? false;
    const insightError = insightData?.error ?? null;
    const insightRetry = insightData?.onRetry ?? (() => {});

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8 lg:p-12 mb-20 scrollbar-hide">
            <div className="max-w-[1600px] mx-auto">
                <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
                    <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} icon={LayoutDashboard} label="Executive Core" />
                    <TabButton active={activeTab === 'insight'} onClick={() => setActiveTab('insight')} icon={Lightbulb} label="Insight Vector" />
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
                        className="space-y-16"
                    >
                        {/* EXECUTIVE CORE TAB */}
                        {activeTab === 'summary' && (
                            <div className="space-y-16 pt-6 animate-in fade-in duration-700">
                                <div className="flex flex-col gap-10">
                                    <div className="w-full min-h-[580px] lg:h-[580px] relative">
                                        <RadialKPI data={data} />
                                    </div>
                                    <div className="flex flex-col">
                                        <AIRecommendationPanel
                                            ai={{
                                                ...data.ai,
                                                confidence: data.confidence,
                                                isInconsistent: data.isInconsistent,
                                                timePattern: data.timePattern
                                            }}
                                            layout="horizontal"
                                        />
                                    </div>
                                </div>

                                {data.tutorInsights && data.tutorInsights.length > 0 && (
                                    <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                                        <TutorInsightPanel insights={data.tutorInsights} />
                                    </div>
                                )}

                                {data.interpreter?.meta && data.interpreter.meta.length > 0 && (
                                    <div className="animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-500">
                                        <AnalysisNarrative
                                            title="Executive Synopsis"
                                            bullets={data.interpreter.meta}
                                            type="insight"
                                        />
                                    </div>
                                )}

                                <section className="space-y-8 pt-8 border-t border-white/5">
                                    <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 border-b border-white/5 pb-4">
                                        Precision Guidance
                                    </h4>

                                    {insightLoading ? (
                                        <div className="space-y-6">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="h-40 bg-slate-900/40 rounded-[2rem] border border-white/5 animate-pulse" />
                                            ))}
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                                Loading precision vectors...
                                            </div>
                                        </div>
                                    ) : insightError ? (
                                        <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                                            <AlertTriangle className="text-rose-500 mb-4 h-8 w-8" />
                                            <h5 className="text-[12px] font-black text-rose-400 uppercase tracking-widest">Vector Sync Failed</h5>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">
                                                Unable to load guidance signals. Refresh the page to retry.
                                            </p>
                                            <button 
                                                onClick={insightRetry}
                                                className="mt-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
                                            >
                                                Retry Synthesis
                                            </button>
                                        </div>
                                    ) : guidanceSignals.length > 0 ? (
                                        <div className="space-y-6">
                                            {guidanceSignals
                                                .slice()
                                                .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
                                                .slice(0, 5)
                                                .map((signal, idx) => (
                                                    <PrecisionGuidanceCard key={`${signal.signalType}-${idx}`} signal={signal} />
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="p-12 bg-slate-900/40 rounded-[2.5rem] border border-white/5 border-dashed border-2 flex flex-col items-center justify-center text-center">
                                            <span className="text-xl font-black text-slate-600 uppercase tracking-tighter">Awaiting Data Vector</span>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">
                                                Complete additional assessment sessions to generate precision guidance signals. Minimum 3 questions required per subtopic.
                                            </p>
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}

                        {activeTab === 'insight' && (
                            <motion.div
                                key="insight"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                            >
                                <InsightVectorTab 
                                    guidanceSignals={insightData?.guidanceSignals ?? []}
                                    historicalProgress={insightData?.historicalProgress ?? []}
                                    skillData={insightData?.skillData ?? []}
                                    report={data}
                                    loading={insightData?.loading ?? false}
                                    error={insightData?.error ?? null}
                                    onRetry={insightData?.onRetry ?? (() => {})}
                                />
                            </motion.div>
                        )}

                        {/* NEURAL MATRIX TAB */}
                        {activeTab === 'performance' && (
                            <div className="space-y-16 pt-6">
                                {/* Section 1: Subtopic Variance */}
                                <div className="flex flex-col gap-10">
                                    <div className="w-full min-h-[580px] lg:h-[580px] relative">
                                        <SubtopicBarChart
                                            data={subtopics}
                                            weakest={data.ai.weakest_subtopic}
                                            rootCauseText={data.ai.weakest_subtopic && data.ai.weakest_skill
                                                ? `Root Cause: ${data.ai.weakest_skill} in ${data.ai.weakest_subtopic} (${data.weakest_difficulty || 'Expert'})`
                                                : data.ai.weakest_subtopic
                                                    ? `Weakest Area: ${data.ai.weakest_subtopic}`
                                                    : undefined}
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <HeuristicPanel
                                            title="Domain Disparity"
                                            details={[
                                                { label: "Focus Areas", status: "Critical", items: [`Review ${data.ai.weakest_subtopic || 'foundational'} logic`, "Practice dynamic integration"], color: "bg-rose-500 text-rose-400", progress: 35, icon: AlertTriangle },
                                                { label: "Strengthen", status: "Proficient", items: ["Deepen ML model context", "Improve physics section timing"], color: "bg-amber-500 text-amber-400", progress: 65, icon: Zap },
                                                { label: "Maintain", status: "Mastered", items: ["Stable neural baseline stability", "Continue daily vector drills"], color: "bg-emerald-500 text-emerald-400", progress: 95, icon: CheckCircle2 }
                                            ]}
                                            horizontal
                                        />
                                    </div>
                                </div>

                                {data.interpreter?.subtopics && data.interpreter.subtopics.length > 0 && (
                                    <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                                        <AnalysisNarrative
                                            title="Vector Logic Interpretation"
                                            bullets={data.interpreter.subtopics}
                                        />
                                    </div>
                                )}

                                {/* Section 2: Skill & Time Matrix */}
                                <div className="flex flex-col gap-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch min-h-[580px] lg:h-[580px]">
                                        <div className="flex flex-col">
                                            <SkillDonutChart data={skills} />
                                        </div>
                                        <div className="flex flex-col">
                                            <TimeSpentDonut data={{
                                                totalSeconds: data.totalTimeSpentSeconds,
                                                questions: questions,
                                                timeBuckets: data.timeBuckets
                                            }} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <HeuristicPanel
                                            title="Spatio-Temporal Correlation"
                                            details={[
                                                { label: "Focus Areas", status: "Critical", items: [`Reduce friction in ${data.ai.weakest_skill || 'reasoning'}`, "Minimize 'Review' cycle time"], color: "bg-rose-500 text-rose-400", progress: 42, icon: AlertTriangle },
                                                { label: "Strengthen", status: "Proficient", items: ["Stabilize high-friction nodes", "Optimize logic-branch speed"], color: "bg-amber-500 text-amber-400", progress: 58, icon: Zap },
                                                { label: "Maintain", status: "Mastered", items: ["Stable Study zone processing", "Flow-state neural baseline"], color: "bg-emerald-500 text-emerald-400", progress: 95, icon: CheckCircle2 }
                                            ]}
                                            horizontal
                                        />
                                    </div>
                                </div>

                                {((data.interpreter?.skills && data.interpreter.skills.length > 0) || (data.interpreter?.time && data.interpreter.time.length > 0)) && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                        {data.interpreter?.skills && data.interpreter.skills.length > 0 && (
                                            <AnalysisNarrative
                                                title="Cognitive Node Interpretation"
                                                bullets={data.interpreter.skills}
                                            />
                                        )}
                                        {data.interpreter?.time && data.interpreter.time.length > 0 && (
                                            <AnalysisNarrative
                                                title="Temporal Spend Analysis"
                                                bullets={data.interpreter.time}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Section 3: Heatmap Projection */}
                                <div className="flex flex-col gap-10">
                                    <div className="w-full min-h-[580px] lg:h-[580px] relative">
                                        <HeatmapGrid data={heatmap} />
                                    </div>
                                    <div className="flex flex-col">
                                        <HeuristicPanel
                                            title="Cognitive Load Analysis"
                                            details={[
                                                { label: "Focus Areas", status: "Critical", items: ["Eliminate 'Red Out' at Expert Level", "Tackle high-entropy vectors"], color: "bg-rose-500 text-rose-400", progress: 25, icon: AlertTriangle },
                                                { label: "Strengthen", status: "Proficient", items: ["Bridge Intermediate to Expert gap", "Stabilize operational thresholds"], color: "bg-amber-500 text-amber-400", progress: 62, icon: Zap },
                                                { label: "Maintain", status: "Mastered", items: ["Perfect Score on Simple difficulty", "Stable Intermediate performance"], color: "bg-emerald-500 text-emerald-400", progress: 98, icon: CheckCircle2 }
                                            ]}
                                            horizontal
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* COMPLEXITY LADDER TAB */}
                        {activeTab === 'complexity' && (
                            <div className="space-y-16 pt-6 animate-in fade-in duration-700">
                                <div className="flex flex-col gap-10">
                                    <div className="w-full min-h-[580px] lg:h-[580px] relative">
                                        <DifficultyBarChart
                                            data={difficulty}
                                            expertDropOff={data.expertDropOff}
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <HeuristicPanel
                                            title="Pressure Tolerance"
                                            details={[
                                                { label: "Focus Areas", status: "Critical", items: ["Target 'Expert' implementation rigidity", "Address complexity drop-off"], color: "bg-rose-500 text-rose-400", progress: 30, icon: AlertTriangle },
                                                { label: "Strengthen", status: "Proficient", items: ["Shift from linear to non-linear logic", "Practice multi-variable problems"], color: "bg-amber-500 text-amber-400", progress: 55, icon: Zap },
                                                { label: "Maintain", status: "Mastered", items: ["Perfect Score on Simple difficulty", "Stable Intermediate performance"], color: "bg-emerald-500 text-emerald-400", progress: 100, icon: CheckCircle2 }
                                            ]}
                                            horizontal
                                        />
                                    </div>
                                </div>

                                {((data.interpreter?.difficulty && data.interpreter.difficulty.length > 0) || (data.interpreter?.heatmap && data.interpreter.heatmap.length > 0)) && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                        {data.interpreter?.heatmap && data.interpreter.heatmap.length > 0 && (
                                            <AnalysisNarrative
                                                title="Spatio-Visual Depth Matrix"
                                                bullets={data.interpreter.heatmap}
                                            />
                                        )}
                                        {data.interpreter?.difficulty && data.interpreter.difficulty.length > 0 && (
                                            <AnalysisNarrative
                                                title="Load Vector Stability"
                                                bullets={data.interpreter.difficulty}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* RAW AUDIT TAB */}
                        {activeTab === 'audit' && (
                            <div className="w-full space-y-6 pt-4">
                                <div className="p-8 lg:p-12 bg-slate-950 rounded-[3rem] border border-white/5 mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-10 shadow-2xl">
                                    <div>
                                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Raw Audit</h2>
                                        <p className="text-slate-400 font-bold uppercase text-[14px] tracking-[0.3em] mt-2">Vector Diagnostic Log</p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-8 gap-x-4 lg:gap-x-0 lg:divide-x lg:divide-slate-800">
                                        <div className="flex flex-col items-center px-6 lg:px-10">
                                            <span className="text-4xl font-black text-slate-300">{totalQuestions}</span>
                                            <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest mt-1 whitespace-nowrap">Total Depth</span>
                                        </div>
                                        <div className="flex flex-col items-center px-6 lg:px-10">
                                            <span className="text-4xl font-black text-indigo-400">{auditAccuracy}%</span>
                                            <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest mt-1 whitespace-nowrap">Accuracy Sync</span>
                                        </div>
                                        <div className="flex flex-col items-center px-6 lg:px-10">
                                            <span className="text-4xl font-black text-emerald-500">{auditHits}</span>
                                            <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest mt-1 whitespace-nowrap">Hits</span>
                                        </div>
                                        <div className="flex flex-col items-center px-6 lg:px-10">
                                            <span className="text-4xl font-black text-rose-500">{auditMisses}</span>
                                            <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest mt-1 whitespace-nowrap">Misses</span>
                                        </div>
                                        <div className="flex flex-col items-center px-6 lg:px-10 border-t md:border-t-0 pt-4 md:pt-0 col-span-2 md:col-span-1 border-slate-800/10 lg:border-t-0">
                                            <span className="text-4xl font-black text-amber-500">{auditAvgLatency}s</span>
                                            <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest mt-1 whitespace-nowrap">Avg Latency</span>
                                        </div>
                                    </div>
                                </div>

                                {questions.map((q, idx) => (
                                    <AuditQuestionCard key={q.id || idx} question={q} index={idx} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div >
    );
}

function severityRank(severity: GuidanceSignalRow["severity"]) {
    if (severity === "HIGH") return 0;
    if (severity === "MEDIUM") return 1;
    return 2;
}
