import React from 'react';
import { TASK_HISTORY_DATA, CURRENT_TASK_DATA } from '@/lib/governance-inventory';
import { History, Activity, CheckCircle2, Clock, Terminal } from 'lucide-react';

interface LogViewerProps {
    type: 'history' | 'current';
}

export function LogViewer({ type }: LogViewerProps) {
    if (type === 'current') {
        return (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                        <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                            Current_Task_Log <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(Real-time Session)</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Status Guard */}
                        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-2xl shadow-primary/5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-[#FF4B91]" />
                            <div className="flex flex-col items-center text-center gap-6">
                                <div className="h-20 w-20 rounded-full bg-[#FF4B91]/5 flex items-center justify-center text-[#FF4B91]">
                                    <Activity size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-[#1A1A1A] italic uppercase tracking-tighter">System_Status</h3>
                                    <div className="mt-4 px-6 py-2 rounded-full bg-slate-50 border border-slate-100 text-[#FF4B91] text-xs font-black uppercase tracking-[0.3em]">
                                        {CURRENT_TASK_DATA.status}
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                    The agent is currently awaiting new high-level directives from the governance layer.
                                </p>
                            </div>
                        </div>

                        {/* Activity Stream */}
                        <div className="lg:col-span-2 bg-[#1A1A1A] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Terminal size={120} className="text-white" />
                            </div>
                            <h3 className="text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.4em] mb-8">Active_Directives</h3>
                            <div className="space-y-4">
                                {CURRENT_TASK_DATA.items.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                        <div className="mt-1">
                                            <CheckCircle2 size={16} className="text-[#FF4B91]" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-300 tracking-tight leading-relaxed">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Task_History_Log <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(Audit Trail)</span>
                    </h2>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em] w-32">Entry_Date</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Operation</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em] w-32">Status</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Summary</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {TASK_HISTORY_DATA.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock size={12} />
                                            <span className="text-[11px] font-black tracking-tighter">{item.date}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <h4 className="text-sm font-black text-[#1A1A1A] uppercase tracking-tight group-hover:text-[#FF4B91] transition-colors">
                                            {item.task.replace(/\s/g, '_')}
                                        </h4>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className="px-3 py-1 bg-green-50 border border-green-100 text-green-600 text-[9px] font-black uppercase tracking-widest rounded-lg">
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 p-max-w-md">
                                        <p className="text-xs font-bold text-slate-500 italic max-w-sm leading-relaxed">
                                            "{item.summary}"
                                        </p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="flex justify-center p-10">
                <div className="px-8 py-3 bg-slate-50 border border-slate-100 rounded-full flex items-center gap-3">
                    <History size={14} className="text-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">End of Audit Trail // AntiGravity Core</span>
                </div>
            </div>
        </div>
    );
}
