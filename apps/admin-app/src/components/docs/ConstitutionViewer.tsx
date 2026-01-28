import React from 'react';
import { GOVERNANCE_DATA } from '@/lib/governance-inventory';

export function ConstitutionViewer() {
    return (
        <div className="space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            {/* 1. AGENT_CONSTITUTION.md - Overview */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Constitution Overview <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(The Foundation)</span>
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
                            {GOVERNANCE_DATA.overview.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-700 text-sm italic">{item.attribute}</td>
                                    <td className="px-10 py-6 font-bold text-slate-500">{item.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 2. Source-of-Truth Hierarchy */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Source-of-Truth Hierarchy <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(The Absolute Law)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Rank</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Source</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {GOVERNANCE_DATA.hierarchy.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-700 text-lg">{item.rank}</td>
                                    <td className="px-10 py-6">
                                        <code className="px-3 py-1 bg-slate-100 text-[#FF4B91] text-[11px] font-bold rounded-md">
                                            {item.source}
                                        </code>
                                    </td>
                                    <td className="px-10 py-6 text-sm font-bold text-slate-500 italic">{item.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-10 py-4 bg-slate-50 border-t border-slate-100">
                        <p className="text-[11px] font-bold text-slate-400 italic">
                            {GOVERNANCE_DATA.hierarchyNote}
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. Permission Matrix */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Permission Matrix <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(Read vs Write)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Path</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Read</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Write</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {GOVERNANCE_DATA.permissions.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6">
                                        <code className="px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-md">
                                            {item.path}
                                        </code>
                                    </td>
                                    <td className="px-10 py-6 text-lg">{item.read}</td>
                                    <td className="px-10 py-6 text-lg">{item.write}</td>
                                    <td className="px-10 py-6 text-sm font-bold text-slate-500 italic">{item.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 4. Documentation Architecture */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Documentation Architecture <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(Folder Intent Map)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Folder Name</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Intent</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Key Files / Purpose</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {GOVERNANCE_DATA.folderIntentMap.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-700 text-sm tracking-tight">{item.folder}</td>
                                    <td className="px-10 py-6">
                                        <code className="px-3 py-1 bg-slate-100 text-[#FF4B91] text-[11px] font-bold rounded-md">
                                            {item.intent}
                                        </code>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex flex-wrap gap-2">
                                            {item.keyFiles.split(',').map((file, fIdx) => (
                                                <span key={fIdx} className="px-2 py-1 bg-[#1A1A1A]/5 text-[#1A1A1A] text-[10px] font-black rounded uppercase tracking-widest">
                                                    {file.trim()}
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

            {/* 5. Execution & Safety - STOP Conditions */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        STOP Conditions <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(Safety Protocol)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full p-10">
                    <ul className="space-y-4">
                        {GOVERNANCE_DATA.stopConditions.map((condition, idx) => (
                            <li key={idx} className="flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="w-2 h-2 bg-[#FF4B91] rounded-full mt-2 shrink-0" />
                                <span className="text-sm font-bold text-slate-500 italic leading-relaxed">
                                    {condition}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* 6. Engineering Standards */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Engineering Standards <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(SDE-3 Mandate)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Principle</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {GOVERNANCE_DATA.standards.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6">
                                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-md">
                                            {item.principle}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-sm font-bold text-slate-500 italic">{item.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 7. Document Change Policy */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Change Policy <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(Maintenance Rules)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full p-10">
                    <ol className="space-y-4 list-decimal list-inside">
                        {GOVERNANCE_DATA.changePolicy.map((item, idx) => (
                            <li key={idx} className="text-sm font-bold text-slate-500 italic leading-relaxed pl-2">
                                <span className="text-slate-700 font-black mr-2">{idx + 1}.</span>
                                {item}
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* 8. The Cycle of Truth */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        The Cycle of Truth <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(Governance Loop)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Step</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Governs/Guides</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Logs/Audits</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {GOVERNANCE_DATA.cycleOfTruth.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-700 text-lg">{item.step}</td>
                                    <td className="px-10 py-6 font-bold text-slate-500 italic">{item.governs}</td>
                                    <td className="px-10 py-6">
                                        <div className="flex flex-wrap gap-2">
                                            {item.logs.split(',').map((log, lIdx) => (
                                                <code key={lIdx} className="px-3 py-1 bg-slate-100 text-[#FF4B91] text-[10px] font-bold rounded-md">
                                                    {log.trim()}
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
        </div>
    );
}
