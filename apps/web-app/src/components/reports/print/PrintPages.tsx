"use client";

import { ExamReport } from "@/components/reports/ExamReportLayout";
import { cn } from "@/lib/utils";

interface PageProps {
    data: ExamReport;
}

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
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Core Performance</h2>
                            <div className="flex items-baseline gap-4">
                                <span className="text-9xl font-black leading-none">{data.score}%</span>
                                <span className="text-2xl font-bold text-slate-400 uppercase">Mastery</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="border-l-4 border-slate-200 pl-6">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
                                <p className="text-2xl font-black uppercase">{data.ai?.status || 'Unknown'}</p>
                            </div>
                            <div className="border-l-4 border-slate-200 pl-6">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Readiness</p>
                                <p className="text-2xl font-black uppercase">{data.readiness}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-10 rounded-3xl border-2 border-slate-100 h-fit">
                        <h3 className="text-sm font-black uppercase tracking-widest mb-6">Strategic Insights</h3>
                        <ul className="space-y-4">
                            {data.ai?.actions?.slice(0, 4).map((action, i) => (
                                <li key={i} className="flex gap-4 text-sm leading-relaxed text-slate-800">
                                    <span className="font-black text-slate-300">0{i + 1}</span>
                                    {action}
                                </li>
                            ))}
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
                <div className="grid grid-cols-1 gap-4">
                    {data.subtopics.map((st, i) => (
                        <div key={i} className="flex items-center gap-6">
                            <div className="w-48 text-xs font-black uppercase tracking-widest text-slate-600 truncate">{st.name}</div>
                            <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                                <div
                                    className="h-full bg-black transition-none"
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
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Efficiency Pulse</h3>
                            <div className="flex items-baseline gap-4">
                                <span className="text-7xl font-black">{Math.round(data.totalTimeSpentSeconds / 60)}</span>
                                <span className="text-xl font-bold uppercase tracking-widest text-slate-400">Minutes</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black uppercase text-slate-500">Fast Count</span>
                                <span className="text-sm font-black">{data.timeBuckets?.stable || 0}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black uppercase text-slate-500">Optimal Count</span>
                                <span className="text-sm font-black">{data.timeBuckets?.logic || 0}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black uppercase text-slate-500">Extended Count</span>
                                <span className="text-sm font-black">{data.timeBuckets?.neural || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white p-12 rounded-[3rem]">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-8 text-center">Velocity Pattern</h3>
                        <div className="text-center">
                            <p className="text-5xl font-black uppercase mb-4">{data.timeEfficiency}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
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
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-12">Cognitive Heatmap</h2>
                <div className="border border-slate-200 rounded-3xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest">Subtopic</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Novice</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Intermediate</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Expert</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.subtopics.slice(0, 8).map((st, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    <td className="p-6 text-xs font-black uppercase tracking-widest">{st.name}</td>
                                    {['Novice', 'Intermediate', 'Expert'].map(level => {
                                        const cell = data.heatmap.find(h => h.subtopic === st.name && h.difficulty === level);
                                        const accuracy = cell?.accuracy || 0;
                                        return (
                                            <td key={level} className="p-2 text-center">
                                                <div className={cn(
                                                    "w-full h-12 rounded-lg flex items-center justify-center text-[10px] font-black",
                                                    accuracy >= 80 ? "bg-black text-white" :
                                                        accuracy >= 50 ? "bg-slate-400 text-white" :
                                                            accuracy > 0 ? "bg-slate-200 text-black" : "bg-slate-50 text-slate-300"
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
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-12">Complexity Matrix</h2>
                <div className="grid grid-cols-3 gap-12">
                    {data.difficulty.map((d, i) => (
                        <div key={i} className="space-y-6">
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{d.level}</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-7xl font-black">{d.accuracy || 0}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-black" style={{ width: `${d.accuracy || 0}%` }} />
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
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
    void data; // data unused on cover, retained for consistent signature
    return (
        <div className="h-full flex flex-col justify-center items-center text-center">
            <div className="w-24 h-[1px] bg-slate-200 mb-12" />
            <h2 className="text-8xl font-black uppercase tracking-tighter mb-4">Appendix</h2>
            <p className="text-xl font-bold uppercase tracking-[0.5em] text-slate-400 mb-12">Raw Audit Log</p>
            <div className="w-24 h-[1px] bg-slate-200" />

            <div className="absolute bottom-20 left-20 right-20 flex justify-between items-end text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                <div>Neural Diagnostic Evidence</div>
                <div>Page 06 / 07</div>
            </div>
        </div>
    );
}

export function QuestionAuditPage({ data }: PageProps) {
    // Audit table in portrait, needs auto pagination.
    // Puppeteer handles page breaks naturally if we use the right CSS.
    return (
        <div className="pdf-page portrait">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b-2 border-slate-200 pb-4">Challenge Registry</h2>
            <table className="w-full text-left">
                <thead className="border-b-2 border-black">
                    <tr>
                        <th className="py-4 pr-4 text-[9px] font-black uppercase tracking-widest w-12">#</th>
                        <th className="py-4 pr-4 text-[9px] font-black uppercase tracking-widest">Question Segment</th>
                        <th className="py-4 pr-4 text-[9px] font-black uppercase tracking-widest text-center w-24">Vector</th>
                        <th className="py-4 text-[9px] font-black uppercase tracking-widest text-right w-20">Time</th>
                    </tr>
                </thead>
                <tbody>
                    {(data.questions || []).map((q, i) => (
                        <tr key={i} className="border-b border-slate-100 align-top">
                            <td className="py-6 pr-4 text-[9px] font-black text-slate-300">{(i + 1).toString().padStart(2, '0')}</td>
                            <td className="py-6 pr-4">
                                <div className="text-[11px] font-bold text-slate-800 leading-relaxed mb-2">{q.text}</div>
                                <div className="flex gap-4">
                                    <div className={cn(
                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                        q.isCorrect ? "bg-black text-white" : "bg-slate-200 text-slate-500"
                                    )}>
                                        {q.isCorrect ? 'VALID' : 'INVALID'}
                                    </div>
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        Answer: {q.userAnswer || 'SKIP'}
                                    </div>
                                </div>
                            </td>
                            <td className="py-6 pr-4 text-center">
                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{q.difficulty || 'STD'}</span>
                            </td>
                            <td className="py-6 text-right">
                                <span className="text-[9px] font-black">{q.timeSpent || 0}s</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <footer className="absolute bottom-10 left-10 right-10 flex justify-between items-end text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">
                <div>End of Document — Challenge Registry</div>
                <div>Page 07 / 07</div>
            </footer>
        </div>
    );
}
