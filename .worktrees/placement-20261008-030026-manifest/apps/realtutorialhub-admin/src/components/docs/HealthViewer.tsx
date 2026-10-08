import React from 'react';

import { HEALTH_DATA } from '@/lib/governance-inventory';

export function HealthViewer() {
    return (
        <div className="space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            {/* 1. Build Stability Audit */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                        Vercel Health Edge <span className="text-[#FF4B91] font-medium text-sm tracking-[0.2em] ml-4">(Monitoring Hooks)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {HEALTH_DATA.buildStability.map((item, idx) => (
                            <div key={idx} className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                                    <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.item}</div>
                                <div className="text-sm font-black text-slate-700">{item.status}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 2. Implementation Audit Matrix */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                        Health Thresholds <span className="text-[#FF4B91] font-medium text-sm tracking-[0.2em] ml-4">(SLA Targets)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Layer</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Status</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Audit Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {HEALTH_DATA.implementationAudit.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-700 text-sm">{item.layer}</td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-24">
                                                <div
                                                    className="h-full bg-[#FF4B91] rounded-full"
                                                    style={{ width: item.status }}
                                                />
                                            </div>
                                            <span className="text-xs font-black text-slate-700">{item.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 font-bold text-slate-500 text-sm">{item.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 3. Risk Mitigation */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                        Risk Control <span className="text-[#FF4B91] font-medium text-sm tracking-[0.2em] ml-4">(Mitigation Matrix)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Identified Risk</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Mitigation Strategy</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {HEALTH_DATA.risks.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-700 text-sm">{item.risk}</td>
                                    <td className="px-10 py-6 font-bold text-[#FF4B91] text-sm uppercase tracking-tight">{item.mitigation}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
