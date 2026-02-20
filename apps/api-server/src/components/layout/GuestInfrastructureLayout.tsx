'use client';

import { Activity } from 'lucide-react';

export function GuestInfrastructureLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-white font-inter">
            {/* Visual Side: The Engine Room Aesthetic */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-50 border-r border-slate-100 text-slate-900 relative overflow-hidden">
                {/* Background Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

                {/* Executive Glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF2D55]/5 rounded-full blur-[100px]" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 rounded-xl bg-[#FF2D55] flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-[#FF2D55]/20">Ω</div>
                        <span className="text-2xl font-black tracking-tighter text-slate-900 font-outfit uppercase">Infrastructure</span>
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#FF2D55]/5 border border-[#FF2D55]/10 text-[#FF2D55] text-xs font-mono font-black tracking-tight uppercase">
                        <Activity size={14} className="animate-pulse" />
                        <span>System ID: ROOT-NODE-01</span>
                    </div>
                    <h1 className="text-6xl font-black leading-tight tracking-tighter text-slate-900 font-outfit">
                        Core <br />
                        <span className="text-gradient">Operations</span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-md leading-relaxed">
                        Establishing secure handshake with the central nervous system. Authorized infrastructure personnel only.
                    </p>
                </div>

                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        <span>Cluster: US-EAST-1</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>Layer: V3_PARITY</span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-50">
                        TLS 1.3 // AES-256-GCM
                    </div>
                </div>
            </div>

            {/* Form Side */}
            <div className="flex items-center justify-center p-8 bg-white relative">
                <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </div>
            </div>
        </div>
    );
}
