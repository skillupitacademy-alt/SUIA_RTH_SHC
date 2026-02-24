"use client";

import { ExamReport } from "@/components/reports/ExamReportLayout";
import { cn } from "@/lib/utils";

interface PageProps {
    data: ExamReport;
}

/**
 * PDF PAGE MODEL (Landscape Only)
 * Dimensions: 297mm x 210mm
 * Padding: 12mm (Enforced by globals.css)
 */

export function ExecutiveSummaryPage({ data }: PageProps) {
    return (
        <div className="h-full flex flex-col justify-between">
            <div className="flex-1">
                <header className="pdf-header flex justify-between items-start border-b-4 border-black pb-6 mb-8">
                    <div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter">Diagnostic Intelligence</h1>
                        <p className="text-lg font-bold uppercase tracking-[0.2em] text-slate-500 mt-1">Executive Analytics Summary</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-black uppercase tracking-widest">{data.completedAt ? new Date(data.completedAt).toLocaleDateString() : 'N/A'}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ref: {data.examId.slice(0, 12)}</p>
                    </div>
                </header>

                <section className="grid grid-cols-2 gap-12">
                    <div className="space-y-10">
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-3">Core Performance</h2>
                            <div className="flex items-baseline gap-3">
                                <span className="text-8xl font-black leading-none">{data.score}%</span>
                                <span className="text-xl font-bold text-slate-400 uppercase">Mastery</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="border-l-4 border-slate-200 pl-5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
                                <p className="text-xl font-black uppercase">{data.ai?.status || 'READY'}</p>
                            </div>
                            <div className="border-l-4 border-slate-200 pl-5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Readiness</p>
                                <p className="text-xl font-black uppercase">{data.readiness}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
                        <h3 className="text-xs font-black uppercase tracking-widest mb-4">Strategic Insights</h3>
                        <ul className="space-y-3">
                            {data.ai?.actions?.slice(0, 4).map((action, i) => (
                                <li key={i} className="flex gap-3 text-xs leading-relaxed text-slate-800">
                                    <span className="font-black text-slate-300">0{i + 1}</span>
                                    {action}
                                </li>
                            )) || <li className="text-slate-400">Baseline diagnostic complete.</li>}
                        </ul>
                    </div>
                </section>
            </div>

            <footer className="pdf-footer flex justify-between items-end text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-t border-slate-100 pt-6">
                <div>Proprietary Information — Diagnostic Asset</div>
                <div>Page 01 / 07</div>
            </footer>
        </div>
    );
}

