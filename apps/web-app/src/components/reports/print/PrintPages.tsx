"use client";

import dynamic from "next/dynamic";
import React from "react";
import { ExamReport } from "@/components/reports/ExamReportLayout";
import { cn } from "@/lib/utils";
import { REPORT_LAYOUT } from "@/lib/reportLayoutTokens";
import { FixedChartWrapper, PdfGridTwoColumn } from "./PrintToolkit";
import { ReportCard, ChartCard } from "../shared/ReportCard";
import {
    TacticalPrescriptionPrintPanel,
    InterpretationCard,
    HeatmapMatrixPrint
} from "./PrintComponents";

const RadialKPI = dynamic(() => import("../RadialKPI").then(mod => mod.RadialKPI), { ssr: false });
const SubtopicBarChart = dynamic(() => import("../SubtopicBarChart").then(mod => mod.SubtopicBarChart), { ssr: false });
const SkillDonutChart = dynamic(() => import("../SkillDonutChart").then(mod => mod.SkillDonutChart), { ssr: false });
const TimeSpentDonut = dynamic(() => import("../TimeSpentDonut").then(mod => mod.TimeSpentDonut), { ssr: false });

/* ─── Tokens ─── */
const T = REPORT_LAYOUT;

interface PageProps {
    data: ExamReport;
    page: number;
    total: number;
}

type QuestionRow = NonNullable<ExamReport["questions"]>[number];

