"use client";

import { ZLoader } from "@quiz/ui";
import {
    Activity,
    ArrowRight,
    BarChart3,
    ChevronRight,
    Cpu,
    LogOut,
    ShieldCheck,
    Terminal
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useShallow } from 'zustand/react/shallow';

import { InfrastructureGuard } from "@/components/auth/InfrastructureGuard";
import { useAuthStore } from "@/store/auth-store";

export default function Home() {
    const router = useRouter();
    const { initialized, logout } = useAuthStore(
        useShallow((s) => ({
            initialized: s.initialized,
            logout: s.logout,
        }))
    );
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (initialized === true) {
            setIsLoading(false);
        }
    }, [initialized]);

    const modules = [
        {
            name: 'Security Perimeter',
            description: 'Global Identity & Handshaking',
            path: '/api/auth',
            status: 'Active',
            icon: <ShieldCheck size={24} />,
            color: "text-rose-500",
            bg: "bg-rose-500/5",
            border: "hover:border-rose-500/30"
        },
        {
            name: 'Administrative Core',
            description: 'Governance & Command Interface',
            path: '/api/admin',
            status: 'Active',
            icon: <Terminal size={24} />,
            color: "text-blue-600",
            bg: "bg-blue-600/5",
            border: "hover:border-blue-600/30"
        },
        {
            name: 'Neural Engine',
            description: 'Core Logic & Assessment Flow',
            path: '/api/quiz',
            status: 'Active',
            icon: <Cpu size={24} />,
            color: "text-violet-500",
            bg: "bg-violet-500/5",
            border: "hover:border-violet-500/30"
        },
        {
            name: 'Deep Telemetry',
            description: 'Real-time System Pulse & Health',
            path: '/api/telemetry',
            status: 'Active',
            icon: <Activity size={24} />,
            color: "text-emerald-500",
            bg: "bg-emerald-500/5",
            border: "hover:border-emerald-500/30"
        },
        {
            name: 'Intelligence Intel',
            description: 'Global Analytics & Insight Data',
            path: '/api/reports',
            status: 'Active',
            icon: <BarChart3 size={24} />,
            color: "text-amber-500",
            bg: "bg-amber-500/5",
            border: "hover:border-amber-500/30"
        },
    ];

    const buildDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    if (initialized === false || isLoading === true) {
        return (
            <div className="loading-screen">
                <ZLoader size="xl" text="COMMAND CENTER SYNCHRONIZING_" color="#FF2D55" />
            </div>
        );
    }

    return (
        <InfrastructureGuard>
            <main className="main-container">
                <div className="glow-top" />
                <div className="glow-bottom" />

                <div className="content-wrapper">
                    <div className="header-flex">
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <span className="badge">v3.0.4-ROOT</span>
                                <div className="status-indicator">
                                    <div className="status-pulse" />
                                    <span className="status-text">Core Operational</span>
                                </div>
                            </div>
                            <h1 className="heading-title">
                                GLOBAL <span className="text-[#FF4B91]">ORCHESTRATION</span>
                            </h1>
                            <p className="description">
                                High-authority administrative interface for the Quiz Platform&apos;s infrastructure.
                                Managed via secure AES-256 encrypted channels.
                            </p>
                        </div>

                        <div className="stats-card">
                            <div className="flex flex-col items-end gap-1">
                                <span className="stats-label">Cluster Latency</span>
                                <span className="stats-value">08<span className="stats-unit">ms</span></span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    logout();
                                    router.push('/login');
                                }}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-black transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-black/10"
                            >
                                <LogOut size={14} />
                                Terminate Session
                            </button>
                        </div>
                    </div>

                    <div className="module-grid">
                        {modules.map((module) => (
                            <div key={module.name} className={`module-card group relative ${module.border}`}>
                                <div className={`absolute top-6 right-6 p-3 rounded-xl transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 ${module.bg} ${module.color}`}>
                                    {module.icon}
                                </div>

                                <div className="space-y-4">
                                    <div className="module-status-row">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${module.color}`}>{module.status}</span>
                                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${module.bg.replace('/5', '')}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 font-outfit uppercase tracking-tight">{module.name}</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{module.description}</p>
                                    </div>
                                    <code className="module-path block mt-4 border border-slate-100">{module.path}</code>

                                    <div className="flex items-center gap-2 text-[#FF2D55] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none mt-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Access Spoke</span>
                                        <ArrowRight size={14} strokeWidth={3} />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <a
                            href="/api/status"
                            className="action-card group"
                        >
                            <div className="action-icon group-hover:translate-x-2 transition-transform">
                                <ChevronRight size={40} />
                            </div>
                            <span className="action-text">Full System Audit</span>
                        </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-slate-100">
                        <div className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100">
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Connectivity</h4>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-slate-900">Database Edge: Synchronized</span>
                            </div>
                        </div>
                        <div className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100">
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Security</h4>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-slate-900">SSL v3.0: High Authority</span>
                            </div>
                        </div>
                        <div className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100">
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Intelligence</h4>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-slate-900">Last Deploy: {buildDate}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </InfrastructureGuard>
    );
}
