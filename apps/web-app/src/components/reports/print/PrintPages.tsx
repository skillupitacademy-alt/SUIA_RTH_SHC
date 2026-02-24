"use client";

import dynamic from "next/dynamic";
import { ExamReport } from "@/components/reports/ExamReportLayout";
import { cn } from "@/lib/utils";
import { FixedChartWrapper, PdfGridTwoColumn } from "./PrintToolkit";

// Lazy load charts to avoid SSR issues in PDF generation, 
// using ssr: false because Puppeteer IS the browser, but we want zero animations.
const RadialKPI = dynamic(() => import("../RadialKPI").then(mod => mod.RadialKPI), { ssr: false });
const SubtopicBarChart = dynamic(() => import("../SubtopicBarChart").then(mod => mod.SubtopicBarChart), { ssr: false });
const SkillDonutChart = dynamic(() => import("../SkillDonutChart").then(mod => mod.SkillDonutChart), { ssr: false });
const TimeSpentDonut = dynamic(() => import("../TimeSpentDonut").then(mod => mod.TimeSpentDonut), { ssr: false });

interface PageProps {
    data: ExamReport;
    page: number;
    total: number;
}

type QuestionRow = NonNullable<ExamReport["questions"]>[number];

/**
 * PAGE 01: Executive Summary
 */
