import React from 'react';
import { INVENTORY_GROUPS, FOLDER_BREAKDOWN, MASTER_FOLDER_MAP, COMPONENT_INVENTORY, GOVERNANCE_DATA } from '@/lib/governance-inventory';
import { ADMIN_APP_INVENTORY, WEB_APP_INVENTORY, API_SERVER_INVENTORY, CodeInventoryItem } from '@/lib/codebase-inventory-data';

function InventoryTable({ title, subtitle, items }: { title: string, subtitle: string, items: CodeInventoryItem[] }) {
    return (
        <section>
            <div className="flex items-center gap-4 mb-8">
                <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                    {title} <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">({subtitle})</span>
                </h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                <table className="w-full divide-y divide-slate-100">
                    <thead className="bg-[#FF4B91]/5">
                        <tr>
                            <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Component / File</th>
                            <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Type</th>
                            <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Architectural Purpose</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((item, idx) => (
                            <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                <td className="px-10 py-6">
                                    <span className="text-sm font-black text-slate-700 tracking-tight">{item.name}</span>
                                </td>
                                <td className="px-10 py-6">
                                    <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-widest ${item.type === 'Page' ? 'bg-purple-100 text-purple-600' :
                                        item.type === 'API' ? 'bg-green-100 text-green-600' :
                                            item.type === 'Service' ? 'bg-blue-100 text-blue-600' :
                                                'bg-slate-100 text-slate-600'
                                        }`}>
                                        {item.type}
                                    </span>
                                </td>
                                <td className="px-10 py-6 text-sm font-bold text-slate-500 italic">
                                    {item.purpose}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export function GovernanceInventory() {
    return (
        <div className="space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            {/* 0. Constitution Overview (Source of Truth) */}
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
                </div>
            </section>

            {/* 0.5 Permission Matrix */}
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

            {/* 0.6 Standards */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Standards <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(The Guiding Principles)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Standard</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Description</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Impact</th>
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
                                    <td className="px-10 py-6 text-sm font-bold text-slate-500 italic" colSpan={2}>{item.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 1. Master Folder Map (The New Law) */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Master Folder Map <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(The New Law)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Intent</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Directory</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Key Files</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {MASTER_FOLDER_MAP.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-700 text-sm tracking-tight">{item.intent}</td>
                                    <td className="px-10 py-6">
                                        <code className="px-3 py-1 bg-slate-100 text-[#FF4B91] text-[11px] font-bold rounded-md">
                                            {item.directory}
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

            {/* 2. Content Inventory (Grouped) */}
            {INVENTORY_GROUPS.map((group, gIdx) => (
                <section key={gIdx}>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                        <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                            {group.title} <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">({group.description})</span>
                        </h2>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                        <table className="w-full divide-y divide-slate-100">
                            <thead className="bg-[#FF4B91]/5">
                                <tr>
                                    <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Documentation File</th>
                                    <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Code Mapped</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {group.items.map((item, idx) => (
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
            ))}

            {/* 3. Full Codebase Inventory (New) */}
            <InventoryTable
                title="Admin App Inventory"
                subtitle="UI Components & Governance Pages"
                items={ADMIN_APP_INVENTORY}
            />

            <InventoryTable
                title="Web App Inventory"
                subtitle="Student Interface & Exam Experience"
                items={WEB_APP_INVENTORY}
            />

            <InventoryTable
                title="API Server Inventory"
                subtitle="Backend Logic & Data Services"
                items={API_SERVER_INVENTORY}
            />

            {/* 4. Component Audit Board (Legacy View - Optional to keep or remove, keeping for now as specific highlight) */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Component Audit Board <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(Architecture Verification)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Component (.tsx)</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Architectural Purpose</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {COMPONENT_INVENTORY.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6">
                                        <span className="text-sm font-black text-slate-700 tracking-tight">{item.component}</span>
                                    </td>
                                    <td className="px-10 py-6 text-sm font-bold text-slate-500 italic">
                                        {item.purpose}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 4. Consolidation Report */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                        Consolidation Report <span className="text-[#FF4B91] font-medium not-italic text-sm tracking-[0.2em] ml-4">(Final Breakdown)</span>
                    </h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5 w-full">
                    <table className="w-full divide-y divide-slate-100">
                        <thead className="bg-[#FF4B91]/5">
                            <tr>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Folder</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Count</th>
                                <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em]">Content Purpose</th>
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
                            <tr className="bg-[#FF4B91]/5">
                                <td className="px-10 py-6 font-black uppercase text-[11px] tracking-[0.4em] text-[#FF4B91]">Total_Assets</td>
                                <td className="px-10 py-6 font-black text-2xl text-[#FF4B91]">21</td>
                                <td className="px-10 py-6"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
