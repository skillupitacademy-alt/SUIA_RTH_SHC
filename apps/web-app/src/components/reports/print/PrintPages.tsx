"use client";

import { ExamReport } from "@/components/reports/ExamReportLayout";
import { cn } from "@/lib/utils";

interface PageProps {
    data: ExamReport;
}

/* 
 * Each page is wrapped in a flex-col h-full. 
 * Parent .pdf-page provides the rigid 210mm height.
 */

export function ExecutiveSummaryPage({ data }: PageProps) {
    return (
        <div className="h-full flex flex-col justify-between">
            <div>
                <header className="flex justify-between items-start border-b-4 border-black pb-8 mb-12">
                    <div>
                        <h1 className="text-6xl font-black uppercase tracking-tighter">Diagnostic Intelligence</h1>
                        <p className="text-xl font-bold uppercase tracking-[0.2em] text-slate-500 mt-2">Executive Analytics Summary</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black uppercase tracking-widest">{data.completedAt ? new Date(data.completedAt).toLocaleDateString() : 'N/A'}</p>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: {data.examId.slice(0, 12)}</p>
                    </div>
                </header>

                <section className="grid grid-cols-2 gap-16">
                    <div className="space-y-12">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 mb-4 text-left">Core Performance</h2>
                            <div className="flex items-baseline gap-4">
                                <span className="text-9xl font-black">{data.score}%</span>
                                <span className="text-2xl font-bold text-slate-400 uppercase">Mastery</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="border-l-4 border-slate-200 pl-6">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
                                <p className="text-2xl font-black uppercase">{data.ai?.status || 'READY'}</p>
                            </div>
                            <div className="border-l-4 border-slate-200 pl-6">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Readiness</p>
                                <p className="text-2xl font-black uppercase">{data.readiness}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-10 rounded-3xl border-2 border-slate-100">
                        <h3 className="text-sm font-black uppercase tracking-widest mb-6">Strategic Insights</h3>
                        <ul className="space-y-4">
                            {data.ai?.actions?.slice(0, 4).map((action, i) => (
                                <li key={i} className="flex gap-4 text-sm leading-relaxed text-slate-800">
                                    <span className="font-black text-slate-300">0{i + 1}</span>
                                    {action}
                                </li>
                            )) || <li className="text-slate-400">Baseline diagnostic complete.</li>}
                        </ul>
                    </div>
                </section>
            </div>

            <footer className="flex justify-between items-end text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-t border-slate-100 pt-8">
                <div>Proprietary Information — High Fidelity Asset</div>
                <div>Page 01 / 07</div>
            </footer>
        </div>
    );
}

