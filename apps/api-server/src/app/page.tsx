export default function Home() {
    const modules = [
        { name: 'Authentication', path: '/api/auth', status: 'Active' },
        { name: 'Admin Console', path: '/api/admin', status: 'Active' },
        { name: 'Core Engine', path: '/api/quiz', status: 'Active' },
        { name: 'Telemetry', path: '/api/telemetry', status: 'Active' },
        { name: 'Reporting', path: '/api/reports', status: 'Active' },
    ];

    // Stabilize date representation for consistency
    const buildDate = 'Feb 10, 2026';

    return (
        <main className="main-container">
            {/* Decorative Glows */}
            <div className="glow-top" />
            <div className="glow-bottom" />

            <div className="content-wrapper">
                {/* Header Section */}
                <div className="header-flex">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <span className="badge">v0.1.1</span>
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
                        </p>
                    </div>

                    <div className="glass-morphism stats-card">
                        <span className="stats-label">Latency</span>
                        <span className="stats-value">12<span className="stats-unit">ms</span></span>
                    </div>
                </div>

                {/* Modules Grid */}
                <div className="module-grid">
                    {modules.map((module) => (
                        <div key={module.name} className="glass-morphism module-card">
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
                            →
                        </div>
                        <span className="action-text">Full System Check</span>
                    </a>
                </div>

                {/* Technical Specs Footer */}
                <div className="footer-section">
                    <div className="footer-stats-list">
                        <p>ENGINE: <span className="footer-value">NODE.JS 20.x</span></p>
                        <p>REGION: <span className="footer-value">US-EAST-1</span></p>
                    </div>
                    <p className="footer-stats-list" style={{ marginTop: 0 }}>
                        LAST DEPLOYED: <span className="footer-value">{buildDate}</span>
                    </p>
                </div>
            </div>
        </main>
    );
}
