"use client";

import dynamic from "next/dynamic";
import React from "react";
import { cn } from "@/lib/utils";
import { REPORT_LAYOUT } from "@/lib/reportLayoutTokens";
import { FixedChartWrapper, PdfGridTwoColumn } from "./PrintToolkit";
import { ReportCard, ChartCard } from "../shared/ReportCard";
import {
    TacticalPrescriptionPrintPanel,
    InterpretationCard,
    HeatmapMatrixPrint
} from "./PrintComponents";

// Import shared types
import type { QuestionItem } from "@quiz/types";
import { SkillDonutChartPrint, TimeSpentDonutPrint } from "./PrintDonuts";
import { usePdfMarkReady } from "./usePdfMarkReady";

const RadialKPI = dynamic(() => import("../RadialKPI").then(mod => mod.RadialKPI), { ssr: false });
const SubtopicBarChart = dynamic(() => import("../SubtopicBarChart").then(mod => mod.SubtopicBarChart), { ssr: false });

/* ─── Tokens ─── */
const T = REPORT_LAYOUT;

/**
 * TopicUnitData is the payload for a single 5-page Atomic Unit.
 * It is derived from a TopicDataset but structured for the UI components.
 */
export interface TopicUnitData {
    id?: string;
    examId?: string;
    name?: string;
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
        status: "READY" | "BORDERLINE" | "NOT_READY" | "DATA_INSUFFICIENT";
        actions: string[];
        weakest_subtopic: string;
        weakest_skill?: string;
    };
    lineage?: {
        domain?: string;
        subject?: string;
        topic?: string;
    };
    questions?: import("@quiz/types").QuestionItem[];
    completedAt?: string;
    candidateName?: string;
    timePattern?: string;
    isInconsistent?: boolean;
}

export interface SubjectUnitData {
    id: string;
    name: string;
    topicAccuracies: {
        topicId: string;
        topicName: string;
        accuracy: number;
    }[];
    strengths: string[];
    weaknesses: string[];
    lineage: {
        domain: string;
    };
    completedAt?: string;
    candidateName?: string;
}

export interface DomainUnitData {
    id: string;
    name: string;
    subjectAccuracies: {
        subjectId: string;
        subjectName: string;
        accuracy: number;
    }[];
    overallAccuracy: number;
    completedAt?: string;
    candidateName?: string;
}

type TopicLayout = "pillar" | "bar" | "grid" | "heatmap";

interface PageProps {
    data: TopicUnitData;
    page: number;
    total: number;
    layout?: TopicLayout;
}

