import React from 'react';
import { BRAIN_LOG_DATA } from '@/lib/governance-inventory';

export function BrainLogViewer() {
    return (
        <div className="space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            {/* 1. Brain Log: Documentation Restructuring – Overview */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Brain Log: Overview <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(The Audit Trail)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Attribute</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {BRAIN_LOG_DATA.overview.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-700 text-sm italic">{item.attribute}</td>
                                    <td className="px-10 py-6 font-bold text-slate-500">{item.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 2. Actions Taken (Consolidation Summary) */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Actions Taken <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(Consolidation Summary)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Batch</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Action</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Files Created</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Files Merged / Deleted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {BRAIN_LOG_DATA.batches.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-700 text-lg">{item.batch}</td>
                                    <td className="px-10 py-6 font-bold text-slate-600 italic text-sm">{item.action}</td>
                                    <td className="px-10 py-6">
                                        {item.created !== '—' ? (
                                            <code className="px-3 py-1 bg-slate-100 text-[#FF4B91] text-[10px] font-bold rounded-md">
                                                {item.created}
                                            </code>
                                        ) : (
                                            <span className="text-slate-300 font-bold">—</span>
                                        )}
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex flex-wrap gap-2">
                                            {item.merged.split(',').map((file, fIdx) => (
                                                <code key={fIdx} className="px-2 py-1 bg-[#1A1A1A]/5 text-[#1A1A1A] text-[10px] font-black rounded uppercase tracking-tight">
                                                    {file.trim()}
                                                </code>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 3. Impact & Outcomes */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Impact & Outcomes <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(Efficiency Gains)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Metric</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Result</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {BRAIN_LOG_DATA.impact.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-700 text-sm italic">{item.metric}</td>
                                    <td className="px-10 py-6 font-bold text-slate-500">{item.result}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 4. Future Usage Guidelines */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Future Usage Guidelines <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(Navigation Key)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Task Type</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Start With</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Reference For</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {BRAIN_LOG_DATA.futureUsage.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-700 text-sm italic">{item.type}</td>
                                    <td className="px-10 py-6">
                                        <code className="px-3 py-1 bg-slate-100 text-[#FF4B91] text-[10px] font-bold rounded-md uppercase">
                                            {item.start}
                                        </code>
                                    </td>
                                    <td className="px-10 py-6 text-sm font-bold text-slate-500 italic">{item.reference}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 5. Final Structure Summary */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Final Structure Summary <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(Folder Intent)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Folder</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Purpose</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {BRAIN_LOG_DATA.structureSummary.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6">
                                        <code className="px-3 py-1 bg-slate-100 text-[#FF4B91] text-[11px] font-bold rounded-md">
                                            {item.folder}
                                        </code>
                                    </td>
                                    <td className="px-10 py-6 text-sm font-black text-slate-700 tracking-tight uppercase">{item.purpose}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                    End of Architectural Audit // 100% Normalized Data // Antigravity Core
                </p>
            </div>
        </div>
    );
}
