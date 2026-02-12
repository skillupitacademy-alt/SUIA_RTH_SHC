import React from 'react';
import { JOURNEY_DATA } from '@/lib/governance-inventory';

export function JourneyViewer() {
    return (
        <div className="space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            {/* 1. Page Contracts Index */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                        Journey Index <span className="text-[#FF4B91] font-medium text-sm tracking-[0.2em] ml-4">(Page Contracts)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Journey</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Technical Path</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Mandatory Content</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {JOURNEY_DATA.folders.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-700 text-lg">{item.journey}</td>
                                    <td className="px-10 py-6">
                                        <code className="px-3 py-1 bg-slate-100 text-[#FF4B91] text-[10px] font-bold rounded-md uppercase">
                                            {item.path}
                                        </code>
                                    </td>
                                    <td className="px-10 py-6 font-bold text-slate-500 text-sm">{item.content}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center">
                <p className="text-slate-400 text-sm font-bold">
                    &quot;Documentation defines truth. All page journeys must strictly comply with the UX Baseline.&quot;
                </p>
            </div>
        </div>
    );
}
