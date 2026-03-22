import React from 'react';

import { ARCHITECTURE_DATA } from '@/lib/governance-inventory';

export function ArchitectureViewer() {
    return (
        <div className="space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            {/* 1. Runtime Engine Architecture */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                        Runtime Engines <span className="text-[#FF4B91] font-medium text-sm tracking-[0.2em] ml-4">(Internal Logic Layer)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Engine</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Operational Purpose</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ARCHITECTURE_DATA.runtimeEngines.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-700 text-sm">{item.engine}</td>
                                    <td className="px-10 py-6 font-bold text-slate-500">{item.purpose}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 2. Database Schema Code Mapping */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                        Structural Layout <span className="text-[#FF4B91] font-medium text-sm tracking-[0.2em] ml-4">(Monorepo Pattern)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">File</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Layer</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Domain Intent</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ARCHITECTURE_DATA.schemaMapping.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6">
                                        <code className="px-3 py-1 bg-slate-100 text-[#FF4B91] text-[10px] font-bold rounded-md uppercase">
                                            {item.file}
                                        </code>
                                    </td>
                                    <td className="px-10 py-6 font-black text-slate-700 text-sm">{item.tables}</td>
                                    <td className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-tight">{item.intent}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 3. Scoring Logic & Admin Coverage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                        <h2 className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                            Scoring Calculation
                        </h2>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                        <div className="divide-y divide-slate-100">
                            {ARCHITECTURE_DATA.scoringLogic.map((item, idx) => (
                                <div key={idx} className="px-10 py-6 hover:bg-slate-50 transition-colors">
                                    <div className="text-[10px] font-black text-[#FF4B91] uppercase tracking-[0.2em] mb-1">{item.metric}</div>
                                    <div className="text-sm font-bold text-slate-600 font-mono">{item.logic}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                        <h2 className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                            Admin Coverage
                        </h2>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                        <div className="divide-y divide-slate-100">
                            {ARCHITECTURE_DATA.adminCoverage.map((item, idx) => (
                                <div key={idx} className="px-10 py-6 hover:bg-slate-50 transition-colors flex gap-6 items-start">
                                    <div className="w-1.5 h-10 bg-slate-100 shrink-0" />
                                    <div>
                                        <div className="text-sm font-black text-slate-700 uppercase tracking-tight">{item.panel}</div>
                                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-tight">{item.tables}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