export function SubtopicAccuracyPage({ data }: PageProps) {
    return (
        <div className="h-full flex flex-col justify-between">
            <div className="flex-1">
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 pb-3 border-b-2 border-slate-100">Subtopic Distribution</h2>
                <div className="grid grid-cols-1 gap-5">
                    {data.subtopics.map((st, i) => (
                        <div key={i} className="flex items-center gap-5">
                            <div className="w-56 text-[10px] font-black uppercase tracking-widest text-slate-600 truncate">{st.name}</div>
                            <div className="flex-1 h-8 bg-slate-100 rounded overflow-hidden relative border border-slate-200">
                                <div className="h-full bg-black transition-none" style={{ width: `${st.accuracy}%` }} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">{st.accuracy}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <footer className="pdf-footer flex justify-between items-end text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-t border-slate-100 pt-6">
                <div>Neural Diagnostic Breakdown</div>
                <div>Page 02 / 07</div>
            </footer>
        </div>
    );
}

export function SubjectBreakdownPage({ data }: PageProps) {
    return (
        <div className="h-full flex flex-col justify-between">
            <div className="flex-1">
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 pb-3 border-b-2 border-slate-100">Temporal Analytics</h2>
                <div className="grid grid-cols-2 gap-16">
                    <div className="space-y-10">
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Efficiency Pulse</h3>
                            <div className="flex items-baseline gap-4">
                                <span className="text-7xl font-black">{Math.round(data.totalTimeSpentSeconds / 60)}</span>
                                <span className="text-lg font-bold uppercase tracking-widest text-slate-400">Minutes</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Fast Response', val: data.timeBuckets?.stable || 0 },
                                { label: 'Optimal Duration', val: data.timeBuckets?.logic || 0 },
                                { label: 'Extended Logic', val: data.timeBuckets?.neural || 0 }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-[10px] font-black uppercase text-slate-500">{item.label}</span>
                                    <span className="text-base font-black">{item.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] flex flex-col justify-center border-4 border-slate-800">
                        <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-6 text-center">Velocity Pattern</h3>
                        <div className="text-center">
                            <p className="text-4xl font-black uppercase mb-3">{data.timeEfficiency || 'OPTIMAL'}</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                                {data.timePattern || "Standard response pattern observed."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <footer className="pdf-footer flex justify-between items-end text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-t border-slate-100 pt-6">
                <div>Temporal Metadata Synthesis</div>
                <div>Page 03 / 07</div>
            </footer>
        </div>
    );
}

export function NeuralHeatmapPage({ data }: PageProps) {
    return (
        <div className="h-full flex flex-col justify-between">
            <div className="flex-1">
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 pb-3 border-b-2 border-slate-100">Cognitive Heatmap</h2>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Subtopic</th>
                                {['Novice', 'Intermediate', 'Expert'].map(l => (
                                    <th key={l} className="p-4 text-[10px] font-black uppercase tracking-widest text-center text-slate-400">{l}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.subtopics.slice(0, 8).map((st, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    <td className="p-4 text-[10px] font-black uppercase tracking-widest bg-slate-50/30">{st.name}</td>
                                    {['Novice', 'Intermediate', 'Expert'].map(level => {
                                        const cell = data.heatmap.find(h => h.subtopic === st.name && h.difficulty === level);
                                        const accuracy = cell?.accuracy || 0;
                                        return (
                                            <td key={level} className="p-1.5 flex-1">
                                                <div className={cn(
                                                    "h-10 rounded flex items-center justify-center text-[10px] font-black transition-none",
                                                    accuracy >= 80 ? "bg-black text-white" :
                                                        accuracy >= 50 ? "bg-slate-300 text-white" :
                                                            accuracy > 0 ? "bg-slate-100 text-black border border-slate-200" : "bg-white text-slate-200"
                                                )}>
                                                    {accuracy > 0 ? `${accuracy}%` : '-'}
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
            <footer className="pdf-footer flex justify-between items-end text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-t border-slate-100 pt-6">
                <div>Multi-Vector Difficulty Analysis</div>
                <div>Page 04 / 07</div>
            </footer>
        </div>
    );
}

export function ComplexityLadderPage({ data }: PageProps) {
    return (
        <div className="h-full flex flex-col justify-between">
            <div className="flex-1">
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-12 pb-3 border-b-2 border-slate-100">Complexity Matrix</h2>
                <div className="grid grid-cols-3 gap-12 px-6">
                    {data.difficulty.map((d, i) => (
                        <div key={i} className="text-center space-y-6">
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{d.level}</div>
                            <div className="flex flex-col items-center">
                                <span className="text-7xl font-black leading-tight border-b-4 border-black">{d.accuracy || 0}%</span>
                            </div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                Sample size: {d.attempts} challenges
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <footer className="pdf-footer flex justify-between items-end text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-t border-slate-100 pt-6">
                <div>Scaling Accuracy Coefficients</div>
                <div>Page 05 / 07</div>
            </footer>
        </div>
    );
}

export function AppendixCoverPage({ data }: PageProps) {
    void data;
    return (
        <div className="h-full flex flex-col justify-between items-center bg-white">
            <div />
            <div className="text-center">
                <div className="w-24 h-0.5 bg-black mx-auto mb-10" />
                <h2 className="text-9xl font-black uppercase tracking-tighter leading-none mb-4">Appendix</h2>
                <p className="text-xl font-bold uppercase tracking-[0.7em] text-slate-400">Raw Audit Log</p>
                <div className="w-24 h-0.5 bg-black mx-auto mt-10" />
            </div>
            <footer className="w-full flex justify-between items-end text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-t border-slate-100 pt-6">
                <div>Neural Diagnostic Evidence</div>
                <div>Page 06 / 07</div>
            </footer>
        </div>
    );
}

export function QuestionAuditPage({ data }: PageProps) {
    return (
        <div className="pdf-page landscape bg-white">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 pb-2 border-b-4 border-black">Challenge Registry</h2>
            <table className="w-full text-left">
                <thead className="border-b-2 border-slate-300">
                    <tr>
                        <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest w-12 text-slate-400">#</th>
                        <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Question Segment</th>
                        <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest text-center w-24 text-slate-400">Vector</th>
                        <th className="py-3 text-[10px] font-black uppercase tracking-widest text-right w-20 text-slate-400">Time</th>
                    </tr>
                </thead>
                <tbody>
                    {(data.questions || []).map((q, i) => (
                        <tr key={i} className="border-b border-slate-100 align-top">
                            <td className="py-4 pr-4 text-[10px] font-black text-slate-200">{(i + 1).toString().padStart(2, '0')}</td>
                            <td className="py-4 pr-4">
                                <div className="text-[11px] font-bold text-slate-900 leading-snug mb-1.5 text-left">{q.text}</div>
                                <div className="flex gap-4 items-center">
                                    <div className={cn(
                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                        q.isCorrect ? "bg-black text-white" : "bg-slate-200 text-slate-500"
                                    )}>
                                        {q.isCorrect ? 'VALID' : 'INVALID'}
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        Answer: <span className="text-slate-600">{q.userAnswer || 'SKIP'}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="py-4 pr-4 text-center">
                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{q.difficulty || 'STD'}</span>
                            </td>
                            <td className="py-4 text-right">
                                <span className="text-[10px] font-black text-slate-900">{q.timeSpent || 0}s</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <footer className="absolute bottom-6 left-12 right-12 flex justify-between items-end text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 border-t border-slate-50 pt-4">
                <div>End of Document — Challenge Registry</div>
                <div>Page 07 / 07</div>
            </footer>
        </div>
    );
}
