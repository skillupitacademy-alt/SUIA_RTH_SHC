'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiClient } from '@quiz/api-client';
import {
    Activity,
    CheckCircle2,
    X,
    ShieldCheck,
    ClipboardList,
    Clock,
    LayoutGrid,
    AlertTriangle,
    Target,
    Zap,
    Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZLoader } from '@quiz/ui';

interface BlueprintFactoryWizardProps {
    isOpen: boolean;
    onClose: () => void;
    domainId: string;
    domainName: string;
    questionIds?: string[];
    questionStats?: {
        simple: number;
        intermediate: number;
        expert: number;
        total: number;
    } | null;
    onSuccess?: () => void;
}

export function BlueprintFactoryWizard({ isOpen, onClose, domainId, domainName, questionIds, questionStats, onSuccess }: BlueprintFactoryWizardProps) {
    const [formData, setFormData] = useState({
        name: `${domainName} Assessment`,
        description: `Official assessment for ${domainName}.`,
        totalQuestions: 10,
        timeLimit: 15,
        distribution: {
            simple: 30,
            intermediate: 30,
            expert: 40
        },
        questionIds: questionIds || [] as string[],
        blueprintMode: (questionIds && questionIds.length > 0) ? 'static' : 'dynamic' as 'static' | 'dynamic'
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setFormData(prev => ({
                ...prev,
                name: `${domainName} Assessment`,
                description: `Official assessment for ${domainName}.`,
                totalQuestions: questionIds?.length || 10,
                questionIds: questionIds || [],
                blueprintMode: (questionIds && questionIds.length > 0) ? 'static' : 'dynamic'
            }));
        } else {
            document.body.style.overflow = 'unset';
            setSuccess(false);
            setError(null);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, domainName]);

    const handleCreate = async () => {
        // Validation: Existence Rule
        if (formData.blueprintMode === 'static' && formData.questionIds.length === 0) {
            setError("EXISTENCE RULE VIOLATION: A Static Certification requires a non-empty question set. Please use the Factory to harvest content first.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                domains: [domainId],
                totalQuestions: formData.totalQuestions,
                timeLimit: formData.timeLimit,
                difficultyDistribution: formData.distribution,
                questionIds: formData.blueprintMode === 'static' ? formData.questionIds : []
            };

            await apiClient.admin.createBlueprint(payload);
            setSuccess(true);
            if (onSuccess) onSuccess();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to create blueprint. Please verify your configuration.";
            setError(message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen || !isMounted) return null;

    const totalDist = formData.distribution.simple + formData.distribution.intermediate + formData.distribution.expert;

    return createPortal(
        <div className="fixed inset-0 z-[1100] flex flex-col bg-white animate-in fade-in duration-300">
            <div className="flex-1 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-12 py-4 border-b border-primary/5 flex items-center justify-between bg-primary/[0.02]">
                    <div className="flex items-center gap-5">
                        <div
                            className="p-2.5 bg-[#1A1A1A] text-white rounded-2xl shadow-xl shadow-black/10"
                            title="Blueprint Designer: A strategic orchestration tool for defining assessment delivery protocols and difficulty toning."
                        >
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-[#1A1A1A]">Blueprint Designer_</h2>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-0.5">
                                {formData.blueprintMode === 'static'
                                    ? `Static Orchestration Mode (${formData.questionIds.length} Locked)`
                                    : "Dynamic Orchestration Mode"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        title="Close the Designer and return to the management console. Warning: Unsaved configuration changes will be lost."
                        className="p-3 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-2xl transition-all border border-transparent hover:border-red-100 font-black uppercase text-[10px] flex items-center gap-2"
                    >
                        <X size={20} /> Close Designer
                    </button>
                </div>

                {/* Form Area */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                    {success ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in slide-in-from-bottom-6">
                            <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-green-500/20">
                                <CheckCircle2 size={40} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl font-black uppercase tracking-tight text-[#1A1A1A]">Design Committed</h3>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">{formData.name} is now active.</p>
                            </div>
                            <button
                                onClick={onClose}
                                title="Exit the Designer and return to the Governance dashboard. Your assessment is now officially part of the hierarchy."
                                className="px-12 py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-green-700 transition-all shadow-xl shadow-green-600/20"
                            >
                                Return to Governance
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Mode Selector */}
                            <div className="flex items-center gap-4 p-6 bg-slate-900 rounded-[2rem] border border-white/10 shadow-2xl">
                                <div className="flex-1">
                                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                                        <Zap size={14} className="text-yellow-400" /> Delivery Protocol_
                                    </h4>
                                    <p className="text-[11px] font-bold text-slate-300">Choose between a fixed Certification or a random Practice Pool.</p>
                                </div>
                                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                                    <button
                                        onClick={() => setFormData({ ...formData, blueprintMode: 'static' })}
                                        title="STATIC MODE: Locks the assessment to a specific set of harvested questions. Recommended for formal Certifications and high-stakes exams where question consistency is critical."
                                        className={cn(
                                            "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center",
                                            formData.blueprintMode === 'static' ? "bg-white text-slate-900 shadow-xl" : "text-white/40 hover:text-white"
                                        )}
                                    >
                                        <Lock size={12} /> Static
                                    </button>
                                    <button
                                        onClick={() => setFormData({ ...formData, blueprintMode: 'dynamic' })}
                                        title="DYNAMIC MODE: Generates a random assessment on-the-fly from the available question pool based on difficulty constraints. Ideal for continuous practice and adaptive learning."
                                        className={cn(
                                            "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center",
                                            formData.blueprintMode === 'dynamic' ? "bg-white text-slate-900 shadow-xl" : "text-white/40 hover:text-white"
                                        )}
                                    >
                                        <Target size={12} /> Dynamic
                                    </button>
                                </div>
                            </div>

                            {/* Calibration Summary */}
                            {formData.blueprintMode === 'static' && questionStats && (
                                <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 space-y-4 animate-in zoom-in-95 duration-500">
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                        <Activity size={14} /> Calibration Summary_
                                    </h4>
                                    <div className="grid grid-cols-4 gap-4">
                                        <StatBox label="Total" val={questionStats.total} color="bg-[#1A1A1A] text-white" />
                                        <StatBox label="Simple" val={questionStats.simple} color="bg-blue-500/10 text-blue-600" />
                                        <StatBox label="Inter" val={questionStats.intermediate} color="bg-orange-500/10 text-orange-600" />
                                        <StatBox label="Expert" val={questionStats.expert} color="bg-purple-500/10 text-purple-600" />
                                    </div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase text-center tracking-widest pt-2">
                                        Metrics confirmed by Factory Emission Engine.
                                    </p>
                                </div>
                            )}

                            {/* General Settings */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Blueprint Identity_</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            title="Assign an authoritative name to this Blueprint. This will be the public identity of the assessment in the testing portal."
                                            className="w-full bg-slate-50 border-2 border-primary/5 rounded-2xl p-4 font-bold text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Target Domain_</label>
                                        <div
                                            className="w-full bg-slate-100 border border-primary/5 rounded-2xl p-4 font-black text-xs text-primary/60"
                                            title="The specific hierarchical Domain this blueprint is anchored to. Calibrations performed here will only affect this domain."
                                        >
                                            {domainName}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Operational Scope_</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        title="Define the operational scope and instructions for this assessment. This information helps students understand what competencies are being tested."
                                        className="w-full bg-slate-50 border-2 border-primary/5 rounded-2xl p-4 font-medium text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all h-24 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Constraints */}
                            <div className="grid grid-cols-2 gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-primary/5">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2">
                                        <LayoutGrid size={14} className="text-primary" /> Question Payload_
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            value={formData.totalQuestions}
                                            onChange={(e) => setFormData({ ...formData, totalQuestions: parseInt(e.target.value) })}
                                            title="Total number of questions to be presented in a single test session. Higher counts increase assessment depth but may fatigue the student."
                                            className="w-24 bg-white border-2 border-primary/5 rounded-xl p-3 font-black text-center text-lg"
                                        />
                                        <span className="text-[11px] font-bold text-muted-foreground uppercase">Units per Session</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2">
                                        <Clock size={14} className="text-primary" /> Temporal Limit_
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            value={formData.timeLimit}
                                            onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                                            title="Global countdown duration in minutes. Ensure this provides adequate time for the assigned question count and difficulty mix."
                                            className="w-24 bg-white border-2 border-primary/5 rounded-xl p-3 font-black text-center text-lg"
                                        />
                                        <span className="text-[11px] font-bold text-muted-foreground uppercase">Minutes Duration</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tiers Distribution */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2">
                                        <Activity size={14} className="text-primary" /> Difficulty Toning_
                                    </label>
                                    <div className={cn(
                                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all",
                                        totalDist === 100 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                                    )}>
                                        CALIBRATION: {totalDist}%
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <TierControl
                                        label="Simple"
                                        val={formData.distribution.simple}
                                        onChange={(v) => setFormData({ ...formData, distribution: { ...formData.distribution, simple: v } })}
                                        color="text-blue-500"
                                        title="Percentage of introductory questions. High values create a 'low-friction' entry point for early-stage learners."
                                    />
                                    <TierControl
                                        label="Inter"
                                        val={formData.distribution.intermediate}
                                        onChange={(v) => setFormData({ ...formData, distribution: { ...formData.distribution, intermediate: v } })}
                                        color="text-orange-500"
                                        title="Percentage of standard operational questions. Represents the core competency required for professional proficiency."
                                    />
                                    <TierControl
                                        label="Expert"
                                        val={formData.distribution.expert}
                                        onChange={(v) => setFormData({ ...formData, distribution: { ...formData.distribution, expert: v } })}
                                        color="text-purple-500"
                                        title="Percentage of complex, architectural questions. Use high values only for advanced certifications or senior-level vetting."
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="p-8 border-t border-primary/5 bg-slate-50 flex items-center justify-between">
                        {error ? (
                            <div className="flex items-center gap-3 text-red-500 text-[10px] font-black uppercase">
                                <AlertTriangle size={16} />
                                {error}
                            </div>
                        ) : (
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                                {formData.blueprintMode === 'static'
                                    ? "Certification Protocol Active • Questions Locked."
                                    : "Practice Protocol Active • Dynamic Delivery."}
                            </p>
                        )}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onClose}
                                title="Abort changes and return to the main dashboard. No configuration state will be persisted."
                                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-slate-100 rounded-xl transition-all"
                            >
                                Cancel Design
                            </button>
                            <button
                                disabled={isProcessing || totalDist !== 100}
                                onClick={handleCreate}
                                title="Atomic commit of the Blueprint to the system registry. This will finalize the delivery protocol and make the assessment available for student sessions."
                                className="px-10 py-4 bg-[#1A1A1A] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:scale-105 transition-all flex items-center gap-3 disabled:grayscale disabled:opacity-50"
                            >
                                {isProcessing ? <ZLoader size="xs" className="text-white" center={false} /> : <ShieldCheck size={16} />}
                                Commit Blueprint
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

function StatBox({ label, val, color }: { label: string, val: number, color: string }) {
    return (
        <div className={cn("p-4 rounded-3xl flex flex-col items-center justify-center gap-1 border border-primary/5", color)}>
            <span className="text-sm font-black tracking-tighter">{val}</span>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">{label}</span>
        </div>
    );
}

function TierControl({ label, val, onChange, color, title }: { label: string, val: number, onChange: (v: number) => void, color: string, title: string }) {
    return (
        <div
            className="space-y-3 p-5 rounded-3xl bg-white border border-primary/5 shadow-sm transition-all hover:border-primary/20"
            title={title}
        >
            <span className={cn("text-[10px] font-black uppercase tracking-widest block text-center", color)}>{label}</span>
            <input
                type="number"
                value={val}
                onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                className="w-full text-center text-xl font-black focus:outline-none bg-transparent"
            />
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className={cn("h-full transition-all duration-500", color.replace('text', 'bg'))} style={{ width: `${val}%` }} />
            </div>
        </div>
    );
}