/* ────────────────────────────────────────────── */
/*  PAGE 01 : Executive Summary                  */
/* ────────────────────────────────────────────── */
export function ExecutiveSummaryPage({ data, page, total }: PageProps) {
    return (
        <div className="h-full w-full flex flex-col">
            <header className="pdf-header flex justify-between items-start border-b border-slate-800 pb-4 mb-3">
                <div>
                    {data.lineage && (
                        <div className="flex items-center gap-2 mb-2 opacity-60">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{data.lineage.domain || "Diagnostic"}</span>
                            {data.lineage.subject && (
                                <>
                                    <div className="h-1 w-1 rounded-full bg-slate-700 mx-1" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{data.lineage.subject}</span>
                                </>
                            )}
                        </div>
                    )}
                    <h1 className="report-heading">{data.lineage?.topic || data.name}</h1>
                    <p className="report-subheading mt-1">Executive Analysis : {data.candidateName || "Intelligence Assets"}</p>
                </div>
                <div className="text-right">
                    <p className={T.typography.label} style={{ color: 'rgb(129,140,248)' }}>
                        {data.completedAt ? new Date(data.completedAt).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="report-subheading mt-0.5">Ref: {(data.id || data.examId || "REPORT").slice(0, 12)}</p>
                </div>
            </header>

            <div className="flex-1 flex flex-col justify-between" style={{ gap: T.grid.gap }}>
                <div className="flex flex-col gap-6">
                    <div className="mx-auto w-full max-w-[850px] relative h-[520px]">
                        <RadialKPI data={data} suppressAnimation={true} />
                    </div>
                    <TacticalPrescriptionPrintPanel data={data} layout="horizontal" />
                </div>

                <InterpretationCard
                    title="Readiness Index Synopsis"
                    bullets={data.ai?.actions.slice(0, 2) || ["Maintain current performance baseline", "Expand into Expert-level edge cases"]}
                />
            </div>

            <PdfFooter page={page.toString().padStart(2, '0')} total={total.toString().padStart(2, '0')} label="Proprietary Diagnostic Asset" />
        </div>
    );
}

/* ────────────────────────────────────────────── */
/*  PAGE 02 : Subtopic Accuracy                  */
/* ────────────────────────────────────────────── */
export function SubtopicAccuracyPage({ data, page, total, layout }: PageProps) {
    const isDense = layout === "heatmap" || data.subtopics.length > 10;
    return (
        <div className="h-full w-full flex flex-col justify-between">
            <SectionHeader title="Subtopic Precision Matrix" label="Diagnostic Sweep V4" data={data} />

            <div className="flex-1 flex flex-col justify-between" style={{ gap: T.grid.sectionGap }}>
                <div className="flex-1 flex flex-col gap-6">
                    <ChartCard>
                        <FixedChartWrapper height={isDense ? 480 : 440}>
                            <SubtopicBarChart
                                data={data.subtopics}
                                weakest={data.ai.weakest_subtopic}
                                dense={isDense}
                            />
                        </FixedChartWrapper>
                    </ChartCard>
                    <TacticalPrescriptionPrintPanel
                        data={data}
                        title="Domain Disparity"
                        dense={true}
                        layout="horizontal"
                        tierOverrides={[
                            { label: "Focus Areas", status: "Critical", items: [`Review ${data.ai.weakest_subtopic || 'foundational'} logic`, "Practice dynamic integration"], color: "bg-rose-500 text-rose-400", progress: 35 },
                            { label: "Strengthen", status: "Proficient", items: ["Deepen ML model context", "Improve physics section timing"], color: "bg-amber-500 text-amber-400", progress: 65 },
                            { label: "Maintain", status: "Mastered", items: ["Stable neural baseline stability", "Continue daily vector drills"], color: "bg-emerald-500 text-emerald-400", progress: 95 }
                        ]}
                    />
                </div>

                <InterpretationCard
                    title="Diagnostic Sweep Insight"
                    bullets={[`Primary concentration remains in ${data.lineage?.topic || 'Core'} core zones.`, `Baseline stability monitored at ${data.score}% across all sub‑vectors.`]}
                />
            </div>

            <PdfFooter page={page.toString().padStart(2, '0')} total={total.toString().padStart(2, '0')} label="Neural Diagnostic Breakdown" />
        </div>
    );
}

/* ────────────────────────────────────────────── */
/*  PAGE 03 : Temporal Analytics                 */
/* ────────────────────────────────────────────── */
export function SubjectBreakdownPage({ data, page, total }: PageProps) {
    return (
        <div className="h-full w-full flex flex-col justify-between">
            <SectionHeader title="Velocity & Neural Patterns" label="Temporal Spend Analysis" data={data} />

            <div className="flex-1 flex flex-col justify-between" style={{ gap: T.grid.sectionGap }}>
                <div className="flex-1 flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-6 items-stretch">
                        <ChartCard className="flex-1">
                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">
                                Cognitive Distribution
                            </div>
                            <div className="flex-1 min-h-0">
                                <SkillDonutChartPrint data={data.skills} />
                            </div>
                        </ChartCard>
                        <ChartCard className="flex-1">
                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">
                                Temporal Metrics
                            </div>
                            <div className="flex-1 min-h-0">
                                <TimeSpentDonutPrint data={{
                                    totalSeconds: data.totalTimeSpentSeconds,
                                    questions: data.questions || [],
                                    timeBuckets: data.timeBuckets
                                }} />
                            </div>
                        </ChartCard>
                    </div>
                    <TacticalPrescriptionPrintPanel
                        data={data}
                        title="Spatio-Temporal Correlation"
                        dense={true}
                        layout="horizontal"
                        tierOverrides={[
                            { label: "Focus Areas", status: "Critical", items: [`Reduce friction in ${data.ai.weakest_skill || 'reasoning'}`, "Minimize 'Review' cycle time"], color: "bg-rose-500 text-rose-400", progress: 42 },
                            { label: "Strengthen", status: "Proficient", items: ["Stabilize high-friction nodes", "Optimize logic-branch speed"], color: "bg-amber-500 text-amber-400", progress: 58 },
                            { label: "Maintain", status: "Mastered", items: ["Stable Study zone processing", "Flow-state neural baseline"], color: "bg-emerald-500 text-emerald-400", progress: 95 }
                        ]}
                    />
                </div>

                <div className="grid grid-cols-2" style={{ gap: T.grid.sectionGap }}>
                    <InterpretationCard
                        title="Cognitive Node Interpretation"
                        bullets={data.ai.actions.slice(0, 2)}
                    />
                    <InterpretationCard
                        title="Temporal Spend Analysis"
                        bullets={["Steady pacing on expert vectors", "Logic verification latency noted"]}
                    />
                </div>
            </div>

            <PdfFooter page={page.toString().padStart(2, '0')} total={total.toString().padStart(2, '0')} label="Temporal Metadata Synthesis" />
        </div>
    );
}

/* ────────────────────────────────────────────── */
/*  PAGE 04 : Cognitive Heatmap                  */
/* ────────────────────────────────────────────── */
export function NeuralHeatmapPage({ data, page, total }: PageProps) {
    usePdfMarkReady("print:heatmap");
    return (
        <div className="h-full w-full flex flex-col justify-between">
            <SectionHeader title="Cognitive Heatmap" label="Phase 21 Granular Mastery" data={data} />

            <div className="flex-1 flex flex-col overflow-hidden justify-between" style={{ gap: T.grid.sectionGap }}>
                <div className="flex flex-col gap-6">
                    <ReportCard>
                        <HeatmapMatrixPrint data={data.heatmap || []} />
                    </ReportCard>
                    <TacticalPrescriptionPrintPanel
                        data={data}
                        title="Cognitive Load Analysis"
                        dense={true}
                        layout="horizontal"
                        tierOverrides={[
                            { label: "Focus Areas", status: "Critical", items: ["Eliminate 'Red Out' at Expert Level", "Tackle high-entropy vectors"], color: "bg-rose-500 text-rose-400", progress: 25 },
                            { label: "Strengthen", status: "Proficient", items: ["Bridge Intermediate to Expert gap", "Stabilize operational thresholds"], color: "bg-amber-500 text-amber-400", progress: 62 },
                            { label: "Maintain", status: "Mastered", items: ["Perfect Score on Simple difficulty", "Stable Intermediate performance"], color: "bg-emerald-500 text-emerald-400", progress: 98 }
                        ]}
                    />
                </div>

                <InterpretationCard
                    title="Matrix Heat Analysis"
                    bullets={[`Targeted optimization for ${data.ai.weakest_subtopic} across Intermediate vectors.`, "Executive mastery threshold maintained in Expert tiers."]}
                />
            </div>

            <PdfFooter page={page.toString().padStart(2, '0')} total={total.toString().padStart(2, '0')} label="Multi‑Vector Difficulty Analysis" />
        </div>
    );
}

/* ────────────────────────────────────────────── */
/*  PAGE 05 : Complexity Ladder (Progress Bars)  */
/* ────────────────────────────────────────────── */
export function ComplexityLadderPage({ data, page, total }: PageProps) {
    usePdfMarkReady("print:complexity");
    return (
        <div className="h-full w-full flex flex-col justify-between">
            <SectionHeader title="Complexity Scrutiny" label="Spatio‑Visual Depth Matrix" data={data} />

            <div className="flex-1 flex flex-col justify-between" style={{ gap: T.grid.sectionGap }}>
                <div className="flex flex-col gap-6">
                    <ReportCard>
                        <h3 className={T.typography.label} style={{ color: 'rgb(129,140,248)', marginBottom: 32 }}>Difficulty Matrix Diagnostic</h3>
                        <div className="space-y-8 flex-1 flex flex-col justify-center">
                            {data.difficulty.map((d, i) => {
                                const barColor = d.accuracy >= 80
                                    ? "from-emerald-500 to-cyan-400"
                                    : d.accuracy >= 50
                                        ? "from-indigo-500 to-cyan-400"
                                        : "from-rose-500 to-amber-400";
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between items-end mb-3">
                                            <div className="flex items-baseline gap-2">
                                                <span className={T.typography.label}>{d.level} Level</span>
                                                <span className="text-[10px] font-bold text-slate-500">{d.attempts} Questions</span>
                                            </div>
                                            <span className={T.typography.metric}>{d.accuracy}% Accuracy</span>
                                        </div>
                                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className={cn("h-full rounded-full bg-gradient-to-r", barColor)}
                                                style={{ width: `${d.accuracy}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ReportCard>
                    <TacticalPrescriptionPrintPanel
                        data={data}
                        title="Pressure Tolerance"
                        dense={true}
                        layout="horizontal"
                        tierOverrides={[
                            { label: "Focus Areas", status: "Critical", items: ["Target 'Expert' implementation rigidity", "Address complexity drop-off"], color: "bg-rose-500 text-rose-400", progress: 30 },
                            { label: "Strengthen", status: "Proficient", items: ["Shift from linear to non-linear logic", "Practice multi-variable problems"], color: "bg-amber-500 text-amber-400", progress: 55 },
                            { label: "Maintain", status: "Mastered", items: ["Perfect Score on Simple difficulty", "Stable Intermediate performance"], color: "bg-emerald-500 text-emerald-400", progress: 100 }
                        ]}
                    />
                </div>

                <div className="grid grid-cols-2" style={{ gap: T.grid.sectionGap }}>
                    <InterpretationCard
                        title="Spatio‑Visual Depth Matrix"
                        bullets={["Cognitive load stability maintained at peak expert complexity.", "Latency recovery noted during intermediate transitions."]}
                    />
                    <InterpretationCard
                        title="Load Vector Stability"
                        bullets={["Consistent accuracy coefficient across scaling difficulty vectors.", "No signs of structural logic exhaustion."]}
                    />
                </div>
            </div>

            <PdfFooter page={page.toString().padStart(2, '0')} total={total.toString().padStart(2, '0')} label="Scaling Accuracy Coefficients" />
        </div>
    );
}

/* ────────────────────────────────────────────── */
/*  PAGE 06 : Appendix Cover                     */
/* ────────────────────────────────────────────── */
export function AppendixCoverPage({ page, total }: { page: number; total: number }) {
    return (
        <div className="h-full flex flex-col justify-center items-center text-center">
            <div className="w-16 h-1 bg-indigo-500 mb-12 rounded-full" />
            <h2 className="text-[12rem] font-black uppercase tracking-tighter leading-none text-white opacity-10 absolute -z-10">AUDIT</h2>
            <h2 className={cn(T.typography.metric, "text-5xl mb-4")}>Appendix</h2>
            <p className={T.typography.label} style={{ color: 'rgb(129,140,248)', letterSpacing: '0.6em' }}>Universal Audit Log</p>
            <div className="w-16 h-1 bg-indigo-500 mt-12 rounded-full" />
            <div className="mt-20 max-w-sm report-subheading leading-loose">
                RAW TELEMETRY RECORD FOR CROSS‑VERIFICATION OF NEURAL ANALYSIS ACCURACY
            </div>
            <PdfFooter page={page.toString().padStart(2, '0')} total={total.toString().padStart(2, '0')} label="Evidence Node Root" />
        </div>
    );
}

/* ────────────────────────────────────────────── */
/*  PAGE 07+ : Question Registry (Card Layout)   */
/* ────────────────────────────────────────────── */
export function QuestionAuditPage({ data, page, total }: { questions?: QuestionItem[]; data: TopicUnitData; page: number; total: number; offset?: number }) {
    const totalQuestions = data.questions?.length || 0;
    const correctCount = data.questions?.filter(q => q.isCorrect).length || 0;
    const auditAccuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const auditAvgLatency = totalQuestions > 0 ? Math.round(data.totalTimeSpentSeconds / totalQuestions) : 0;

    // Per-difficulty breakdown for statistical table
    const difficultyStats = data.difficulty.map(d => ({
        level: d.level,
        attempts: d.attempts,
        accuracy: d.accuracy,
    }));

    // Per-subtopic accuracy summary
    const subtopicStats = data.subtopics.slice(0, 10).map(s => ({
        name: s.name,
        accuracy: s.accuracy,
        attempts: s.attempts,
    }));

    return (
        <div className="h-full w-full flex flex-col">
            <header className="flex justify-between items-end border-b border-slate-800 pb-4 mb-6">
                <div>
                    <h2 className="report-heading" style={{ fontSize: 18 }}>Audit Statistical Summary</h2>
                    <p className="report-subheading mt-1">Evidence Node</p>
                </div>
                <span className="report-subheading">Exhibit {page} / {total}</span>
            </header>

            {/* Raw Audit Stats Banner */}
            <div className="p-8 bg-slate-100/10 dark:bg-slate-950 rounded-[2rem] border border-white/5 mb-8 flex items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />
                <div className="relative z-10 flex flex-col">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Raw Audit</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Vector Diagnostic Log</p>
                </div>
                <div className="relative z-10 flex items-center divide-x divide-slate-800">
                    <div className="flex flex-col items-center px-4">
                        <span className="text-2xl font-black text-slate-300">{totalQuestions}</span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 whitespace-nowrap">Total Depth</span>
                    </div>
                    <div className="flex flex-col items-center px-4 border-l border-slate-800">
                        <span className="text-2xl font-black text-indigo-400">{auditAccuracy}%</span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 whitespace-nowrap">Accuracy Sync</span>
                    </div>
                    <div className="flex flex-col items-center px-4 border-l border-slate-800">
                        <span className="text-2xl font-black text-emerald-500">{correctCount}</span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 whitespace-nowrap">Hits</span>
                    </div>
                    <div className="flex flex-col items-center px-4 border-l border-slate-800">
                        <span className="text-2xl font-black text-rose-500">{totalQuestions - correctCount}</span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 whitespace-nowrap">Misses</span>
                    </div>
                    <div className="flex flex-col items-center px-4 border-l border-slate-800">
                        <span className="text-2xl font-black text-amber-500">{auditAvgLatency}s</span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 whitespace-nowrap">Avg Latency</span>
                    </div>
                </div>
            </div>

            {/* Statistical Tables (replaces individual Q&A cards) */}
            <div className="flex-1 grid grid-cols-2" style={{ gap: T.grid.sectionGap }}>
                {/* Difficulty Breakdown */}
                <ReportCard>
                    <h3 className={T.typography.label} style={{ color: 'rgb(129,140,248)', marginBottom: 16 }}>Performance By Difficulty</h3>
                    <div className="space-y-4">
                        {difficultyStats.map((d, i) => {
                            const barColor = d.accuracy >= 80
                                ? "from-emerald-500 to-cyan-400"
                                : d.accuracy >= 50
                                    ? "from-indigo-500 to-cyan-400"
                                    : "from-rose-500 to-amber-400";
                            return (
                                <div key={i}>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className={T.typography.label}>{d.level}</span>
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-[10px] font-bold text-slate-500">{d.attempts} Q</span>
                                            <span className={T.typography.metric}>{d.accuracy}%</span>
                                        </div>
                                    </div>
                                    <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className={cn("h-full rounded-full bg-gradient-to-r", barColor)}
                                            style={{ width: `${d.accuracy}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ReportCard>

                {/* Subtopic Accuracy Grid */}
                <ReportCard>
                    <h3 className={T.typography.label} style={{ color: 'rgb(129,140,248)', marginBottom: 16 }}>Subtopic Accuracy Index</h3>
                    <div className="space-y-3">
                        {subtopicStats.map((s, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-400 tabular-nums w-5">{(i + 1).toString().padStart(2, '0')}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[11px] font-bold text-slate-300 truncate">{s.name}</span>
                                        <span className={cn("text-[11px] font-black ml-2", s.accuracy >= 80 ? "text-emerald-400" : s.accuracy >= 50 ? "text-indigo-400" : "text-rose-400")}>
                                            {s.accuracy}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full", s.accuracy >= 80 ? "bg-emerald-500" : s.accuracy >= 50 ? "bg-indigo-500" : "bg-rose-500")}
                                            style={{ width: `${s.accuracy}%` }}
                                        />
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold text-slate-600 w-8 text-right">{s.attempts}Q</span>
                            </div>
                        ))}
                    </div>
                </ReportCard>
            </div>

            <PdfFooter page={page.toString().padStart(2, '0')} total={total.toString().padStart(2, '0')} label="Audit Evidence Log" />
        </div>
    );
}

/* ─── Shared Subcomponents ─── */

function SectionHeader({ title, label, data }: { title: string; label: string; data?: TopicUnitData }) {
    return (
        <header className="mb-4 pb-4 border-b border-slate-800/60 flex justify-between items-end">
            <div>
                {data?.lineage && (
                    <div className="flex items-center gap-2 mb-2 opacity-80">
                        <span className="px-2 py-0.5 bg-indigo-500/10 rounded-md text-[9px] font-black text-indigo-400 uppercase tracking-widest border border-indigo-500/20">Neural Diagnostics</span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{data.lineage.domain}</span>
                        {data.lineage.subject && (
                            <>
                                <div className="h-1 w-1 rounded-full bg-slate-800" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{data.lineage.subject}</span>
                            </>
                        )}
                    </div>
                )}
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{title}</h2>
            </div>
            <div className="text-right">
                <span className="report-subheading block mb-1">{label}</span>
                {data?.id && <span className="text-[9px] font-mono text-slate-600">VECTOR: {data.id.slice(0, 8).toUpperCase()}</span>}
            </div>
        </header>
    );
}

function PdfFooter({ page, total, label }: { page: string; total: string; label: string }) {
    return (
        <footer className="pdf-footer flex justify-between items-end report-subheading border-t border-slate-800 pt-2 mt-auto">
            <div>{label}</div>
            <div>Page {page} / {total}</div>
        </footer>
    );
}

/* ────────────────────────────────────────────── */
/*  SUMMARY HELPERS                              */
/* ────────────────────────────────────────────── */

function SummaryBarChart({ data, label }: { data: { name: string; accuracy: number }[], label: string }) {
    const sorted = [...data].sort((a, b) => b.accuracy - a.accuracy);

    return (
        <div className="w-full flex flex-col h-full bg-slate-900/20 rounded-3xl p-8 border border-slate-800/30">
            <div className="border-b border-slate-800 pb-6 mb-8 flex justify-between items-end">
                <div>
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Comparative Intelligence</h3>
                    <p className="text-2xl font-black text-white uppercase tracking-tighter">{label}</p>
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1 bg-slate-800/50 rounded-full border border-white/5">
                    N-Vector Analysis
                </div>
            </div>

            <div className={cn("flex-1 space-y-6 overflow-hidden", data.length > 10 && "space-y-3")}>
                {sorted.map((item, idx) => (
                    <div key={idx} className="group">
                        <div className={cn("flex justify-between items-baseline mb-2 px-1", data.length > 10 && "mb-1")}>
                            <span className={cn(
                                "text-[12px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-white transition-colors truncate max-w-[70%]",
                                data.length > 10 && "text-[10px]"
                            )}>
                                {item.name}
                            </span>
                            <span className={cn("text-[14px] font-black text-indigo-400", data.length > 10 && "text-[12px]")}>
                                {item.accuracy}%
                            </span>
                        </div>
                        <div className={cn("relative h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5", data.length > 10 && "h-1.5")}>
                            <div
                                className="absolute h-full bg-gradient-to-r from-indigo-600 to-violet-600 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                                style={{ width: `${item.accuracy}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800/50">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-loose">
                    THE CUMULATIVE ACCURACY COEFFICIENT IS CALCULATED ACROSS ALL SUB-VECTORS.
                    STABILITY OF THIS METRIC IS PROPORTIONAL TO SAMPLE DENSITY.
                </p>
            </div>
        </div>
    );
}

function VectorSummaryCard({ title, items, colorClass }: { title: string, items: string[], colorClass: string }) {
    return (
        <ReportCard className="flex-1">
            <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-6 ${colorClass}`}>{title}</h3>
            <div className="space-y-4">
                {items.length > 0 ? items.map((item, i) => (
                    <div key={i} className="flex gap-4 items-start group">
                        <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 transition-all ${colorClass.replace('text-', 'bg-')} group-hover:scale-125`} />
                        <p className="text-[13px] font-semibold text-slate-300 tracking-tight leading-snug group-hover:text-white transition-colors">{item}</p>
                    </div>
                )) : (
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest italic">Insufficient Data Point</p>
                )}
            </div>
        </ReportCard>
    );
}

/* ────────────────────────────────────────────── */
/*  SUBJECT SUMMARY PAGE                         */
/* ────────────────────────────────────────────── */

export function SubjectSummaryPage({ data, page, total }: { data: SubjectUnitData, page: number, total: number }) {
    return (
        <div className="h-full w-full flex flex-col">
            <header className="pdf-header flex justify-between items-start border-b border-slate-800 pb-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2 opacity-60">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{data.lineage.domain}</span>
                    </div>
                    <h1 className="report-heading">{data.name}</h1>
                    <p className="report-subheading mt-1">Subject Strategy Overview : {data.candidateName || "Intelligence Assets"}</p>
                </div>
                <div className="text-right">
                    <p className={T.typography.label} style={{ color: 'rgb(129,140,248)' }}>
                        {data.completedAt ? new Date(data.completedAt).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="report-subheading mt-0.5">Ref: {data.id.slice(0, 12)}</p>
                </div>
            </header>

            <div className="flex-1 min-h-0">
                <PdfGridTwoColumn
                    left={
                        <SummaryBarChart
                            label="Topic Performance Benchmarks"
                            data={data.topicAccuracies.map(t => ({ name: t.topicName, accuracy: t.accuracy }))}
                        />
                    }
                    right={
                        <div className="flex flex-col h-full gap-6">
                            <VectorSummaryCard
                                title="Subject-Level Strengths"
                                items={data.strengths}
                                colorClass="text-emerald-400"
                            />
                            <VectorSummaryCard
                                title="Critical Subject Weaknesses"
                                items={data.weaknesses}
                                colorClass="text-rose-400"
                            />
                        </div>
                    }
                />
            </div>

            <footer className="pdf-footer mt-8 pt-4 border-t border-slate-800/50 flex justify-between items-center opacity-40">
                <span className="text-[9px] font-black tracking-[0.4em] text-slate-500 uppercase">Neural Intelligence System • Phase 4 Output</span>
                <span className="text-[11px] font-black tracking-[0.2em] text-indigo-400">PAGE {page} / {total}</span>
            </footer>
        </div>
    );
}

/* ────────────────────────────────────────────── */
/*  DOMAIN OVERVIEW PAGE                         */
/* ────────────────────────────────────────────── */

export function DomainOverviewPage({ data, page, total }: { data: DomainUnitData, page: number, total: number }) {
    return (
        <div className="h-full w-full flex flex-col">
            <header className="pdf-header flex justify-between items-start border-b border-slate-800 pb-4 mb-8 text-center">
                <div className="w-full">
                    <h1 className="report-heading text-6xl tracking-[-0.04em] mb-2">{data.name}</h1>
                    <p className="report-subheading text-[11px] tracking-[0.4em] opacity-40">Intelligence Aggregator : {data.candidateName || "Intelligence Assets"}</p>
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center space-y-12">
                <div className="relative group">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-1000" />
                    <div className="relative bg-slate-900/60 border border-white/5 rounded-[4rem] p-16 flex flex-col items-center shadow-2xl backdrop-blur-xl">
                        <span className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-4">Domain Composite Accuracy</span>
                        <div className="text-9xl font-black text-white tracking-tighter tabular-nums flex items-start">
                            <span>{data.overallAccuracy}</span>
                            <span className="text-3xl text-indigo-500/50 mt-6 ml-2">%</span>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-4xl h-80">
                    <SummaryBarChart
                        label="Subject Comparative Analysis"
                        data={data.subjectAccuracies.map(s => ({ name: s.subjectName, accuracy: s.accuracy }))}
                    />
                </div>
            </div>

            <footer className="pdf-footer mt-12 pt-6 border-t border-slate-800/50 flex justify-between items-center opacity-40">
                <div className="flex items-center gap-6">
                    <span className="text-[9px] font-black tracking-[0.4em] text-slate-500 uppercase">Reference: {data.id.slice(0, 16)}</span>
                    <div className="h-1 w-1 rounded-full bg-slate-800" />
                    <span className="text-[9px] font-black tracking-[0.4em] text-slate-500 uppercase">{data.completedAt ? new Date(data.completedAt).toISOString() : 'TIMESTAMP_PENDING'}</span>
                </div>
                <span className="text-[11px] font-black tracking-[0.2em] text-indigo-400 font-mono">PAGE {page} / {total}</span>
            </footer>
        </div>
    );
}