export function SubtopicAccuracyPage({ data }: PageProps) {
    return (
        <div className="h-full flex flex-col justify-between">
            <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-12">Subtopic Distribution</h2>
                <div className="grid grid-cols-1 gap-6">
                    {data.subtopics.map((st, i) => (
                        <div key={i} className="flex items-center gap-6">
                            <div className="w-64 text-xs font-black uppercase tracking-widest text-slate-600 truncate text-left">{st.name}</div>
                            <div className="flex-1 h-10 bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200">
                                <div
                                    className="h-full bg-black"
                                    style={{ width: `${st.accuracy}%` }}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                                    {st.accuracy}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <footer className="flex justify-between items-end text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-t border-slate-100 pt-8">
                <div>Neural Diagnostic Breakdown</div>
                <div>Page 02 / 07</div>
            </footer>
        </div>
    );
}

export function SubjectBreakdownPage({ data }: PageProps) {
    return (
        <div className="h-full flex flex-col justify-between">
            <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-12">Temporal Analytics</h2>
                <div className="grid grid-cols-2 gap-20">
                    <div className="space-y-12">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8 text-left">Efficiency Pulse</h3>
                            <div className="flex items-baseline gap-4">
                                <span className="text-8xl font-black">{Math.round(data.totalTimeSpentSeconds / 60)}</span>
                                <span className="text-xl font-bold uppercase tracking-widest text-slate-400">Minutes</span>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {[
                                { label: 'Fast Count', val: data.timeBuckets?.stable || 0 },
                                { label: 'Optimal Count', val: data.timeBuckets?.logic || 0 },
                                { label: 'Extended Count', val: data.timeBuckets?.neural || 0 }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between border-b-2 border-slate-100 pb-3">
                                    <span className="text-xs font-black uppercase text-slate-500">{item.label}</span>
                                    <span className="text-lg font-black">{item.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white p-14 rounded-[3rem] flex flex-col justify-center border-4 border-indigo-900/20">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-indigo-400 mb-10 text-center">Velocity Pattern</h3>
                        <div className="text-center">
                            <p className="text-6xl font-black uppercase mb-6">{data.timeEfficiency || 'OPTIMAL'}</p>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.1em] leading-relaxed max-w-xs mx-auto">
                                {data.timePattern || "Standard response pattern observed across all difficulty vectors."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <footer className="flex justify-between items-end text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-t border-slate-100 pt-8">
                <div>Temporal Metadata Synthesis</div>
                <div>Page 03 / 07</div>
            </footer>
        </div>
    );
}

export function NeuralHeatmapPage({ data }: PageProps) {
    return (
        <div className="h-full flex flex-col justify-between">
            <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-10">Cognitive Heatmap</h2>
                <div className="border-4 border-slate-100 rounded-[2rem] overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b-2 border-slate-200">
                            <tr>
                                <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Subtopic</th>
                                {['Novice', 'Intermediate', 'Expert'].map(l => (
                                    <th key={l} className="p-6 text-xs font-black uppercase tracking-widest text-center text-slate-400">{l}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.subtopics.slice(0, 7).map((st, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    <td className="p-6 text-xs font-black uppercase tracking-widest bg-slate-50/50">{st.name}</td>
                                    {['Novice', 'Intermediate', 'Expert'].map(level => {
                                        const cell = data.heatmap.find(h => h.subtopic === st.name && h.difficulty === level);
                                        const accuracy = cell?.accuracy || 0;
                                        return (
                                            <td key={level} className="p-2">
                                                <div className={cn(
                                                    "h-14 rounded-xl flex items-center justify-center text-xs font-black transition-none border-2",
                                                    accuracy >= 80 ? "bg-black text-white border-black" :
                                                        accuracy >= 50 ? "bg-slate-300 text-white border-slate-300" :
                                                            accuracy > 0 ? "bg-slate-100 text-black border-slate-200" : "bg-white text-slate-200 border-slate-50"
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
            <footer className="flex justify-between items-end text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-t border-slate-100 pt-8">
                <div>Multi-Vector Difficulty Analysis</div>
                <div>Page 04 / 07</div>
            </footer>
        </div>
    );
}

export function ComplexityLadderPage({ data }: PageProps) {
    return (
        <div className="h-full flex flex-col justify-between">
            <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-16">Complexity Matrix</h2>
                <div className="grid grid-cols-3 gap-16 px-10">
                    {data.difficulty.map((d, i) => (
                        <div key={i} className="text-center space-y-8">
                            <div className="text-xs font-black uppercase tracking-[0.5em] text-slate-400">{d.level}</div>
                            <div className="flex flex-col items-center">
                                <span className="text-8xl font-black leading-tight border-b-8 border-black">{d.accuracy || 0}%</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Sample size: {d.attempts} challenges
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <footer className="flex justify-between items-end text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-t border-slate-100 pt-8">
                <div>Scaling Accuracy Coefficients</div>
                <div>Page 05 / 07</div>
            </footer>
        </div>
    );
}

export function AppendixCoverPage({ data }: PageProps) {
    void data;
    return (
        <div className="h-full flex flex-col justify-between items-center py-20">
            <div />
            <div className="text-center relative">
                <div className="w-32 h-1 bg-black mx-auto mb-16" />
                <h2 className="text-[10rem] font-black uppercase tracking-tighter leading-none mb-6">Appendix</h2>
                <p className="text-2xl font-bold uppercase tracking-[0.8em] text-slate-400">Raw Audit Log</p>
                <div className="w-32 h-1 bg-black mx-auto mt-16" />
            </div>
            <footer className="w-full flex justify-between items-end text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-t border-slate-100 pt-8">
                <div>Neural Diagnostic Evidence</div>
                <div>Page 06 / 07</div>
            </footer>
        </div>
    );
}

export function QuestionAuditPage({ data }: PageProps) {
    /* 
     * Uniformity: Audit log is now LANDSCAPE to match Section 1.
     * Prevents orientation crash and gives more room for text.
     */
    return (
        <div className="pdf-page landscape">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-10 border-b-4 border-black pb-4">Challenge Registry</h2>
            <table className="w-full text-left">
                <thead className="border-b-2 border-slate-300">
                    <tr>
                        <th className="py-4 pr-6 text-xs font-black uppercase tracking-widest w-16 text-slate-400">#</th>
                        <th className="py-4 pr-6 text-xs font-black uppercase tracking-widest text-slate-400">Question Segment</th>
                        <th className="py-4 pr-6 text-xs font-black uppercase tracking-widest text-center w-32 text-slate-400">Vector</th>
                        <th className="py-4 text-xs font-black uppercase tracking-widest text-right w-24 text-slate-400">Time</th>
                    </tr>
                </thead>
                <tbody>
                    {(data.questions || []).slice(0, 10).map((q, i) => (
                        <tr key={i} className="border-b border-slate-100 align-top">
                            <td className="py-6 pr-6 text-xs font-black text-slate-200">{(i + 1).toString().padStart(2, '0')}</td>
                            <td className="py-6 pr-6">
                                <div className="text-sm font-bold text-slate-900 leading-relaxed mb-3 text-left">{q.text}</div>
                                <div className="flex gap-6 items-center">
                                    <div className={cn(
                                        "px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                                        q.isCorrect ? "bg-black text-white" : "bg-slate-200 text-slate-500"
                                    )}>
                                        {q.isCorrect ? 'VALID' : 'INVALID'}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Answer: <span className="text-slate-600">{q.userAnswer || 'NO RESPONSE'}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="py-6 pr-6 text-center">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{q.difficulty || 'STD'}</span>
                            </td>
                            <td className="py-6 text-right">
                                <span className="text-xs font-black text-slate-900">{q.timeSpent || 0}s</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <footer className="absolute bottom-10 left-20 right-20 flex justify-between items-end text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                <div>End of Document — Challenge Registry</div>
                <div>Page 07 / 07</div>
            </footer>
        </div>
    );
}
