'use client';

import {
    Activity,
    ArrowRight,
    BarChart3,
    Cpu,
    FileText,
    GraduationCap,
    LayoutDashboard,
    Radio,
    ShieldAlert,
    ShieldCheck,
    Terminal,
    Users
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { PageTitle } from '@/components/layout/PageTitle';
import { cn } from '@/lib/utils';

const dashboardCards = [
    {
        title: "Control Center",
        description: "Vital Statistics & Health",
        icon: <LayoutDashboard size={24} />,
        href: "/dashboard/control-center",
        color: "text-[#FF4B91]",
        bg: "bg-[#FF4B91]/5",
        border: "hover:border-[#FF4B91]/30"
    },
    {
        title: "Intelligence Hub",
        description: "Scale Trends & Cohort Intel",
        icon: <BarChart3 size={24} />,
        href: "/dashboard/intelligence",
        color: "text-blue-600",
        bg: "bg-blue-500/5",
        border: "hover:border-blue-500/30"
    },
    {
        title: "Smart Tutor",
        description: "Operations & Coaching",
        icon: <GraduationCap size={24} />,
        href: "/dashboard/tutor",
        color: "text-emerald-500",
        bg: "bg-emerald-500/5",
        border: "hover:border-emerald-500/30"
    },
    {
        title: "Question Factory",
        description: "AI Generation Health",
        icon: <Cpu size={24} />,
        href: "/factory/question-generator",
        color: "text-violet-500",
        bg: "bg-violet-500/5",
        border: "hover:border-violet-500/30"
    },
    {
        title: "Live Operations",
        description: "Active Sessions Tracking",
        icon: <Radio size={24} />,
        href: "/dashboard/live-sessions",
        color: "text-rose-600",
        bg: "bg-rose-600/5",
        border: "hover:border-rose-600/30"
    },
    {
        title: "User Intelligence",
        description: "Growth & Demographics",
        icon: <Users size={24} />,
        href: "/dashboard/users",
        color: "text-blue-500",
        bg: "bg-blue-500/5",
        border: "hover:border-blue-500/30"
    },
    {
        title: "System Audit",
        description: "Full Administrative Trail",
        icon: <Activity size={24} />,
        href: "/dashboard/audit",
        color: "text-slate-600",
        bg: "bg-slate-500/5",
        border: "hover:border-slate-500/30"
    },
    {
        title: "RBAC Governance",
        description: "Roles & Policy Control",
        icon: <ShieldCheck size={24} />,
        href: "/dashboard/rbac",
        color: "text-indigo-500",
        bg: "bg-indigo-500/5",
        border: "hover:border-indigo-500/30"
    },
    {
        title: "Security Protocol",
        description: "Threats & Auth Logs",
        icon: <ShieldAlert size={24} />,
        href: "/dashboard/security",
        color: "text-rose-500",
        bg: "bg-rose-500/5",
        border: "hover:border-rose-500/30"
    },
    {
        title: "Report Pipeline",
        description: "PDF Generation & Health",
        icon: <FileText size={24} />,
        href: "/reports",
        color: "text-orange-500",
        bg: "bg-orange-500/5",
        border: "hover:border-orange-500/30"
    }
];

export default function AdminDashboard() {
    return (
        <div className="space-y-10 pb-16">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b-2 border-primary/5">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-[#FF4B91]/10 text-[#FF4B91]">
                            <Terminal size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                            Administrative Core · v3.0
                        </span>
                    </div>
                    <PageTitle text="Executive Command Hub" />
                    <p className="mt-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        System-wide orchestration and high-fidelity intelligence
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                            Cluster Operational
                        </span>
                    </div>
                </div>
            </div>

            {/* Hub Grid - 3 Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 pb-12 border-b border-slate-100">
                {dashboardCards.map((card, idx) => (
                    <Link
                        key={idx}
                        href={card.href}
                        className={cn(
                            "group relative p-8 rounded-[2.5rem] bg-white border border-slate-200 transition-all duration-300",
                            "hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1",
                            card.border
                        )}
                    >
                        {/* Background Accent */}
                        <div className={cn(
                            "absolute top-6 right-6 p-4 rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6",
                            card.bg,
                            card.color
                        )}>
                            {card.icon}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-outfit font-black uppercase tracking-tight text-[#1A1A1A]">
                                    {card.title}
                                </h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {card.description}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-[#FF4B91] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                <span className="text-[10px] font-black uppercase tracking-widest">Access Spoke</span>
                                <ArrowRight size={14} strokeWidth={3} />
                            </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-x-8 bottom-8 h-px bg-slate-100 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    </Link>
                ))}
            </div>

            {/* System Status Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-slate-100">
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Connectivity</h4>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-[#1A1A1A]">Database Edge: 22ms</span>
                    </div>
                </div>
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Security</h4>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-[#1A1A1A]">SSL Encryption: Active</span>
                    </div>
                </div>
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Intelligence</h4>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-[#1A1A1A]">AI Inference: Synchronized</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
