'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    ShieldCheck,
    Upload,
    Brain,
    Layers,
    Activity,
    CheckCircle,
    Plus,
    LayoutGrid,
    Search,
    RefreshCw,
    ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlueprintFactoryWizard } from './BlueprintFactoryWizard';

interface HierarchyFactoryWizardProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    onSuccess?: () => void;
}

type ExecutionStep = 'idle' | 'lookup' | 'transaction' | 'filter' | 'done';
type FactoryMode = 'manual' | 'bulk';

export function HierarchyFactoryWizard({ isOpen, onClose, initialData, onSuccess }: HierarchyFactoryWizardProps) {
    const [mode, setMode] = useState<FactoryMode>('manual');
    const [manualDomain, setManualDomain] = useState({ name: '', description: '' });
    const [payload, setPayload] = useState(initialData ? JSON.stringify(initialData, null, 2) : '');
    const [isProcessing, setIsProcessing] = useState(false);
    const [executionStep, setExecutionStep] = useState<ExecutionStep>('idle');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<any>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [blueprintModal, setBlueprintModal] = useState({ isOpen: false, domainId: '', domainName: '' });
    const [existingDomains, setExistingDomains] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsMounted(true);
        if (isOpen) {
            fetchExistingDomains();
        }
    }, [isOpen]);

    const fetchExistingDomains = async () => {
        try {
            const data = await apiClient.admin.getContentHealth();
            setExistingDomains(data.map((d: any) => d.domainName));
        } catch (e) {
            console.error("Failed to fetch existing domains", e);
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // AI Prompt Generation Logic
    const generateAiPrompt = () => {
        return `I need to generate a structured educational domain hierarchy.
        
IMPORTANT REQUIREMENT: 
The following domains ALREADY EXIST in our system. DO NOT provide records for:
${existingDomains.join(', ')}

Please provide a valid JSON object matching this schema for NEW domains only:
{
  "domainName": "string",
  "subjects": [
    {
      "name": "string",
      "topics": [
        {
          "name": "string",
          "questions": [
             {
               "questionText": "string",
               "difficulty": "simple" | "intermediate" | "expert",
               "type": "mcq" | "code_mcq",
               "options": ["string", "string", "string", "string"],
               "correctAnswer": "exact string",
               "explanation": "string",
               "skillNames": ["string"],
               "mappingType": "conceptual" | "technical" | "practical",
               "skillWeight": number (1-10)
             }
          ]
        }
      ]
    }
  ]
}

- Ensure high-quality, professional questions.
- Return ONLY the JSON object.
`;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleCreate = async () => {
        setIsProcessing(true);
        setError(null);
        setSuccess(null);

        try {
            const data = mode === 'manual'
                ? { domainName: manualDomain.name }
                : JSON.parse(payload);

            // Start Animated Sequence
            setExecutionStep('lookup');
            await new Promise(r => setTimeout(r, 800));

            setExecutionStep('transaction');
            await new Promise(r => setTimeout(r, 600));

            setExecutionStep('filter');
            const result = await apiClient.admin.atomicSeed(data);

            setExecutionStep('done');
            await new Promise(r => setTimeout(r, 400));

            setSuccess(result);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to process hierarchy factory request. Please verify your data.");
            setExecutionStep('idle');
        } finally {
            setIsProcessing(false);
        }
    };

    const generateTemplate = () => {
        const template = {
            domainName: "ENTER_NEW_DOMAIN",
            subjects: [{
                name: "TOPIC_AREA_1",
                topics: [{
                    name: "SPECIFIC_TOPIC",
                    questions: []
                }]
            }]
        };
        setPayload(JSON.stringify(template, null, 2));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setPayload(event.target?.result as string);
            setMode('bulk');
        };
        reader.readAsText(file);
    };

    if (!isOpen || !isMounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex flex-col bg-white animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-12 py-6 border-b border-primary/5 flex items-center justify-between bg-primary/[0.02]">
                <div className="flex items-center gap-5">
                    <div className="p-3.5 bg-[#1A1A1A] text-[#FF4B91] rounded-2xl shadow-xl shadow-black/10">
                        <Zap size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic text-[#1A1A1A]">Domain Factory_</h2>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                            System-Alpha • Manual Orchestration Active
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl">
                    <button
                        onClick={() => setMode('manual')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'manual' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
                        )}
                    >
                        Manual Entry
                    </button>
                    <button
                        onClick={() => setMode('bulk')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'bulk' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
                        )}
                    >
                        Bulk Factory
                    </button>
                </div>

                <button onClick={onClose} className="p-3 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-2xl transition-all border border-transparent hover:border-red-100 italic font-black uppercase text-[10px] flex items-center gap-2">
                    <X size={20} /> Close Terminal
                </button>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden lg:flex-row divide-x divide-primary/5">
                {/* Workspace Area */}
                <div className="flex-1 flex flex-col overflow-hidden p-12 gap-10">
                    {mode === 'manual' ? (
                        <div className="max-w-3xl w-full mx-auto space-y-12 animate-in slide-in-from-left-4">
                            <div className="space-y-4">
                                <h3 className="text-4xl font-black italic uppercase tracking-tighter text-[#1A1A1A]">Single Domain Registry</h3>
                                <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                                    Register a new educational domain. You will be able to customize the **Assessment Blueprint** after registration is complete.
                                </p>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <Layers size={14} /> Domain Identity Name_
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Advanced React Engineering"
                                        value={manualDomain.name}
                                        onChange={(e) => setManualDomain({ ...manualDomain, name: e.target.value })}
                                        className="w-full bg-[#FAFAFA] border-2 border-primary/5 rounded-3xl p-6 text-2xl font-black tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all placeholder:text-slate-300"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2 opacity-40">
                                        <Activity size={14} /> Factory Compliance_
                                    </label>
                                    <div className="p-6 rounded-3xl border border-dashed border-primary/10 bg-primary/[0.01] flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Blueprint creation is now a **manual Admin action**.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-right-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#1A1A1A]">Bulk Hierarchy Engine</h3>
                                    <span className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase rounded-lg">JSON STRICT_MODE</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-6 py-2.5 bg-white border border-primary/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                                    >
                                        <Upload size={14} /> Upload Manifest
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
                                    <button
                                        onClick={generateTemplate}
                                        className="px-6 py-2.5 bg-primary/5 text-primary border border-primary/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all flex items-center gap-2"
                                    >
                                        <Wand2 size={14} /> Import Template
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 relative group">
                                <textarea
                                    value={payload}
                                    onChange={(e) => setPayload(e.target.value)}
                                    spellCheck={false}
                                    className="absolute inset-0 w-full h-full bg-[#0F1115] text-[#9CDCFE] border-2 border-primary/5 rounded-[2.5rem] p-10 font-mono text-lg focus:ring-8 focus:ring-primary/5 outline-none transition-all leading-relaxed shadow-2xl resize-none"
                                    placeholder='{ "domainName": "...", "subjects": [...] }'
                                />
                                <div className="absolute right-8 bottom-8 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono text-white/40 backdrop-blur-md">
                                    CHAR_COUNT: {payload.length}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar: Intelligence & Steps */}
                <div className="w-full lg:w-[480px] bg-slate-50/50 flex flex-col p-8 gap-8 overflow-y-auto">
                    {/* execution tracker */}
                    <div className="p-8 rounded-[2rem] bg-white border border-primary/5 shadow-xl space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A1A] flex items-center gap-3">
                            <Activity size={18} className="text-primary" /> Execution Timeline
                        </h4>

                        <div className="space-y-4">
                            <ExecutionItem label="Data Validation" status={executionStep === 'idle' ? 'pending' : (['lookup', 'transaction', 'filter', 'blueprint', 'done'].includes(executionStep) ? 'done' : 'pending')} />
                            <ExecutionItem label="Database Lookup" status={executionStep === 'lookup' ? 'active' : (['transaction', 'filter', 'blueprint', 'done'].includes(executionStep) ? 'done' : 'pending')} />
                            <ExecutionItem label="Registry Transaction" status={executionStep === 'transaction' ? 'active' : (['filter', 'done'].includes(executionStep) ? 'done' : 'pending')} />
                            <ExecutionItem label="Hierarchy Sealing" status={executionStep === 'filter' ? 'active' : (executionStep === 'done' ? 'done' : 'pending')} />
                        </div>
                    </div>

                    {/* AI Assistance */}
                    {mode === 'bulk' && !success && (
                        <div className="p-8 rounded-[2rem] bg-slate-900 border border-white/5 shadow-2xl space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-3">
                                    <Brain size={18} className="text-[#FF4B91]" /> Surgical AI Prompt
                                </h4>
                                <button
                                    onClick={() => copyToClipboard(generateAiPrompt())}
                                    className="p-2 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                >
                                    <ClipboardCopy size={16} />
                                </button>
                            </div>
                            <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-[11px] font-medium text-slate-400 leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                                {generateAiPrompt()}
                            </div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center italic">
                                Domain check filters active: {existingDomains.length} domains found.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-600 animate-in shake-1 space-y-2">
                            <div className="flex items-center gap-2 font-black uppercase text-xs">
                                <AlertTriangle size={16} /> Factory Halted
                            </div>
                            <p className="text-[11px] font-bold">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="p-8 rounded-[2rem] bg-green-50 border border-green-200 animate-in slide-in-from-bottom-4 shadow-2xl shadow-green-500/10 space-y-6 text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/30">
                                <CheckCircle2 size={32} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black uppercase tracking-tighter text-green-800 italic">Emission Successful_</h4>
                                <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mt-1">Domain ID: {success.domainId}</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => setBlueprintModal({ isOpen: true, domainId: success.domainId, domainName: manualDomain.name || JSON.parse(payload).domainName })}
                                    className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 px-6 shadow-xl"
                                >
                                    <ClipboardList size={16} />
                                    Configure Blueprint
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-white border border-green-200 text-green-700 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-green-100 transition-all flex items-center justify-center gap-3 px-6"
                                >
                                    Close Engine
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            {!success && (
                <div className="px-12 py-6 border-t border-primary/5 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Terminal v1.1 Active</span>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {mode === 'manual' ? "Creating a single entry container." : "Executing parallel hierarchy insertion."}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-slate-50 rounded-2xl transition-all"
                        >
                            Abort Process
                        </button>
                        <button
                            disabled={isProcessing || (mode === 'manual' && !manualDomain.name) || (mode === 'bulk' && !payload)}
                            onClick={handleCreate}
                            className="px-12 py-4 bg-[#1A1A1A] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:grayscale disabled:opacity-50"
                        >
                            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                            {mode === 'manual' ? "Commit Domain" : "Fire Bulk Factory"}
                        </button>
                    </div>
                </div>
            )}
            {/* Blueprint Configuration Modal */}
            <BlueprintFactoryWizard
                isOpen={blueprintModal.isOpen}
                domainId={blueprintModal.domainId}
                domainName={blueprintModal.domainName}
                onClose={() => {
                    setBlueprintModal(prev => ({ ...prev, isOpen: false }));
                    onClose();
                }}
            />
        </div>,
        document.body
    );
}

function ExecutionItem({ label, status }: { label: string, status: 'pending' | 'active' | 'done' }) {
    return (
        <div className={cn(
            "flex items-center justify-between p-4 rounded-2xl border transition-all duration-500",
            status === 'active' ? "bg-primary/[0.03] border-primary/20 scale-[1.02] shadow-sm" :
                status === 'done' ? "bg-green-500/[0.02] border-green-500/10" : "bg-transparent border-primary/5 opacity-40 grayscale"
        )}>
            <div className="flex items-center gap-3">
                {status === 'active' ? <Loader2 size={14} className="animate-spin text-primary" /> :
                    status === 'done' ? <CheckCircle size={14} className="text-green-500" /> :
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-primary/10" />}
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    status === 'active' ? "text-primary italic" :
                        status === 'done' ? "text-green-600" : "text-muted-foreground"
                )}>
                    {label}
                </span>
            </div>
            {status === 'active' && <span className="text-[8px] font-black text-primary animate-pulse tracking-widest">BUSY...</span>}
        </div>
    );
}
