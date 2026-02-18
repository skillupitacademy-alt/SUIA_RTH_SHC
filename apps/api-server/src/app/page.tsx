"use client";

import { ZLoader } from "@quiz/ui";
import { ChevronRight, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminGuard } from "@/components/auth/AdminGuard";
import { type AuthState, useAuthStore } from "@/store/auth-store";

export default function Home() {
    const router = useRouter();
    const { initialized, logout } = useAuthStore() as AuthState & { logout: () => void };
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (initialized === true) {
            setIsLoading(false);
        }
    }, [initialized]);

    const modules = [
        { name: 'Authentication', path: '/api/auth', status: 'Active' },
        { name: 'Admin Console', path: '/api/admin', status: 'Active' },
        { name: 'Core Engine', path: '/api/quiz', status: 'Active' },
        { name: 'Telemetry', path: '/api/telemetry', status: 'Active' },
        { name: 'Reporting', path: '/api/reports', status: 'Active' },
    ];

    const buildDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    if (initialized === false || isLoading === true) {
        return (
            <div className="loading-screen">
                <ZLoader size="xl" text="Loading Control Panel..." color="#FF2D55" />
            </div>
        );
    }

    return (
        <AdminGuard>
            <main className="main-container">
                <div className="glow-top" />
                <div className="glow-bottom" />

                <div className="content-wrapper">
                    <div className="header-flex">
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <span className="badge">v0.1.2</span>
                                <div className="status-indicator">
                                    <div className="status-pulse" />
                                    <span className="status-text">System Online</span>
                                </div>
                            </div>
                            <h1 className="heading-title">
                                API <span className="text-gradient">SERVER</span>
                            </h1>
                            <p className="description">
                                High-performance backend infrastructure powering the modern quiz experience.
                                Designed for reliability and enterprise scale.
                            </p>
                        </div>

                        <div className="stats-card" style={{ gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <span className="stats-label">System Latency</span>
                                <span className="stats-value">12<span className="stats-unit">ms</span></span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    logout();
                                    router.push('/login');
                                }}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-colors text-xs font-bold uppercase tracking-widest"
                            >
                                <LogOut size={14} />
                                Sign Out
                            </button>
                        </div>
                    </div>

                    <div className="module-grid">
                        {modules.map((module) => (
                            <div key={module.name} className="module-card">
                                <div className="module-status-row">
                                    <span className="module-status-text">{module.status}</span>
                                    <div className="module-dot" />
                                </div>
                                <h3 className="module-title">{module.name}</h3>
                                <code className="module-path">{module.path}</code>
                            </div>
                        ))}

                        <a
                            href="/api/status"
                            className="action-card"
                        >
                            <div className="action-icon">
                                <ChevronRight size={32} />
                            </div>
                            <span className="action-text">Full System Check</span>
                        </a>
                    </div>

                    <div className="footer-section">
                        <div className="footer-stats-list">
                            <p>ENGINE: <span className="footer-value">NODE.JS 20.x</span></p>
                            <p>REGION: <span className="footer-value">US-EAST-1</span></p>
                            <p>SPEC: <span className="footer-value">ALPHA_PARITY 100%</span></p>
                        </div>
                        <p className="footer-stats-list" style={{ marginTop: 0 }}>
                            LAST DEPLOYED: <span className="footer-value">{buildDate}</span>
                        </p>
                    </div>
                </div>
            </main>
        </AdminGuard>
    );
}
