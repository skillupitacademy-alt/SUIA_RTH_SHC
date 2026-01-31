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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <div className="absolute inset-0 bg-[#0A0A0A]/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative w-full max-w-7xl bg-white rounded-[3rem] shadow-2xl border border-primary/10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-primary/5 flex items-center justify-between bg-primary/[0.02]">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-primary text-white rounded-[1.5rem] shadow-xl shadow-primary/20 animate-pulse-slow">
                            <Zap size={28} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tight italic text-[#1A1A1A]">Atomic Hierarchy Factory</h2>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                <Activity size={12} className="text-primary" /> Integrated Intelligence & Seeding Console
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-muted rounded-full transition-all hover:scale-110 active:scale-90">
                        <X size={24} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Main Dashboard */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row divide-x divide-primary/5">
                    {/* Left: Editor & Intelligence */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 flex flex-col p-8 gap-4 overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-4">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2.5">
                                        <Code2 size={16} className="text-primary" /> Hierarchy Payload
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-black uppercase">Validation: JSON</span>
                                        {payload && <span className="text-[9px] font-bold text-muted-foreground">({payload.length} chars)</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 hover:bg-primary/5 rounded-xl text-primary transition-all flex items-center gap-2 group"
                                        title="Upload File"
                                    >
                                        <Upload size={16} className="group-hover:translate-y-[-2px] transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Upload .json</span>
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept=".json"
                                        className="hidden"
                                    />
                                    <div className="w-px h-4 bg-primary/10" />
                                    <button
                                        onClick={generateTemplate}
                                        className="px-4 py-2 bg-primary/5 hover:bg-primary/10 rounded-xl text-primary transition-all flex items-center gap-2"
                                    >
                                        <Wand2 size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Auto Stub</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 min-h-[400px] relative group">
                                <textarea
                                    value={payload}
                                    onChange={(e) => setPayload(e.target.value)}
                                    spellCheck={false}
                                    className="absolute inset-0 w-full h-full bg-[#0F1115] text-[#9CDCFE] border-2 border-primary/5 rounded-[2.5rem] p-8 font-mono text-xs focus:ring-4 focus:ring-primary/10 outline-none resize-none transition-all leading-relaxed shadow-inner"
                                    placeholder='{ "domainName": "...", "subjects": [...] }'
                                />
                                <div className="absolute right-6 bottom-6 flex items-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-mono text-white/50">Ln {payload.split("\n").length}, Col {payload.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Intelligence Panel */}
                    <div className="w-full lg:w-[400px] bg-slate-50/50 flex flex-col p-8 gap-6 overflow-y-auto">
                        {/* Intelligence Section */}
                        <div className="space-y-6">
                            <div className="p-6 rounded-[2rem] bg-white border border-primary/5 shadow-sm space-y-5">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1A1A1A] flex items-center gap-2.5">
                                    <Brain size={18} className="text-primary" /> Healing IQ Assistant
                                </h4>

                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 tracking-widest">Target Context</p>
                                        <div className="flex items-center gap-2 text-primary">
                                            <Layers size={14} />
                                            <span className="text-xs font-black truncate">
                                                {initialData?.subjects?.[0]?.topics?.[0]?.name || initialData?.subjects?.[0]?.name || initialData?.domainName || "Global Selection"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A] ml-1">AI Healing Prompt</label>
                                        <div className="relative">
                                            <textarea
                                                readOnly
                                                value={generateAiPrompt()}
                                                className="w-full bg-slate-900 text-slate-300 text-[10px] p-4 rounded-2xl font-medium leading-relaxed resize-none h-40 border border-white/5 shadow-lg"
                                            />
                                            <button
                                                onClick={() => copyToClipboard(generateAiPrompt())}
                                                className="absolute right-3 bottom-3 p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
                                                title="Copy to Clipboard"
                                            >
                                                <ClipboardCopy size={16} />
                                            </button>
                                        </div>
                                        <p className="text-[8px] font-bold text-muted-foreground italic px-2">Paste this into ChatGPT/Gemini to generate missing data.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Animated Execution Steps */}
                            <div className="p-6 rounded-[2rem] bg-white border border-primary/5 shadow-sm space-y-4">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1A1A1A] mb-4">Factory Pulse Tracker</h4>
                                <div className="space-y-3">
                                    <StepItem label="Integrity Lookup" status={executionStep === 'lookup' ? 'active' : (executionStep === 'idle' ? 'pending' : 'done')} />
                                    <StepItem label="Transactional Init" status={executionStep === 'transaction' ? 'active' : (['idle', 'lookup'].includes(executionStep) ? 'pending' : 'done')} />
                                    <StepItem label="Duplicate Filter" status={executionStep === 'filter' ? 'active' : (['idle', 'lookup', 'transaction'].includes(executionStep) ? 'pending' : 'done')} />
                                    <StepItem label="Atomic Commit" status={executionStep === 'commit' ? 'active' : (executionStep === 'done' ? 'done' : 'pending')} />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-6 rounded-[2rem] bg-red-50 border border-red-500/20 animate-in slide-in-from-right-4">
                                <div className="flex items-center gap-3 text-red-600 mb-2">
                                    <AlertTriangle size={18} />
                                    <span className="text-[11px] font-bold uppercase tracking-widest">Process Halted</span>
                                </div>
                                <p className="text-[11px] font-medium text-red-600/80 leading-relaxed">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-6 rounded-[2rem] bg-green-50 border border-green-500/20 animate-in slide-in-from-right-4">
                                <div className="flex items-center gap-3 text-green-600 mb-3">
                                    <CheckCircle2 size={24} />
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Seeding Fully Verified</span>
                                </div>
                                <div className="space-y-2 mb-4">
                                    <p className="text-[10px] font-bold text-green-700/70 uppercase tracking-widest leading-none">Result Summary</p>
                                    <div className="p-3 bg-white/50 rounded-xl border border-green-500/10">
                                        <p className="text-[9px] font-mono text-green-800 break-all">ID: {success.domainId}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-green-600 text-white rounded-[1.25rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                                >
                                    Close Console
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Controls */}
                {!success && (
                    <div className="p-8 border-t border-primary/5 bg-primary/[0.01] flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Terminal Ready</span>
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase max-w-sm leading-relaxed">Ensure content complies with professional certification standards before commit.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onClose}
                                className="px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted transition-all"
                            >
                                Discard
                            </button>
                            <button
                                disabled={isProcessing || !payload}
                                onClick={handleSeed}
                                className="px-12 py-5 rounded-[1.5rem] bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none group"
                            >
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <ShieldCheck size={18} className="group-hover:rotate-12 transition-transform" />}
                                FIRE ATOMIC UPLOAD
                            </button>
                        </div>
                    </div>
                )}
            </div>
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