export function ExecutiveSummaryPage({ data, page, total }: PageProps) {
    return (
        <div className="h-full flex flex-col">
            <header className="pdf-header flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
                        {data.lineage?.topic || "Diagnostic Intelligence"}
                    </h1>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mt-1">
                        Executive Analysis: {data.candidateName || "Intelligence Assets"}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-black uppercase tracking-widest text-indigo-400">
                        {data.completedAt ? new Date(data.completedAt).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Ref: {data.examId.slice(0, 12)}</p>
                </div>
            </header>

            <div className="flex-1">
                <PdfGridTwoColumn
                    leftRatio={1.5}
                    rightRatio={1}
                    left={
                        <FixedChartWrapper height={460}>
                            <RadialKPI data={data} suppressAnimation={true} />
                        </FixedChartWrapper>
                    }
                    right={
                        <div className="bg-slate-800/40 p-8 rounded-3xl border border-slate-700/50 flex flex-col justify-between h-full max-h-[460px]">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-6">Strategic Intelligence</h3>
                                <ul className="space-y-4">
                                    {(data.ai?.actions || []).slice(0, 5).map((action, i) => (
                                        <li key={i} className="flex gap-4 text-xs leading-relaxed text-slate-300">
                                            <span className="font-black text-indigo-500/50">0{i + 1}</span>
                                            {action}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <p className="text-[9px] font-medium text-slate-500 italic mt-6">
                                Automated synthesis based on multi-vector cognitive performance.
                            </p>
                        </div>
                    }
                />
            </div>

            <PdfFooter page={page.toString().padStart(2, '0')} total={total.toString().padStart(2, '0')} label="Proprietary Diagnostic Asset" />
        </div>
    );
}

/**
 * PAGE 02: Subtopic Distribution
 */
export function SubtopicAccuracyPage({ data, page, total }: PageProps) {
    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-8 pb-3 border-b border-slate-800">Subtopic Precision Matrix</h2>
            <div className="flex-1">
                <PdfGridTwoColumn
                    leftRatio={2}
                    rightRatio={1}
                    left={
                        <FixedChartWrapper height={420}>
                            <SubtopicBarChart
                                data={data.subtopics}
                                weakest={data.ai.weakest_subtopic}
                                suppressAnimation={true}
                            />
                        </FixedChartWrapper>
                    }
                    right={
                        <div className="bg-indigo-600/5 p-8 rounded-3xl border border-indigo-500/20 flex flex-col justify-center h-full max-h-[400px]">
                            <h3 className="text-[10px] font-black uppercase text-indigo-400 mb-4">Precision Analysis</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Performance across {data.subtopics.length} vectors indicates {data.score > 80 ? "strong structural mastery" : "variable concept retention"} in the {data.lineage?.subject || 'Diagnostic'} domain.
                            </p>
                        </div>
                    }
                />
            </div>
            <PdfFooter page={page.toString().padStart(2, '0')} total={total.toString().padStart(2, '0')} label="Neural Diagnostic Breakdown" />
        </div>
    );
}

/**
 * PAGE 03: Temporal Analytics
 */
export function SubjectBreakdownPage({ data, page, total }: PageProps) {
    return (
        <div className="h-full flex flex-col pt-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-10 pb-3 border-b border-slate-800">Velocity & Neural Patterns</h2>
            <div className="flex-1">
                <PdfGridTwoColumn
                    leftRatio={1}
                    rightRatio={1}
                    left={
                        <FixedChartWrapper height={380}>
                            <SkillDonutChart data={data.skills} suppressAnimation={true} />
                        </FixedChartWrapper>
                    }
                    right={
                        <FixedChartWrapper height={380}>
                            <TimeSpentDonut data={{
                                totalSeconds: data.totalTimeSpentSeconds,
                                questions: data.questions || [],
                                timeBuckets: data.timeBuckets
                            }} suppressAnimation={true} />
                        </FixedChartWrapper>
                    }
                />
            </div>
            <PdfFooter page={page.toString().padStart(2, '0')} total={total.toString().padStart(2, '0')} label="Temporal Metadata Synthesis" />
        </div>
    );
}

/**
 * PAGE 04: Cognitive Heatmap
 */
export function NeuralHeatmapPage({ data, page, total }: PageProps) {
    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-8 pb-3 border-b border-slate-800">Cognitive Heatmap</h2>
            <div className="flex-1 overflow-hidden">
                <div className="border border-slate-800 rounded-3xl overflow-hidden bg-slate-900/40">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-500 w-1/3">Subtopic Vector</th>
                                {['Novice', 'Intermediate', 'Expert'].map(l => (
                                    <th key={l} className="p-4 text-[9px] font-black uppercase tracking-widest text-center text-slate-500">{l}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.subtopics.slice(0, 7).map((st, i) => (
                                <tr key={i} className="border-b border-slate-800/50">
                                    <td className="p-4 text-[10px] font-black uppercase text-slate-300">{st.name}</td>
                                    {['Novice', 'Intermediate', 'Expert'].map(level => {
                                        const cell = data.heatmap?.find(h =>
                                            h.subtopic === st.name &&
                                            h.difficulty.toLowerCase() === level.toLowerCase()
                                        );
                                        const acc = cell?.accuracy || 0;
                                        return (
                                            <td key={level} className="p-2">
                                                <div className={cn(
                                                    "h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all",
                                                    acc >= 80 ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" :
                                                        acc >= 50 ? "bg-slate-700 text-slate-300" :
                                                            acc > 0 ? "bg-slate-800 text-slate-500 border border-slate-700" : "bg-transparent text-slate-700/30"
                                                )}>
                                                    {acc > 0 ? `${acc}%` : '-'}
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <PdfFooter page={page.toString().padStart(2, '0')} total={total.toString().padStart(2, '0')} label="Multi-Vector Difficulty Analysis" />
        </div>
    );
}

/**
 * PAGE 05: Complexity Ladder
 */
export function ComplexityLadderPage({ data, page, total }: PageProps) {
    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-12 pb-3 border-b border-slate-800">Complexity Scrutiny</h2>
            <div className="flex-1">
                <div className="grid grid-cols-3 gap-12 mt-8">
                    {data.difficulty.map((d, i) => (
                        <div key={i} className="text-center space-y-8 p-10 bg-slate-800/20 border border-slate-700/30 rounded-[3rem]">
                            <div className="text-[10px] font-black uppercase tracking-[.4em] text-slate-500">{d.level}</div>
                            <div className="text-7xl font-black text-white leading-none tracking-tighter">
                                {d.accuracy}%
                                <div className="h-1 w-12 bg-indigo-500 mx-auto mt-4 rounded-full" />
                            </div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                Data: {d.attempts} Instances
                            </p>
                        </div>
                    ))}
                </div>
            </div>
            <PdfFooter page={page.toString().padStart(2, '0')} total={total.toString().padStart(2, '0')} label="Scaling Accuracy Coefficients" />
        </div>
    );
}

/**
 * PAGE 06: Appendix Identification
 */
export function AppendixCoverPage({ page, total }: { page: number; total: number }) {
    return (
        <div className="h-full flex flex-col justify-center items-center text-center bg-[#0B1220]">
            <div className="w-16 h-1 bg-indigo-500 mb-12 rounded-full" />
            <h2 className="text-[12rem] font-black uppercase tracking-tighter leading-none text-white opacity-10 absolute -z-10">AUDIT</h2>
            <h2 className="text-8xl font-black uppercase tracking-tighter text-white mb-4">Appendix</h2>
            <p className="text-lg font-bold uppercase tracking-[.6em] text-indigo-400">Universal Audit Log</p>
            <div className="w-16 h-1 bg-indigo-500 mt-12 rounded-full" />

            <div className="mt-20 max-w-sm text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose">
                RAW TELEMETRY RECORD FOR CROSS-VERIFICATION OF NEURAL ANALYSIS ACCURACY
            </div>
            <PdfFooter page={page.toString().padStart(2, '0')} total={total.toString().padStart(2, '0')} label="Evidence Node Root" />
        </div>
    );
}

/**
 * PAGE 07+: Question Registry (Portrait)
 */
export function QuestionAuditPage({ questions, page, total, offset }: { questions: QuestionRow[]; page: number; total: number; offset: number }) {
    return (
        <div className="h-full flex flex-col bg-white !text-black p-0">
            <header className="flex justify-between items-end border-b-4 border-black pb-4 mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Registry : Log {page < 10 ? `0${page}` : page}</h2>
                <span className="text-[10px] font-black uppercase tracking-widest">Evidence Node</span>
            </header>

            <div className="flex-1">
                <table className="w-full text-left table-fixed">
                    <thead className="border-b-2 border-black">
                        <tr>
                            <th className="py-3 px-2 text-[10px] font-black uppercase w-8">#</th>
                            <th className="py-3 px-4 text-[10px] font-black uppercase">Cognitive Segment</th>
                            <th className="py-3 px-2 text-[10px] font-black uppercase w-20 text-center">Vector</th>
                            <th className="py-3 px-2 text-[10px] font-black uppercase w-16 text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {questions.map((q, i) => (
                            <tr key={i} className="border-b border-slate-100 h-16">
                                <td className="px-2 text-[10px] font-black text-slate-300">{offset + i + 1}</td>
                                <td className="px-4">
                                    <div className="text-[10px] font-bold text-black leading-tight truncate mb-1">{q.text}</div>
                                    <div className="flex gap-4 items-center">
                                        <div className={cn(
                                            "px-1.5 py-0.5 rounded text-[8px] font-black uppercase",
                                            q.isCorrect ? "bg-black text-white" : "bg-slate-200 text-slate-500"
                                        )}>
                                            {q.isCorrect ? 'VALID' : 'INVALID'}
                                        </div>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase truncate">
                                            {q.userAnswer || 'NO_RESPONSE'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-2 text-center">
                                    <span className="text-[9px] font-black uppercase text-slate-500">{q.difficulty || 'STD'}</span>
                                </td>
                                <td className="px-2 text-right">
                                    <span className="text-[10px] font-black">{q.timeSpent || 0}s</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <footer className="mt-8 pt-4 border-t border-slate-100 flex justify-between text-[9px] font-black uppercase text-slate-400">
                <div>AUDIT EVIDENCE LOG</div>
                <div>EXHIBIT {page.toString().padStart(2, '0')} OF {total.toString().padStart(2, '0')}</div>
            </footer>
        </div>
    );
}

/**
 * REUSABLE FOOTER
 */
function PdfFooter({ page, total, label }: { page: string; total: string; label: string }) {
    return (
        <footer className="pdf-footer flex justify-between items-end text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 border-t border-slate-800 pt-6 mt-auto">
            <div>{label}</div>
            <div className="text-zinc-400">Page {page} / {total}</div>
        </footer>
    );
}
