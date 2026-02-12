/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { INFRA_DATA } from '@/lib/governance-inventory';

export function InfraViewer() {
    return (
        <div className="space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            {/* 1. Infrastructure Architecture */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                        Infrastructure Spec <span className="text-[#FF4B91] font-medium text-sm tracking-[0.2em] ml-4">(Vercel Monorepo)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Project</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Root Directory</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Framework</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {INFRA_DATA.deployment.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-700 text-sm">{item.project}</td>
                                    <td className="px-10 py-6">
                                        <code className="px-3 py-1 bg-slate-100 text-[#FF4B91] text-[10px] font-bold rounded-md">
                                            {item.root}
                                        </code>
                                    </td>
                                    <td className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">{item.framework}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 2. Configuration Inventory */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                        Config Inventory <span className="text-[#FF4B91] font-medium text-sm tracking-[0.2em] ml-4">(Stability Keys)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">File</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Operational Purpose</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {INFRA_DATA.configInventory.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6">
                                        <code className="px-3 py-1 bg-[#1A1A1A]/5 text-[#1A1A1A] text-[10px] font-black rounded uppercase">
                                            {item.file}
                                        </code>
                                    </td>
                                    <td className="px-10 py-6 font-bold text-slate-500 text-sm">{item.purpose}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 3. Environment Detection */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                        Environment Rules <span className="text-[#FF4B91] font-medium text-sm tracking-[0.2em] ml-4">(Auto-Detection)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {INFRA_DATA.envConfig.map((item: any, idx) => (
                            <div key={idx} className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100">
                                <div className="text-[10px] font-black text-[#FF4B91] uppercase tracking-widest mb-2">{item.Detection}</div>
                                <div className="text-sm font-bold text-slate-600 truncate">{item.Link || item.Status}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
