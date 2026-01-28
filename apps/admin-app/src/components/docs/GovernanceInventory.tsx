import React from 'react';
import { FRONTEND_INVENTORY, FOLDER_BREAKDOWN } from '@/lib/governance-inventory';

export function GovernanceInventory() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* 1. Codebase Inventory */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Frontend Inventory <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(New Additions)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#1A1A1A] uppercase tracking-[0.3em]">Journey File</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#1A1A1A] uppercase tracking-[0.3em]">Code Mapped</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {FRONTEND_INVENTORY.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg">
                                                <div className="w-3 h-3 bg-[#FF4B91] rounded-[2px]" />
                                            </div>
                                            <span className="text-sm font-black text-slate-700 tracking-tight">{item.journeyFile}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex flex-wrap gap-2">
                                            {item.codeMapped.split(',').map((tag, tIdx) => (
                                                <span key={tIdx} className="px-3 py-1 bg-slate-100 text-[#FF4B91] text-[10px] font-black rounded-full uppercase tracking-widest border border-slate-200">
                                                    {tag.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 2. Consolidation Report */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Consolidation Report <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(Final Breakdown)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#1A1A1A] uppercase tracking-[0.3em]">Folder</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#1A1A1A] uppercase tracking-[0.3em]">Count</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#1A1A1A] uppercase tracking-[0.3em]">Content Purpose</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {FOLDER_BREAKDOWN.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6">
                                        <span className="px-3 py-1 bg-slate-100 text-slate-800 text-[11px] font-black rounded-lg uppercase tracking-widest border border-slate-200">
                                            {item.folder}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className="text-lg font-black text-[#FF4B91]">{item.count}</span>
                                    </td>
                                    <td className="px-10 py-6 text-sm font-bold text-slate-500 italic">
                                        {item.purpose}
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-[#1A1A1A]/5">
                                <td className="px-10 py-6 font-black uppercase text-xs tracking-widest">Total</td>
                                <td className="px-10 py-6 font-black text-xl text-[#FF4B91]">32</td>
                                <td className="px-10 py-6"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
