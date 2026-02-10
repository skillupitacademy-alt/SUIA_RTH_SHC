
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Server, Shield, Terminal, ArrowRight, Activity, Database, Lock } from 'lucide-react';
import { ZLoader } from '@quiz/ui';

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);

    // Hardcoded credentials for API Server visualization
    const [email, setEmail] = useState('admin@quiz.com');
    const [password, setPassword] = useState('password');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        login({ id: 'sys-admin', name: 'System Admin', email, isAdmin: true, role: 'admin', onboarded: true });
        router.push('/');
    };

    return (
        <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden font-inter">
            {/* Left Panel: Visual/Technical Identity */}
            <div className="hidden lg:flex flex-1 relative items-center justify-center p-12 bg-[#0A0A0A] border-r border-white/5">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />

                <div className="relative z-10 max-w-lg space-y-12">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
                            <Activity size={14} className="animate-pulse" />
                            <span>SYSTEM_STATUS: OPERATIONAL</span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">
                            Core<br />Infrastructure
                        </h1>
                        <p className="text-lg text-slate-400 leading-relaxed max-w-md">
                            Direct access to the Quiz Platform's central nervous system. Monitor telemetry, manage schemas, and control global configuration.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <Server className="text-blue-400 mb-4" size={24} />
                            <div className="text-2xl font-bold mb-1">99.9%</div>
                            <div className="text-xs text-slate-500 uppercase tracking-widest">Uptime</div>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <Database className="text-purple-400 mb-4" size={24} />
                            <div className="text-2xl font-bold mb-1">12ms</div>
                            <div className="text-xs text-slate-500 uppercase tracking-widest">Latency</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-[#050505]">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left space-y-2">
                        <div className="h-12 w-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mb-6 mx-auto lg:mx-0">
                            <Terminal size={24} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">Root Access</h2>
                        <p className="text-slate-400">Authenticate to establish secure connection.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Identity</label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pl-11 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all text-white placeholder:text-slate-600"
                                        placeholder="admin@system.internal"
                                    />
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Passkey</label>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pl-11 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all text-white placeholder:text-slate-600"
                                        placeholder="••••••••"
                                    />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white text-black h-12 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-slate-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <ZLoader size="xs" color="black" />
                                    <span>Handshaking...</span>
                                </>
                            ) : (
                                <>
                                    <span>Initialize Session</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="pt-8 border-t border-white/5 text-center">
                        <p className="text-[10px] text-slate-600 font-mono">
                            SECURE CHANNEL [TLS-1.3] • ENCRYPTED
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
