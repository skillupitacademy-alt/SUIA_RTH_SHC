"use client";

import { AdminGuard } from "@/components/auth/AdminGuard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { ZLoader } from "@quiz/ui";

export default function Home() {
    const router = useRouter();
    const { user, initialized } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (initialized) {
            setIsLoading(false);
        }
    }, [initialized]);
    // ... modules and buildDate logic ...
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

    if (!initialized || isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-white">
                <ZLoader size="xl" text="Loading Control Panel..." color="#FF2D55" />
            </div>
        );
    }

    return (
        <AdminGuard>
            <main className="main-container">
                {/* ... dashboard contents ... */}
                <div className="glow-top" />
                <div className="glow-bottom" />

                <div className="content-wrapper">
                    {/* Header Section */}
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

                        <div className="stats-card">
                            <span className="stats-label">System Latency</span>
                            <span className="stats-value">12<span className="stats-unit">ms</span></span>
                        </div>
                    </div>

                    {/* Modules Grid */}
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

                        {/* Status Check Card */}
                        <a
                            href="/api/status"
                            className="action-card"
                        >
                            <div className="action-icon">
                                {"\u2192"}
                            </div>
                            <span className="action-text">Full System Check</span>
                        </a>
                    </div>

                    {/* Technical Specs Footer */}
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
