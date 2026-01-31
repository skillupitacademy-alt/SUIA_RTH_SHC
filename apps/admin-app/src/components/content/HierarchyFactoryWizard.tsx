'use client';

import { useState, useEffect, useRef } from 'react';
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
    CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HierarchyFactoryWizardProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    onSuccess?: () => void;
}

type ExecutionStep = 'idle' | 'lookup' | 'transaction' | 'filter' | 'commit' | 'done';

export function HierarchyFactoryWizard({ isOpen, onClose, initialData, onSuccess }: HierarchyFactoryWizardProps) {
    const [payload, setPayload] = useState(initialData ? JSON.stringify(initialData, null, 2) : '');
    const [isProcessing, setIsProcessing] = useState(false);
    const [executionStep, setExecutionStep] = useState<ExecutionStep>('idle');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<any>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI Prompt Generation Logic
    const generateAiPrompt = () => {
        let contextInfo = "educational hierarchy";
        try {
            const data = JSON.parse(payload || JSON.stringify(initialData || {}));
            if (data.domainName) contextInfo = `domain "${data.domainName}"`;
            if (data.subjects?.[0]?.name) contextInfo += ` and subject "${data.subjects[0].name}"`;
            if (data.subjects?.[0]?.topics?.[0]?.name) contextInfo += ` and topic "${data.subjects[0].topics[0].name}"`;
        } catch (e) { }

        return `I need to generate structured educational content for ${contextInfo}. 
Please provide exactly 10 questions in a valid JSON array format that matches this schema:
{
  "questionText": "string",
  "difficulty": "simple" | "intermediate" | "expert",
  "type": "mcq" | "code_mcq",
  "options": ["string", "string", "string", "string"],
  "correctAnswer": "the exact string from options",
  "explanation": "string explaining why"
}

Ensure a mix of difficulties (at least 4 simple, 4 intermediate, 5 expert total for the topic if possible).
Match the tone of professional certification exams. 
Return ONLY the JSON array inside a "questions" key.`;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast here if we had a toast system
    };

    const handleSeed = async () => {
        setIsProcessing(true);
        setError(null);
        setSuccess(null);

        try {
            const data = JSON.parse(payload);

            // Start Animated Sequence
            setExecutionStep('lookup');
            await new Promise(r => setTimeout(r, 800)); // Visual pause

            setExecutionStep('transaction');
            await new Promise(r => setTimeout(r, 600));

            setExecutionStep('filter');
            await new Promise(r => setTimeout(r, 600));

            setExecutionStep('commit');
            const result = await apiClient.admin.atomicSeed(data);

            setExecutionStep('done');
            await new Promise(r => setTimeout(r, 400));

            setSuccess(result);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to process hierarchy factory request. Please verify your JSON structure.");
            setExecutionStep('idle');
        } finally {
            setIsProcessing(false);
        }
    };

    const generateTemplate = () => {
        if (initialData) {
            const template = JSON.parse(JSON.stringify(initialData));
            if (template.subjects && template.subjects.length > 0) {
                const subject = template.subjects[0];
                if (subject.topics && subject.topics.length > 0) {
                    const topic = subject.topics[0];
                    if (!topic.questions || topic.questions.length === 0) {
                        topic.questions = Array(3).fill({
                            questionText: "ENTER_QUESTION_TEXT",
                            difficulty: "simple",
                            type: "mcq",
                            options: ["A", "B", "C", "D"],
                            correctAnswer: "A",
                            explanation: "..."
                        });
                    }
                } else {
                    subject.topics = [{ name: "ENTER_TOPIC_NAME", questions: [] }];
                }
            } else {
                template.subjects = [{ name: "ENTER_SUBJECT_NAME", topics: [] }];
            }
            setPayload(JSON.stringify(template, null, 2));
        } else {
            const template = {
                domainName: "ENTER_DOMAIN_NAME",
                subjects: [{
                    name: "ENTER_SUBJECT_NAME",
                    topics: [{
                        name: "ENTER_TOPIC_NAME",
                        questions: [{
                            questionText: "Sample Question?",
                            difficulty: "simple",
                            type: "mcq",
                            options: ["Choice A", "Choice B", "Choice C", "Choice D"],
                            correctAnswer: "Choice A",
                            explanation: "Why A is correct..."
                        }]
                    }]
                }]
            };
            setPayload(JSON.stringify(template, null, 2));
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setPayload(event.target?.result as string);
        };
        reader.readAsText(file);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in fade-in duration-300">
            {/* Header */}
            <div className="p-8 border-b border-primary/5 flex items-center justify-between bg-primary/[0.02]">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-primary text-white rounded-[1.5rem] shadow-xl shadow-primary/20 animate-pulse-slow">
                        <Zap size={32} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black uppercase tracking-tight italic text-[#1A1A1A]">Atomic Hierarchy Factory</h2>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                            <Activity size={14} className="text-primary" /> Executive Content Intelligence Console
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="p-4 hover:bg-muted rounded-full transition-all hover:scale-110 active:scale-90 bg-slate-100 flex items-center justify-center">
                    <X size={32} className="text-muted-foreground" />
                </button>
            </div>

            {/* Main Dashboard */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row divide-x divide-primary/5">
                {/* Left: Editor Section */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    <div className="flex-1 flex flex-col p-12 gap-8 overflow-hidden">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-black uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2.5">
                                    <Code2 size={24} className="text-primary" /> Hierarchy Payload
                                </label>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase shadow-sm">Validation: JSON</span>
                                    {payload && <span className="text-xs font-bold text-muted-foreground bg-slate-100 px-2 py-1 rounded-lg">({payload.length} chars)</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-6 py-3 hover:bg-primary/5 rounded-2xl text-primary transition-all flex items-center gap-3 group border border-primary/10 shadow-sm bg-white"
                                    title="Upload .json file"
                                >
                                    <Upload size={20} className="group-hover:translate-y-[-2px] transition-transform" />
                                    <span className="text-xs font-black uppercase tracking-widest">Upload File</span>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".json"
                                    className="hidden"
                                />
                                <div className="w-px h-8 bg-primary/10" />
                                <button
                                    onClick={generateTemplate}
                                    className="px-8 py-3.5 bg-primary/5 hover:bg-primary/10 rounded-2xl text-primary transition-all flex items-center gap-3 border border-primary/10 shadow-sm group"
                                >
                                    <Wand2 size={20} className="group-hover:rotate-12 transition-transform" />
                                    <span className="text-xs font-black uppercase tracking-widest">Auto Template</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 relative group">
                            <textarea
                                value={payload}
                                onChange={(e) => setPayload(e.target.value)}
                                spellCheck={false}
                                className="absolute inset-0 w-full h-full bg-[#0F1115] text-[#9CDCFE] border-2 border-primary/5 rounded-[3rem] p-12 font-mono text-xl focus:ring-8 focus:ring-primary/5 outline-none transition-all leading-relaxed shadow-2xl resize-none"
                                placeholder='{ "domainName": "...", "subjects": [...] }'
                            />
                            <div className="absolute right-12 bottom-12 flex items-center gap-4 opacity-30 group-hover:opacity-100 transition-opacity">
                                <div className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-mono text-white/50 shadow-lg backdrop-blur-xl">
                                    Ln {payload.split("\n").length}, Col {payload.length}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Intelligence Panel */}
                <div className="w-full lg:w-[600px] bg-slate-50/50 flex flex-col p-12 gap-10 overflow-y-auto custom-scrollbar">
                    <div className="space-y-10">
                        {/* Intelligence Section */}
                        <div className="p-10 rounded-[3rem] bg-white border border-primary/5 shadow-xl space-y-8">
                            <h4 className="text-base font-black uppercase tracking-[0.2em] text-[#1A1A1A] flex items-center gap-4">
                                <Brain size={28} className="text-primary" /> Healing IQ Assistant
                            </h4>

                            <div className="space-y-8">
                                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 shadow-inner">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-3 tracking-widest">Target Context</p>
                                    <div className="flex items-center gap-3 text-primary">
                                        <Layers size={24} />
                                        <span className="text-xl font-black truncate">
                                            {initialData?.subjects?.[0]?.topics?.[0]?.name || initialData?.subjects?.[0]?.name || initialData?.domainName || "Global Selection"}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-[#1A1A1A] ml-2">Surgical AI Prompt</label>
                                    <div className="relative group/prompt">
                                        <textarea
                                            readOnly
                                            value={generateAiPrompt()}
                                            className="w-full bg-slate-900 text-slate-300 text-lg p-10 rounded-[2.5rem] font-medium leading-relaxed resize-none h-96 border border-white/5 shadow-2xl group-hover/prompt:border-primary/30 transition-all font-mono"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(generateAiPrompt())}
                                            className="absolute right-8 bottom-8 px-8 py-5 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group/btn"
                                            title="Copy to Clipboard"
                                        >
                                            <ClipboardCopy size={24} />
                                            <span className="text-xs font-black uppercase tracking-widest">Copy Prompt</span>
                                        </button>
                                    </div>
                                    <p className="text-xs font-bold text-muted-foreground italic px-3 text-center">Paste this into Chat LLM to generate production JSON.</p>
                                </div>
                            </div>
                        </div>

                        {/* Animated Execution Steps */}
                        <div className="p-10 rounded-[3rem] bg-white border border-primary/5 shadow-xl space-y-10">
                            <h4 className="text-base font-black uppercase tracking-[0.2em] text-[#1A1A1A] flex items-center gap-4">
                                <Activity size={28} className="text-primary" /> Pulse Tracker
                            </h4>
                            <div className="space-y-6">
                                <StepItem label="Integrity Lookup" status={executionStep === 'lookup' ? 'active' : (executionStep === 'idle' ? 'pending' : 'done')} />
                                <StepItem label="Transactional Init" status={executionStep === 'transaction' ? 'active' : (['idle', 'lookup'].includes(executionStep) ? 'pending' : 'done')} />
                                <StepItem label="Duplicate Filter" status={executionStep === 'filter' ? 'active' : (['idle', 'lookup', 'transaction'].includes(executionStep) ? 'pending' : 'done')} />
                                <StepItem label="Atomic Commit" status={executionStep === 'commit' ? 'active' : (executionStep === 'done' ? 'done' : 'pending')} />
                            </div>
                        </div>

                        {error && (
                            <div className="p-8 rounded-[2.5rem] bg-red-50 border border-red-500/20 animate-in slide-in-from-right-8 shadow-2xl shadow-red-500/5">
                                <div className="flex items-center gap-4 text-red-600 mb-4">
                                    <AlertTriangle size={32} />
                                    <span className="text-lg font-black uppercase tracking-widest">Process Halted</span>
                                </div>
                                <p className="text-base font-medium text-red-600/80 leading-relaxed bg-white/50 p-6 rounded-2xl border border-red-500/10">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-10 rounded-[2.5rem] bg-green-50 border border-green-500/20 animate-in slide-in-from-right-10 shadow-2xl shadow-green-500/10 space-y-8">
                                <div className="flex items-center gap-5 text-green-600">
                                    <CheckCircle2 size={48} />
                                    <div>
                                        <span className="text-xl font-black uppercase tracking-[0.1em] block">Seeding Verified</span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Atomic Commit Success</span>
                                    </div>
                                </div>
                                <div className="p-8 bg-white rounded-[2rem] border border-green-500/10 shadow-inner">
                                    <p className="text-sm font-mono text-green-800 break-all leading-relaxed">{success.domainId}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-full py-8 bg-green-600 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-[0.2em] hover:bg-green-700 transition-all shadow-2xl shadow-green-600/40 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4"
                                >
                                    <CheckCircle size={28} />
                                    Close Command Center
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Controls */}
            {!success && (
                <div className="px-12 py-10 border-t border-primary/5 bg-primary/[0.01] flex items-center justify-between bg-white">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-4">
                            <div className="w-4 h-4 rounded-full bg-primary animate-ping" />
                            <span className="text-sm font-black uppercase tracking-widest text-primary">Terminal Ready</span>
                        </div>
                        <p className="text-sm font-bold text-muted-foreground uppercase leading-relaxed max-w-2xl">Ensure content complies with professional certification standards before commit.</p>
                    </div>
                    <div className="flex items-center gap-8">
                        <button
                            onClick={onClose}
                            className="px-16 py-7 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted transition-all"
                        >
                            Discard
                        </button>
                        <button
                            disabled={isProcessing || !payload}
                            onClick={handleSeed}
                            className="px-24 py-7 rounded-[1.5rem] bg-primary text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-6 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none group"
                        >
                            {isProcessing ? <Loader2 className="h-8 w-8 animate-spin text-white" /> : <ShieldCheck size={32} className="group-hover:rotate-12 transition-transform" />}
                            FIRE ATOMIC SEED
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function StepItem({ label, status }: { label: string, status: 'pending' | 'active' | 'done' }) {
    return (
        <div className={cn(
            "flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-500",
            status === 'active' ? "bg-primary/5 border-primary/20 scale-[1.02]" :
                status === 'done' ? "bg-green-50 border-green-500/10" : "bg-transparent border-primary/[0.03]"
        )}>
            <div className="flex items-center gap-3">
                {status === 'active' ? <Loader2 size={14} className="animate-spin text-primary" /> :
                    status === 'done' ? <CheckCircle size={14} className="text-green-500" /> :
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-primary/20" />}
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    status === 'active' ? "text-primary italic" :
                        status === 'done' ? "text-green-600" : "text-muted-foreground"
                )}>
                    {label}
                </span>
            </div>
            {status === 'active' && <div className="text-[8px] font-black text-primary animate-pulse">RUNNING</div>}
        </div>
    );
}
