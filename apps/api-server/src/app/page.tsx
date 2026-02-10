export default function Home() {
    const modules = [
        { name: 'Authentication', path: '/api/auth', status: 'Active' },
        { name: 'Admin Console', path: '/api/admin', status: 'Active' },
        { name: 'Core Engine', path: '/api/quiz', status: 'Active' },
        { name: 'Telemetry', path: '/api/telemetry', status: 'Active' },
        { name: 'Reporting', path: '/api/reports', status: 'Active' },
    ];

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 relative overflow-hidden">
            {/* Glow Effect */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[hsl(var(--primary))] opacity-[0.05] blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[hsl(var(--secondary))] opacity-[0.05] blur-[120px] rounded-full" />

            <div className="w-full max-w-4xl space-y-8 z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="badge">v0.1.1</span>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <div className="status-pulse" />
                                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">System Online</span>
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white mb-4">
                            API <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))]">SERVER</span>
                        </h1>
                        <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-xl">
                            High-performance backend infrastructure powering the modern quiz experience.
                        </p>
                    </div>

                    <div className="glass-morphism p-6 rounded-[2rem] flex flex-col items-center justify-center min-w-[200px]">
                        <span className="text-[hsl(var(--muted-foreground))] text-sm uppercase font-bold tracking-widest mb-1">Latency</span>
                        <span className="text-4xl font-black text-white">12<span className="text-lg font-medium text-[hsl(var(--primary))]">ms</span></span>
                    </div>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.map((module) => (
                        <div key={module.name} className="glass-morphism p-6 rounded-[1.5rem] group hover:border-[hsl(var(--primary))]/30 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">{module.status}</span>
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[hsl(var(--primary))] transition-colors">{module.name}</h3>
                            <code className="text-xs text-[hsl(var(--muted-foreground))] bg-white/5 px-2 py-1 rounded-md">{module.path}</code>
                        </div>
                    ))}

                    {/* Status Check Card */}
                    <a
                        href="/api/status"
                        className="glass-morphism p-6 rounded-[1.5rem] bg-gradient-to-br from-[hsl(var(--primary))]/10 to-transparent border-[hsl(var(--primary))]/20 flex flex-col items-center justify-center gap-3 hover:scale-[1.02] transition-transform cursor-pointer group"
                    >
                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-white font-bold group-hover:pink-glow transition-all">
                            →
                        </div>
                        <span className="font-bold text-white">Full System Check</span>
                    </a>
                </div>

                {/* Technical Specs Footer */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-4 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    <div className="flex gap-6">
                        <p>ENGINE: <span className="text-white">NODE.JS 20.x</span></p>
                        <p>REGION: <span className="text-white">US-EAST-1</span></p>
                    </div>
                    <p>LAST DEPLOYED: <span className="text-white uppercase">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></p>
                </div>
            </div>
        </main>
    );
}
