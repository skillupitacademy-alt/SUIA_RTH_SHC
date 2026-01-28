import React from 'react';
import { MANIFESTO_DATA } from '@/lib/governance-inventory';

export function ManifestoViewer() {
    return (
        <div className="space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            {/* 1. Documentation Governance */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Doc Governance <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(The Global Rulebook)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Protocol</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Compliance Enforcement</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {MANIFESTO_DATA.docGovernance.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-700 text-sm italic">{item.rule}</td>
                                    <td className="px-10 py-6 font-bold text-slate-500">{item.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 2. Folder Intent Guide */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Folder Intent Guide <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(Semantic Map)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Directory</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Logical Intent</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Key Files</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {MANIFESTO_DATA.folderIntentGuide.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6">
                                        <code className="px-3 py-1 bg-slate-100 text-[#FF4B91] text-[10px] font-bold rounded-md">
                                            {item.folder}
                                        </code>
                                    </td>
                                    <td className="px-10 py-6 font-black text-slate-700 text-sm italic">{item.intent}</td>
                                    <td className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-tight">{item.keyFiles}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 3. Onboarding & Workflow */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                        <h2 className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                            Absolute Authority
                        </h2>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                        <div className="divide-y divide-slate-100">
                            {MANIFESTO_DATA.onboardingPrinciples.map((item, idx) => (
                                <div key={idx} className="px-10 py-6 hover:bg-slate-50 transition-colors">
                                    <div className="text-[10px] font-black text-[#FF4B91] uppercase tracking-[0.2em] mb-1">{item.principle}</div>
                                    <div className="text-sm font-bold text-slate-600">{item.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                        <h2 className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                            Workflow Mandate
                        </h2>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                        <div className="divide-y divide-slate-100">
                            {MANIFESTO_DATA.workflowMandate.map((item, idx) => (
                                <div key={idx} className="px-10 py-6 hover:bg-slate-50 transition-colors flex gap-6 items-start">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-black text-slate-400 shrink-0">{item.step}</div>
                                    <div>
                                        <div className="text-sm font-black text-slate-700 uppercase italic tracking-tight">{item.action}</div>
                                        <div className="text-[11px] font-bold text-slate-400 italic">{item.detail}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* 4. Git Policy */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Git Push Policy <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(Vercel Operational Safety)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Policy</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Operational Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {MANIFESTO_DATA.gitPushPolicy.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-700 text-sm italic">{item.policy}</td>
                                    <td className="px-10 py-6 font-bold text-slate-500">{item.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
