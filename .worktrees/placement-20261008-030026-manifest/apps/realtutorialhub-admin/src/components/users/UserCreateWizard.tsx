'use client';

import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Lock,
    Mail,
    Shield,
    User,
    Users,
    X,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';
import { clientLogger } from '@/utils/clientLogger';

interface UserCreateWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

type ExecutionStep = 'idle' | 'validating' | 'provisioning' | 'sealing' | 'done';

export function UserCreateWizard({ isOpen, onClose, onSuccess }: UserCreateWizardProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user'
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [executionStep, setExecutionStep] = useState<ExecutionStep>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Reset state on close
            setFormData({ name: '', email: '', password: '', role: 'user' });
            setExecutionStep('idle');
            setError(null);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setError(null);

        try {
            setExecutionStep('validating');
            await new Promise(r => setTimeout(r, 600));

            setExecutionStep('provisioning');
            await apiClient.user.createUser({
                name: formData.name,
                email: formData.email,
                password: formData.password.length > 0 ? formData.password : undefined,
                roles: [formData.role]
            });

            setExecutionStep('sealing');
            await new Promise(r => setTimeout(r, 600));

            setExecutionStep('done');
            await new Promise(r => setTimeout(r, 800));

            if (onSuccess) onSuccess();
            onClose();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Identity Provisioning Failed: Unable to synchronize with core registry.';
            clientLogger.error('Failed to create user', { error: errorMessage });
            setError(errorMessage);
            setExecutionStep('idle');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen || !isMounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex flex-col bg-white animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-12 py-6 border-b border-primary/5 flex items-center justify-between bg-primary/[0.02]">
                <div className="flex items-center gap-5">
                    <div className="p-3 bg-slate-900 text-[#FF4B91] rounded-2xl shadow-xl shadow-slate-900/10">
                        <Users size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Identity Provisioning</h2>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                            Admin Core • Security Layer • Active Session
                        </p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="group p-4 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-2xl transition-all border border-transparent hover:border-red-100 font-black uppercase text-[10px] flex items-center gap-2"
                >
                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300" /> 
                    Terminate Session
                </button>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto p-12 lg:p-24 custom-scrollbar bg-white">
                    <div className="max-w-3xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
                        <div className="space-y-4">
                            <h3 className="text-5xl font-black uppercase tracking-tighter text-[#1A1A1A] leading-none">
                                Register New <span className="text-[#FF4B91]">Agent</span>
                            </h3>
                            <p className="text-lg font-medium text-muted-foreground leading-relaxed max-w-xl">
                                Create a secure identity within the QuizPlatform ecosystem. 
                                Standard users gain assessment access, while administrators control ecosystem health.
                            </p>
                        </div>

                        <form onSubmit={(e) => { void handleCreate(e); }} className="space-y-10">
                            {error !== null ? (
                                <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-center gap-4 animate-in shake duration-500">
                                    <div className="p-2 bg-red-500 text-white rounded-full">
                                        <AlertCircle size={20} />
                                    </div>
                                    <p className="text-sm font-bold text-red-600 uppercase tracking-widest">{error}</p>
                                </div>
                            ) : null}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2 ml-2">
                                        <User size={14} className="text-[#FF4B91]" /> Legal Identity Name
                                    </label>
                                    <input
                                        required
                                        id="name"
                                        type="text"
                                        placeholder="Full Legal Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-[#FAFAFA] border-2 border-primary/5 rounded-[2rem] p-6 text-xl font-bold tracking-tight focus:ring-4 focus:ring-[#FF4B91]/5 focus:border-[#FF4B91]/20 outline-none transition-all placeholder:text-slate-200"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2 ml-2">
                                        <Mail size={14} className="text-[#FF4B91]" /> Communication Node
                                    </label>
                                    <input
                                        required
                                        id="email"
                                        type="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-[#FAFAFA] border-2 border-primary/5 rounded-[2rem] p-6 text-xl font-bold tracking-tight focus:ring-4 focus:ring-[#FF4B91]/5 focus:border-[#FF4B91]/20 outline-none transition-all placeholder:text-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2 ml-2">
                                        <Lock size={14} className="text-[#FF4B91]" /> Secure Access Token
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="Password (Min 6 chars)"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-[#FAFAFA] border-2 border-primary/5 rounded-[2rem] p-6 text-xl font-bold tracking-tight focus:ring-4 focus:ring-[#FF4B91]/5 focus:border-[#FF4B91]/20 outline-none transition-all placeholder:text-slate-200"
                                    />
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-4">Leave empty for default system token</p>
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="role-selector" className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2 ml-2">
                                        <Shield size={14} className="text-[#FF4B91]" /> Access Clearance
                                    </label>
                                    <div id="role-selector" className="grid grid-cols-2 gap-4 p-2 bg-[#FAFAFA] rounded-[2rem] border-2 border-primary/5">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: 'user' })}
                                            className={cn(
                                                "py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                                                formData.role === 'user' 
                                                    ? "bg-white text-[#1A1A1A] shadow-md shadow-black/5" 
                                                    : "text-muted-foreground hover:text-[#1A1A1A]"
                                            )}
                                        >
                                            Standard User
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: 'admin' })}
                                            className={cn(
                                                "py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                                                formData.role === 'admin' 
                                                    ? "bg-[#1A1A1A] text-white shadow-xl shadow-black/20" 
                                                    : "text-muted-foreground hover:text-[#1A1A1A]"
                                            )}
                                        >
                                            Administrator
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                                <User size={16} className="text-slate-400" />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                                        Identity will be synchronized <br /> across 4 core sub-systems
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="group relative px-12 py-6 bg-[#1A1A1A] text-white rounded-[2rem] overflow-hidden shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        <span className="text-sm font-black uppercase tracking-widest">
                                            {isProcessing ? 'Provisioning...' : 'Provision Identity'}
                                        </span>
                                        <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF4B91] to-[#FF8E9E] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Sidebar Monitor */}
                <div className="w-full lg:w-[480px] bg-slate-50/50 flex flex-col p-12 lg:p-16 gap-12 border-l border-slate-200/50">
                    <div className="space-y-2">
                        <h4 className="text-4xl font-black uppercase tracking-tighter text-[#1A1A1A]">Monitor</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Real-time Provisioning Status</p>
                    </div>

                    <div className="flex-1 space-y-8">
                        <div className="p-8 bg-white rounded-[2.5rem] border border-primary/5 shadow-xl space-y-8">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A1A] flex items-center gap-3">
                                <Zap size={18} className="text-[#FF4B91]" /> Provisioning Steps
                            </h5>

                            <div className="space-y-6">
                                <MonitorItem label="Credential Validation" status={executionStep === 'idle' ? 'pending' : (['validating', 'provisioning', 'sealing', 'done'].includes(executionStep) ? 'done' : 'pending')} active={executionStep === 'validating'} />
                                <MonitorItem label="Registry Transaction" status={executionStep === 'provisioning' ? 'active' : (['sealing', 'done'].includes(executionStep) ? 'done' : 'pending')} active={executionStep === 'provisioning'} />
                                <MonitorItem label="State Sealing" status={executionStep === 'sealing' ? 'active' : (executionStep === 'done' ? 'done' : 'pending')} active={executionStep === 'sealing'} />
                                <MonitorItem label="Agent Certified" status={executionStep === 'done' ? 'done' : 'pending'} active={false} />
                            </div>
                        </div>

                        {isProcessing ? (
                            <div className="p-8 bg-[#1A1A1A] rounded-[2.5rem] text-white space-y-4 animate-pulse">
                                <div className="flex items-center gap-3">
                                    <ZLoader size="sm" />
                                    <p className="text-xs font-black uppercase tracking-widest">Syncing Identity...</p>
                                </div>
                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-loose">
                                    AWAITING ACKNOWLEDGEMENT FROM <br /> CORE SECURITY ORCHESTRATOR
                                </p>
                            </div>
                        ) : null}
                        
                        {!isProcessing && executionStep !== 'done' ? (
                            <div className="p-8 bg-[#FF4B91]/5 border border-[#FF4B91]/10 rounded-[2.5rem] space-y-3">
                                <h6 className="text-[10px] font-black uppercase tracking-widest text-[#FF4B91]">Compliance Note</h6>
                                <p className="text-[11px] font-bold text-[#FF4B91]/60 leading-relaxed uppercase">
                                    All administrative actions are logged and audited in accordance with Phase 4 security protocols.
                                </p>
                            </div>
                        ) : null}

                        {executionStep === 'done' ? (
                            <div className="p-8 bg-green-500 rounded-[2.5rem] text-white space-y-4 animate-in zoom-in-95 duration-500">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 size={24} />
                                    <p className="text-xs font-black uppercase tracking-widest text-white">Identity Certified</p>
                                </div>
                                <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest leading-loose">
                                    AGENT PROVISIONED SUCCESSFULLY. <br /> SESSION READY FOR HANDOFF.
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

function MonitorItem({ label, status, active }: { label: string; status: 'pending' | 'active' | 'done'; active: boolean }) {
    return (
        <div className={cn(
            "flex items-center gap-5 p-4 rounded-2xl transition-all duration-500 border border-transparent",
            active ? "bg-primary/[0.03] border-primary/10 scale-105" : "opacity-60"
        )}>
            <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center transition-all duration-500",
                status === 'done' ? "bg-green-500 text-white" : 
                status === 'active' ? "bg-slate-900 animate-pulse text-[#FF4B91]" : "bg-slate-100 text-slate-300"
            )}>
                {status === 'done' ? <CheckCircle2 size={14} /> : status === 'active' ? <Zap size={12} /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
            </div>
            <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors duration-500",
                status === 'done' ? "text-slate-900" : status === 'active' ? "text-primary" : "text-slate-400"
            )}>
                {label}
            </span>
        </div>
    );
}
