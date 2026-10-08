import React from 'react';

import {
    ADMIN_AUTH_INVENTORY, ADMIN_CONTENT_INVENTORY, ADMIN_DASHBOARD_INVENTORY, ADMIN_GOVERNANCE_INVENTORY,
    API_ADMIN_INVENTORY, API_AUTH_INVENTORY, API_QUIZ_INVENTORY, API_SERVICES_INVENTORY,
    CodeInventoryItem,
    WEB_CORE_INVENTORY, WEB_EXAM_INVENTORY, WEB_REPORTS_INVENTORY,
WEB_STUDENT_INVENTORY} from '@/lib/codebase-inventory-data';
import { COMPONENT_INVENTORY,FOLDER_BREAKDOWN, INVENTORY_GROUPS, MASTER_FOLDER_MAP } from '@/lib/governance-inventory';

function InventoryTable({ title, subtitle, items }: { title: string, subtitle: string, items: CodeInventoryItem[] }) {
    return (
        <section>
            <div className="flex items-center gap-4 mb-8">
                <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                    {title} <span className="text-[#FF4B91] font-medium text-sm tracking-[0.2em] ml-4">({subtitle})</span>
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
                                <td className="px-10 py-6 text-sm font-bold text-slate-500">
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
            {/* 0. Constitution Overview (Source of Truth) - MOVED TO ConstitutionViewer.tsx */}

            {/* 1. Master Folder Map (The New Law) */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                        Governance Matrix <span className="text-[#FF4B91] font-medium text-sm tracking-[0.2em] ml-4">(Compliance Rules)</span>
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
                                    <td className="px-10 py-6 font-black text-slate-700 text-sm">{item.intent}</td>
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
                        <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                            {group.title} <span className="text-[#FF4B91] font-medium text-sm tracking-[0.2em] ml-4">({group.description})</span>
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

            {/* 3. Full Codebase Inventory (Logically Grouped) */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-2 h-10 bg-[#FF4B91] rounded-full" />
                <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                    Full Codebase Inventory <span className="text-[#FF4B91] font-medium text-sm tracking-[0.2em] ml-4">(Architecture Verification)</span>
                </h1>
            </div>

            {/* --- ADMIN APP --- */}
            <div className="pt-10 pb-4 border-b border-slate-100 mb-10">
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.5em]">Admin App Sub-Systems</h3>
            </div>

            <div className="grid grid-cols-1 gap-20">
                <InventoryTable
                    title="Auth & Shell"
                    subtitle="Authentication flows and root layouts"
                    items={ADMIN_AUTH_INVENTORY}
                />

                <InventoryTable
                    title="Analytics & Logs"
                    subtitle="Security health, RBAC panels, and audit logs"
                    items={ADMIN_DASHBOARD_INVENTORY}
                />

                <InventoryTable
                    title="Content Management"
                    subtitle="Question Bank editors and user management"
                    items={ADMIN_CONTENT_INVENTORY}
                />

                <InventoryTable
                    title="Governance & Docs"
                    subtitle="Documentation viewers and system radar"
                    items={ADMIN_GOVERNANCE_INVENTORY}
                />
            </div>

            {/* --- WEB APP --- */}
            <div className="pt-20 pb-4 border-b border-slate-100 mb-10">
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.5em]">Web App Journeys</h3>
            </div>

            <div className="grid grid-cols-1 gap-20">
                <InventoryTable
                    title="Auth & Core"
                    subtitle="Student registration and app shell"
                    items={WEB_CORE_INVENTORY}
                />

                <InventoryTable
                    title="Student Experience"
                    subtitle="Dashboard, settings, and onboarding"
                    items={WEB_STUDENT_INVENTORY}
                />

                <InventoryTable
                    title="Exam Session"
                    subtitle="Quiz configuration and live environment"
                    items={WEB_EXAM_INVENTORY}
                />

                <InventoryTable
                    title="Performance Reports"
                    subtitle="Results summary and detailed breakdown"
                    items={WEB_REPORTS_INVENTORY}
                />
            </div>

            {/* --- API SERVER --- */}
            <div className="pt-20 pb-4 border-b border-slate-100 mb-10">
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.5em]">API Service Layer</h3>
            </div>

            <div className="grid grid-cols-1 gap-20">
                <InventoryTable
                    title="Admin Endpoints"
                    subtitle="Management APIs for domains and questions"
                    items={API_ADMIN_INVENTORY}
                />

                <InventoryTable
                    title="Auth Endpoints"
                    subtitle="Identity management and session APIs"
                    items={API_AUTH_INVENTORY}
                />

                <InventoryTable
                    title="Quiz Endpoints"
                    subtitle="Session initialization and submission APIs"
                    items={API_QUIZ_INVENTORY}
                />

                <InventoryTable
                    title="Business Logic"
                    subtitle="Core engines and service modules"
                    items={API_SERVICES_INVENTORY}
                />
            </div>

            {/* 4. Component Audit Board (Legacy View - Optional to keep or remove, keeping for now as specific highlight) */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FF4B91] rounded-full" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                        Component Audit Board <span className="text-[#FF4B91] font-medium text-sm tracking-[0.2em] ml-4">(Architecture Verification)</span>
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
                                    <td className="px-10 py-6 text-sm font-bold text-slate-500">
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
                    <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                        Consolidation Report <span className="text-[#FF4B91] font-medium text-sm tracking-[0.2em] ml-4">(Final Breakdown)</span>
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
                                    <td className="px-10 py-6 text-sm font-bold text-slate-500">
                                        {item.purpose}
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-[#FF4B91]/5">
                                <td className="px-10 py-6 font-black uppercase text-[11px] tracking-[0.4em] text-[#FF4B91]">Total_Assets</td>
                                <td className="px-10 py-6 font-black text-2xl text-[#FF4B91]">21</td>
                                <td className="px-10 py-6" />
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
