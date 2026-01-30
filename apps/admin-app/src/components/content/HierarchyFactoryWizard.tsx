'use client';

import { useState } from 'react';
import { apiClient } from '@quiz/api-client';
import {
    Zap,
    Code2,
    FileJson,
    AlertTriangle,
    CheckCircle2,
    X,
    Loader2,
    ClipboardCopy,
    Wand2,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HierarchyFactoryWizardProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    onSuccess?: () => void;
}

export function HierarchyFactoryWizard({ isOpen, onClose, initialData, onSuccess }: HierarchyFactoryWizardProps) {
    const [payload, setPayload] = useState(initialData ? JSON.stringify(initialData, null, 2) : '');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<any>(null);

    const handleSeed = async () => {
        setIsProcessing(true);
        setError(null);
        setSuccess(null);
        try {
            const data = JSON.parse(payload);
            const result = await apiClient.admin.atomicSeed(data);
            setSuccess(result);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to process hierarchy factory request. Please verify your JSON structure.");
        } finally {
            setIsProcessing(false);
        }
    };

    const generateTemplate = () => {
        const template = {
            domainName: "ENTER_DOMAIN_NAME",
            subjects: [
                {
                    name: "ENTER_SUBJECT_NAME",
                    topics: [
                        {
                            name: "ENTER_TOPIC_NAME",
                            questions: [
                                {
                                    questionText: "Sample Question?",
                                    difficulty: "simple",
                                    type: "mcq",
                                    options: ["Choice A", "Choice B", "Choice C", "Choice D"],
                                    correctAnswer: "Choice A",
                                    explanation: "Why A is correct..."
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        setPayload(JSON.stringify(template, null, 2));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <div className="absolute inset-0 bg-[#0A0A0A]/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl border border-primary/10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-primary/5 flex items-center justify-between bg-primary/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight italic text-[#1A1A1A]">Atomic Hierarchy Factory</h2>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Bulk content seeding & referential repair</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 flex flex-col lg:flex-row gap-8">
                    {/* Input Area */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2">
                                <Code2 size={14} className="text-primary" /> Hierarchy Payload (JSON)
                            </label>
                            <button
                                onClick={generateTemplate}
                                className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors flex items-center gap-1.5"
                            >
                                <Wand2 size={12} /> Generate Template
                            </button>
                        </div>
                        <textarea
                            value={payload}
                            onChange={(e) => setPayload(e.target.value)}
                            placeholder='{ "domainName": "...", "subjects": [...] }'
                            className="flex-1 min-h-[400px] w-full bg-muted/20 border border-primary/5 rounded-[2rem] p-6 font-mono text-xs focus:ring-2 focus:ring-primary/10 outline-none resize-none transition-all leading-relaxed"
                        />
                    </div>

                    {/* Feedback Side */}
                    <div className="w-full lg:w-80 flex flex-col gap-6">
                        <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <ShieldCheck size={14} /> Factory Rules
                            </h4>
                            <ul className="space-y-3">
                                <RuleItem label="Top-down integrity lookup" />
                                <RuleItem label="Transactional (All or Nothing)" />
                                <RuleItem label="Skip duplicates by name" />
                                <RuleItem label="Atomic ID resolution" />
                            </ul>
                        </div>

                        {error && (
                            <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10 animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 text-red-600 mb-2">
                                    <AlertTriangle size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Validation Error</span>
                                </div>
                                <p className="text-[11px] font-medium text-red-500/80 leading-relaxed uppercase">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-6 rounded-3xl bg-green-500/5 border border-green-500/10 animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 text-green-600 mb-2">
                                    <CheckCircle2 size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Seeding Complete</span>
                                </div>
                                <p className="text-[11px] font-medium text-green-600/80 uppercase">
                                    Operation successful. Inherited Domain ID: <span className="font-mono text-[9px] block mt-1">{success.domainId}</span>
                                </p>
                                <div className="mt-4 flex flex-col gap-2">
                                    <button
                                        onClick={onClose}
                                        className="w-full py-3 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                                    >
                                        Close Factory
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                {!success && (
                    <div className="p-8 border-t border-primary/5 bg-primary/[0.01] flex items-center justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
                        >
                            Discard
                        </button>
                        <button
                            disabled={isProcessing || !payload}
                            onClick={handleSeed}
                            className="px-10 py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                        >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap size={14} />}
                            Fire Factory Process
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function RuleItem({ label }: { label: string }) {
    return (
        <li className="flex items-center gap-3">
            <div className="w-1 h-1 rounded-full bg-primary/40" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{label}</span>
        </li>
    );
}
