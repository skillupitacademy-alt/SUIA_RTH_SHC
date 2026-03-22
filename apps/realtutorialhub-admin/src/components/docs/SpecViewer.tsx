import React from 'react';

import { ADMIN_SPEC_DATA, CORE_SPEC_DATA, UX_SPEC_DATA } from '@/lib/governance-inventory';

interface SpecViewerProps {
    type: 'admin' | 'core' | 'ux';
}

export function SpecViewer({ type }: SpecViewerProps) {
    const title = type === 'admin' ? 'Admin Platform Spec' : type === 'core' ? 'Core Platform Spec' : 'UX Baseline Standards';
    const subtitle = type === 'admin' ? '(The Governance Terminal)' : type === 'core' ? '(The Logic Layer)' : '(The Design System)';

    return (
        <div className="space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            {/* 1. Header Section */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                        {title} <span className="text-[#FF4B91] font-medium text-sm tracking-[0.2em] ml-4">{subtitle}</span>
                    </h2>
                </div>

                {type === 'admin' && (
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                        <table className="w-full divide-y divide-slate-100">
                            <thead className="bg-[#FF4B91]/5">
                                <tr>
                                    <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Module</th>
                                    <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Purpose</th>
                                    <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Logic Layer</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ADMIN_SPEC_DATA.modules.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                        <td className="px-10 py-6 font-black text-slate-700 text-sm">{item.module}</td>
                                        <td className="px-10 py-6 font-bold text-slate-500">{item.purpose}</td>
                                        <td className="px-10 py-6">
                                            <code className="px-3 py-1 bg-slate-100 text-[#FF4B91] text-[10px] font-bold rounded-md">
                                                {item.logic}
                                            </code>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {type === 'core' && (
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                        <table className="w-full divide-y divide-slate-100">
                            <thead className="bg-[#FF4B91]/5">
                                <tr>
                                    <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Core Service</th>
                                    <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Responsibility</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {CORE_SPEC_DATA.authServices.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                        <td className="px-10 py-6 font-black text-slate-700 text-sm">{item.service}</td>
                                        <td className="px-10 py-6 font-bold text-slate-500">{item.responsibility}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {type === 'ux' && (
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                        <table className="w-full divide-y divide-slate-100">
                            <thead className="bg-[#FF4B91]/5">
                                <tr>
                                    <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Breakpoint</th>
                                    <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Width</th>
                                    <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Usage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {UX_SPEC_DATA.breakpoints.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                        <td className="px-10 py-6 font-black text-[#FF4B91] text-sm">{item.prefix}</td>
                                        <td className="px-10 py-6 font-bold text-slate-500">{item.width}</td>
                                        <td className="px-10 py-6 font-black text-slate-700 text-xs uppercase tracking-tight">{item.usage}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* 2. Secondary Tier */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {type === 'admin' && (
                    <>
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                                <h2 className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase">Auth Strategy</h2>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                                <div className="divide-y divide-slate-100">
                                    {ADMIN_SPEC_DATA.authStrategy.map((item, idx) => (
                                        <div key={idx} className="px-10 py-6 hover:bg-slate-50 transition-colors">
                                            <div className="text-[10px] font-black text-[#FF4B91] uppercase tracking-[0.2em] mb-1">{item.layer}</div>
                                            <div className="text-sm font-bold text-slate-600">{item.principle}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                                <h2 className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase">Recovery Flow</h2>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                                <div className="divide-y divide-slate-100">
                                    {ADMIN_SPEC_DATA.recoveryFlow.map((item, idx) => (
                                        <div key={idx} className="px-10 py-6 hover:bg-slate-50 transition-colors flex gap-6 items-start">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-black text-slate-400 shrink-0">{item.step}</div>
                                            <div>
                                                <div className="text-sm font-black text-slate-700 uppercase tracking-tight">{item.action}</div>
                                                <div className="text-[11px] font-black text-[#FF4B91] uppercase">{item.target}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {type === 'core' && (
                    <>
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                                <h2 className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase">Blueprint Rules</h2>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                                <div className="divide-y divide-slate-100">
                                    {CORE_SPEC_DATA.blueprintRules.map((item, idx) => (
                                        <div key={idx} className="px-10 py-6 hover:bg-slate-50 transition-colors">
                                            <div className="text-[10px] font-black text-[#FF4B91] uppercase tracking-[0.2em] mb-1">{item.rule}</div>
                                            <div className="text-sm font-bold text-slate-600 font-mono">{item.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                                <h2 className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase">Nav Enforcement</h2>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                                <div className="divide-y divide-slate-100">
                                    {CORE_SPEC_DATA.navigationEnforcement.map((item, idx) => (
                                        <div key={idx} className="px-10 py-6 hover:bg-slate-50 transition-colors flex gap-6 items-start">
                                            <div className="w-1.5 h-10 bg-slate-100 shrink-0" />
                                            <div>
                                                <div className="text-sm font-black text-slate-700 uppercase tracking-tight">{item.hook}</div>
                                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-tight">{item.behavior}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {type === 'ux' && (
                    <>
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                                <h2 className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase">Interaction States</h2>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                                <div className="divide-y divide-slate-100">
                                    {UX_SPEC_DATA.interactionStates.map((item, idx) => (
                                        <div key={idx} className="px-10 py-6 hover:bg-slate-50 transition-colors">
                                            <div className="text-[10px] font-black text-[#FF4B91] uppercase tracking-[0.2em] mb-1">{item.state}</div>
                                            <div className="text-sm font-bold text-slate-600">{item.visual}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                                <h2 className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase">Component Specs</h2>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                                <div className="divide-y divide-slate-100">
                                    {UX_SPEC_DATA.componentStandards.map((item, idx) => (
                                        <div key={idx} className="px-10 py-6 hover:bg-slate-50 transition-colors flex gap-6 items-start">
                                            <div className="w-1.5 h-10 bg-slate-100 shrink-0" />
                                            <div>
                                                <div className="text-sm font-black text-slate-700 uppercase tracking-tight">{item.component}</div>
                                                <div className="text-[10px] font-black text-slate-400 flex gap-4">
                                                    <span>PAD: {item.padding}</span>
                                                    <span>BRD: {item.border}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