/* ────────────────────────────────────────────── */
/*  PAGE 01 : Executive Summary                  */
/* ────────────────────────────────────────────── */
export function ExecutiveSummaryPage({ data, page, total }: PageProps) {
    return (
        <div className="h-full flex flex-col">
            <header className="pdf-header flex justify-between items-start border-b border-slate-800 pb-4 mb-6">
                <div>
                    <h1 className="report-heading">{data.lineage?.topic || "Diagnostic Intelligence"}</h1>
                    <p className="report-subheading mt-1">Executive Analysis : {data.candidateName || "Intelligence Assets"}</p>
                </div>
                <div className="text-right">
                    <p className={T.typography.label} style={{ color: 'rgb(129,140,248)' }}>
                        {data.completedAt ? new Date(data.completedAt).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="report-subheading mt-0.5">Ref: {data.examId.slice(0, 12)}</p>
                </div>
            </header>

            <div className="flex-1 flex flex-col" style={{ gap: T.grid.sectionGap }}>
                <div className="flex-1">
                    <PdfGridTwoColumn
                        left={
                            <ChartCard>
                                <FixedChartWrapper height={T.chart.large}>
                                    <RadialKPI data={data} suppressAnimation={true} />
                                </FixedChartWrapper>
                            </ChartCard>
                        }
                        right={
                            <ReportCard className="p-0">
                                <TacticalPrescriptionPrintPanel data={data} />
                            </ReportCard>
                        }
                    />
                </div>

                {data.interpreter?.skills && (
                    <InterpretationCard
                        title="Readiness Index Synopsis"
                        bullets={data.interpreter.skills.slice(0, 2)}
                    />
                )}
            </div>

            <PdfFooter page={page.toString().padStart(2, '0')} total={total.toString().padStart(2, '0')} label="Proprietary Diagnostic Asset" />
        </div>
    );
}

/* ────────────────────────────────────────────── */
/*  PAGE 02 : Subtopic Accuracy                  */
/* ────────────────────────────────────────────── */
export function SubtopicAccuracyPage({ data, page, total }: PageProps) {
    return (
        <div className="h-full flex flex-col">
            <SectionHeader title="Subtopic Precision Matrix" label="Diagnostic Sweep V4" />

            <div className="flex-1 flex flex-col" style={{ gap: T.grid.sectionGap }}>
                <div className="flex-1">
                    <PdfGridTwoColumn
                        left={
                            <ChartCard>
                                <FixedChartWrapper height={440}>
                                    <SubtopicBarChart
                                        data={data.subtopics}
                                        weakest={data.ai.weakest_subtopic}
                                        suppressAnimation={true}
                                    />
                                </FixedChartWrapper>
                            </ChartCard>
                        }
                        right={
                            <ReportCard>
                                <h3 className={T.typography.label} style={{ color: 'rgb(129,140,248)', marginBottom: 16 }}>Precision Analysis</h3>
                                <p className={cn(T.typography.body, "flex-1")}>
                                    Performance across {data.subtopics.length} vectors indicates {data.score > 80 ? "strong structural mastery" : "variable concept retention"} in the {data.lineage?.subject || 'Diagnostic'} domain. High‑frequency variance detected in {data.ai.weakest_subtopic}.
                                </p>
                            </ReportCard>
                        }
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
        <div className="h-full flex flex-col">
            <SectionHeader title="Velocity & Neural Patterns" label="Temporal Spend Analysis" />

            <div className="flex-1 flex flex-col" style={{ gap: T.grid.sectionGap }}>
                <div className="flex-1">
                    <PdfGridTwoColumn
                        left={
                            <div className="h-full flex flex-col" style={{ gap: T.grid.sectionGap }}>
                                <ChartCard className="flex-1">
                                    <div style={{ width: T.chart.medium, height: T.chart.medium }} className="mx-auto">
                                        <SkillDonutChart data={data.skills} suppressAnimation={true} />
                                    </div>
                                </ChartCard>
                                <ChartCard className="flex-1">
                                    <div style={{ width: T.chart.medium, height: T.chart.medium }} className="mx-auto">
                                        <TimeSpentDonut data={{
                                            totalSeconds: data.totalTimeSpentSeconds,
                                            questions: data.questions || [],
                                            timeBuckets: data.timeBuckets
                                        }} suppressAnimation={true} />
                                    </div>
                                </ChartCard>
                            </div>
                        }
                        right={
                            <ReportCard className="p-0">
                                <TacticalPrescriptionPrintPanel data={data} />
                            </ReportCard>
                        }
                    />
                </div>

                <div className="grid grid-cols-2" style={{ gap: T.grid.sectionGap }}>
                    <InterpretationCard
                        title="Cognitive Node Interpretation"
                        bullets={data.interpreter?.skills?.slice(2, 4) || ["Stabilize high‑friction nodes", "Optimize logic‑branch speed"]}
                    />
                    <InterpretationCard
                        title="Temporal Spend Analysis"
                        bullets={data.interpreter?.time?.slice(0, 2) || ["Steady pacing on expert vectors", "Logic verification latency noted"]}
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
    return (
        <div className="h-full flex flex-col">
            <SectionHeader title="Cognitive Heatmap" label="Phase 21 Granular Mastery" />

            <div className="flex-1 flex flex-col overflow-hidden" style={{ gap: T.grid.sectionGap }}>
                <div className="flex-1">
                    <PdfGridTwoColumn
                        left={
                            <ReportCard>
                                <HeatmapMatrixPrint data={data.heatmap || []} />
                            </ReportCard>
                        }
                        right={
                            <ReportCard className="p-0">
                                <TacticalPrescriptionPrintPanel data={data} />
                            </ReportCard>
                        }
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
    return (
        <div className="h-full flex flex-col">
            <SectionHeader title="Complexity Scrutiny" label="Spatio‑Visual Depth Matrix" />

            <div className="flex-1 flex flex-col" style={{ gap: T.grid.sectionGap }}>
                <div className="flex-1">
                    <PdfGridTwoColumn
                        left={
                            <ReportCard>
                                <h3 className={T.typography.label} style={{ color: 'rgb(129,140,248)', marginBottom: 32 }}>Scaling Accuracy Coefficients</h3>
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
                                                    <span className={T.typography.label}>{d.level}</span>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className={T.typography.metric}>{d.accuracy}%</span>
                                                        <span className={T.typography.label}>{d.attempts} inst.</span>
                                                    </div>
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
                        }
                        right={
                            <ReportCard className="p-0">
                                <TacticalPrescriptionPrintPanel data={data} />
                            </ReportCard>
                        }
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
        <div className="h-full flex flex-col justify-center items-center text-center bg-[#0B1220]">
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
export function QuestionAuditPage({ questions, page, total, offset }: { questions: QuestionRow[]; page: number; total: number; offset: number }) {
    return (
        <div className="h-full flex flex-col">
            <header className="flex justify-between items-end border-b border-slate-800 pb-4 mb-6">
                <div>
                    <h2 className="report-heading" style={{ fontSize: 18 }}>Registry : Log {page < 10 ? `0${page}` : page}</h2>
                    <p className="report-subheading mt-1">Evidence Node</p>
                </div>
                <span className="report-subheading">Exhibit {page} / {total}</span>
            </header>

            <div className="flex-1">
                <div className="space-y-4">
                    {questions.map((q, i) => (
                        <div key={i} className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5">
                            <div className="flex gap-4">
                                <div className="text-indigo-400 font-black text-xs tabular-nums pt-0.5">
                                    {(offset + i + 1).toString().padStart(2, '0')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white leading-snug max-w-none">{q.text}</p>

                                    <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-indigo-300">User Pulse</div>
                                    <p className="text-xs text-slate-300 mt-1">{q.userAnswer || 'NO_RESPONSE'}</p>

                                    <div className="mt-4 flex justify-between items-center text-[10px] border-t border-white/5 pt-3">
                                        <span className={cn(
                                            "font-black uppercase tracking-widest",
                                            q.isCorrect ? "text-emerald-400" : "text-rose-400"
                                        )}>
                                            {q.isCorrect ? 'VALID' : 'INVALID'}
                                        </span>
                                        <div className="flex gap-4">
                                            <span className="font-black text-slate-500 uppercase tracking-widest">{q.difficulty || 'STD'}</span>
                                            <span className="font-black text-slate-500">{q.timeSpent || 0}s</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <PdfFooter page={page.toString().padStart(2, '0')} total={total.toString().padStart(2, '0')} label="Audit Evidence Log" />
        </div>
    );
}

/* ─── Shared Subcomponents ─── */

function SectionHeader({ title, label }: { title: string; label: string }) {
    return (
        <header className="mb-6 pb-4 border-b border-slate-800 flex justify-between items-end">
            <h2 className="report-heading">{title}</h2>
            <span className="report-subheading">{label}</span>
        </header>
    );
}

function PdfFooter({ page, total, label }: { page: string; total: string; label: string }) {
    return (
        <footer className="pdf-footer flex justify-between items-end report-subheading border-t border-slate-800 pt-4 mt-auto">
            <div>{label}</div>
            <div>Page {page} / {total}</div>
        </footer>
    );
}
