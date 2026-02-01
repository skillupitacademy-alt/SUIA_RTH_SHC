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
import { ZLoader } from '@/components/ui/ZLoader';
import { SelectField } from '@/components/entry/SelectionFields';
import { BlueprintFactoryWizard } from '@/components/content/BlueprintFactoryWizard';

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
    const [manualEntry, setManualEntry] = useState({ name: '', description: '', category: '', domainId: '', subjectId: '', topicId: '' });
    const [payload, setPayload] = useState(initialData ? JSON.stringify(initialData, null, 2) : '');
    const [showEditor, setShowEditor] = useState(!!initialData);
    const [isProcessing, setIsProcessing] = useState(false);
    const [executionStep, setExecutionStep] = useState<ExecutionStep>('idle');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<any>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [blueprintModal, setBlueprintModal] = useState({
        isOpen: false,
        domainId: '',
        domainName: '',
        questionIds: [] as string[],
        questionStats: null as any
    });
    const [existingDomains, setExistingDomains] = useState<string[]>([]);
    const [hierarchicalChoices, setHierarchicalChoices] = useState({
        domains: [] as any[],
        subjects: [] as any[],
        topics: [] as any[]
    });
    const [selections, setSelections] = useState({
        domainId: initialData?.domainId || '',
        subjectId: initialData?.subjectId || '',
        topicId: initialData?.topicId || ''
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsMounted(true);
        if (isOpen) {
            fetchExistingDomains();
        }
    }, [isOpen]);

    const fetchExistingDomains = async () => {
        try {
            const data = await apiClient.admin.getContentHealthReport();
            setExistingDomains(data.map((d: any) => d.domainName));
            setHierarchicalChoices(prev => ({ ...prev, domains: data }));
        } catch (e) {
            console.error("Failed to fetch existing domains", e);
        }
    };

    useEffect(() => {
        const fetchSubjects = async () => {
            if (selections.domainId) {
                try {
                    const data = await apiClient.admin.getSubjectsByDomain(selections.domainId);
                    setHierarchicalChoices(prev => ({ ...prev, subjects: data }));
                } catch (e) { console.error(e); }
            } else {
                setHierarchicalChoices(prev => ({ ...prev, subjects: [] }));
            }
        };
        fetchSubjects();
    }, [selections.domainId]);

    useEffect(() => {
        const fetchTopics = async () => {
            if (selections.subjectId) {
                try {
                    const data = await apiClient.admin.getTopicsBySubject(selections.subjectId);
                    setHierarchicalChoices(prev => ({ ...prev, topics: data }));
                } catch (e) { console.error(e); }
            } else {
                setHierarchicalChoices(prev => ({ ...prev, topics: [] }));
            }
        };
        fetchTopics();
    }, [selections.subjectId]);

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
        const target = initialData?.target || 'hierarchy';

        let base = `I need to generate a structured educational hierarchy.
        
IMPORTANT REQUIREMENT: 
The following items ALREADY EXIST in our system. DO NOT provide redundant records for existing names.
${existingDomains.join(', ')}

Please provide a valid JSON object matching this schema for NEW data only:`;

        if (target === 'domain') {
            return `I need to generate a list of new educational DOMAINS for our quiz platform.

Please provide a valid JSON object matching this schema:
{
  "batchDomains": [
    { "name": "string", "description": "string", "category": "string" }
  ]
}

- Focus on unique, high-level educational areas (e.g., "Full Stack Development", "Cloud Architecture").
- Provide at least 5-10 domains.
- Return ONLY the JSON object.`;
        }

        if (target === 'subject') {
            const domainName = hierarchicalChoices.domains.find(d => d.domainId === selections.domainId)?.domainName || "Selected Domain";
            return `I need to generate a list of SUBJECTS for the domain: "${domainName}".

Please provide a valid JSON object matching this schema:
{
  "domainId": "${selections.domainId}",
  "subjects": [
    { "name": "string" }
  ]
}

- Focus on core areas within "${domainName}".
- Return ONLY the JSON object.`;
        }

        if (target === 'topic') {
            const domainName = hierarchicalChoices.domains.find(d => d.domainId === selections.domainId)?.domainName || "Selected Domain";
            const subjectName = hierarchicalChoices.subjects.find(s => s.id === selections.subjectId)?.name || "Selected Subject";
            return `I need to generate a list of TOPICS for the subject: "${subjectName}" within "${domainName}".

Please provide a valid JSON object matching this schema:
{
  "domainId": "${selections.domainId}",
  "subjects": [
    {
      "id": "${selections.subjectId}",
      "topics": [
        { "name": "string" }
      ]
    }
  ]
}

- Focus on technical sub-disciplines.
- Return ONLY the JSON object.`;
        }

        if (target === 'subtopic') {
            const topicName = hierarchicalChoices.topics.find(t => t.id === selections.topicId)?.name || "Selected Topic";
            return `I need to generate granular SUBTOPICS and complex QUESTIONS for the topic: "${topicName}".

Please provide a valid JSON object matching this schema:
{
  "domainId": "${selections.domainId}",
  "subjects": [
    {
      "id": "${selections.subjectId}",
      "topics": [
        {
          "id": "${selections.topicId}",
          "subtopics": [
            { 
              "name": "string", 
              "questions": [
                {
                  "questionText": "string",
                  "options": ["A", "B", "C", "D"],
                  "correctAnswer": "string",
                  "difficulty": "simple|intermediate|expert",
                  "mappingType": "conceptual|technical|practical",
                  "skillNames": ["Skill A", "Skill B"]
                }
              ] 
            }
          ]
        }
      ]
    }
  ]
}

- Ensure 5 subtopics, each with 5 mixed-difficulty questions.
- Return ONLY the JSON object.`;
        }

        if (target === 'skill') {
            return `I need to generate a core set of SKILLS to be used across the platform.

Please provide a valid JSON object matching this schema:
{
  "batchSkills": [
    { "name": "string", "category": "technical|conceptual|process", "mappingType": "conceptual|technical|practical" }
  ]
}

- Focus on universal competencies (e.g., "Problem Solving", "API Design", "Security Posture").
- Return ONLY the JSON object.`;
        }

        // Default: Full Domain Hierarchy (Vertical)
        return `${base}\n{
  "domainName": "string",
  "subjects": [
    {
      "name": "string",
      "topics": [
        {
          "name": "string",
          "questions": [ ... ]
        }
      ]
    }
  ]
}\n\n- Ensure high-quality, professional questions.\n- Return ONLY the JSON object.`;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleCreate = async () => {
        setIsProcessing(true);
        setError(null);
        setSuccess(null);

        try {
            // Logic moved into setExecutionStep('filter') section for cleaner flow

            // Start Animated Sequence
            setExecutionStep('lookup');
            await new Promise(r => setTimeout(r, 800));

            setExecutionStep('transaction');
            await new Promise(r => setTimeout(r, 600));

            setExecutionStep('filter');

            let finalData: any = {};
            if (mode === 'manual') {
                const target = initialData?.target || 'domain';
                if (target === 'domain') finalData = { domainName: manualEntry.name };
                if (target === 'subject') finalData = { domainId: selections.domainId, subjects: [{ name: manualEntry.name }] };
                if (target === 'topic') finalData = { domainId: selections.domainId, subjects: [{ id: selections.subjectId, topics: [{ name: manualEntry.name }] }] };
                if (target === 'subtopic') finalData = {
                    domainId: selections.domainId,
                    subjects: [{
                        id: selections.subjectId,
                        topics: [{
                            id: selections.topicId,
                            subtopics: [{ name: manualEntry.name }]
                        }]
                    }]
                };
                if (target === 'skill') finalData = { batchSkills: [{ name: manualEntry.name }] };
            } else {
                finalData = JSON.parse(payload);
            }

            const result = await apiClient.admin.atomicSeed(finalData);

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
        const target = initialData?.target || 'hierarchy';
        let template: any = {};

        if (target === 'domain') {
            template = {
                batchDomains: [
                    { name: "Cloud Engineering", description: "Distributed systems and infrastructure.", category: "DevOps" },
                    { name: "Cybersecurity", description: "Threat detection and mitigation.", category: "Security" }
                ]
            };
        } else if (target === 'subject') {
            template = {
                domainId: selections.domainId || "DOMAIN_UUID",
                subjects: [
                    { name: "Frontend Development" },
                    { name: "Backend Architecture" }
                ]
            };
        } else if (target === 'topic') {
            template = {
                domainId: selections.domainId || "DOMAIN_UUID",
                subjects: [{
                    id: selections.subjectId || "SUBJECT_UUID",
                    topics: [
                        { name: "React Framework" },
                        { name: "Node.js Runtimes" }
                    ]
                }]
            };
        } else if (target === 'subtopic') {
            template = {
                domainId: selections.domainId || "DOMAIN_UUID",
                subjects: [{
                    id: selections.subjectId || "SUBJECT_UUID",
                    topics: [{
                        id: selections.topicId || "TOPIC_UUID",
                        subtopics: [
                            {
                                name: "Context API",
                                questions: [{
                                    questionText: "What is the purpose of Context API?",
                                    options: [
                                        { text: "Data storage", isCorrect: false },
                                        { text: "Prop drilling resolution", isCorrect: true },
                                        { text: "UI styling", isCorrect: false },
                                        { text: "Database sync", isCorrect: false }
                                    ],
                                    difficulty: "intermediate",
                                    mappingType: "conceptual"
                                }]
                            }
                        ]
                    }]
                }]
            };
        } else if (target === 'skill') {
            template = {
                batchSkills: [
                    { name: "Memory Management", category: "technical", mappingType: "technical" },
                    { name: "Critical Thinking", category: "cognitive", mappingType: "conceptual" }
                ]
            };
        } else {
            // Default Hierarchy template
            template = {
                domainName: "ENTER_NEW_DOMAIN",
                subjects: [{
                    name: "TOPIC_AREA_1",
                    topics: [{
                        name: "SPECIFIC_TOPIC",
                        questions: []
                    }]
                }]
            };
        }

        setPayload(JSON.stringify(template, null, 2));
        setShowEditor(true);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setPayload(event.target?.result as string);
            setShowEditor(true);
            setMode('bulk');
        };
        reader.readAsText(file);
    };

    if (!isOpen || !isMounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex flex-col bg-white animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-12 py-4 border-b border-primary/5 flex items-center justify-between bg-primary/[0.02]">
                <div className="flex items-center gap-5">
                    <div
                        className="p-2.5 bg-[#1A1A1A] text-[#FF4B91] rounded-2xl shadow-xl shadow-black/10"
                        title="Domain Factory Console: An advanced orchestration layer for bulk hierarchy ingestion and atomic state synchronization."
                    >
                        <Zap size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter italic text-[#1A1A1A]">Domain Factory_</h2>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-0.5 flex items-center gap-2">
                            System-Alpha • Manual Orchestration Active
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl">
                    <button
                        onClick={() => setMode('manual')}
                        title="Switch to Single Entry Mode: Manually define a single level of hierarchy (Domain, Subject, Topic, or Subtopic)."
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'manual' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
                        )}
                    >
                        Manual Entry
                    </button>
                    <button
                        onClick={() => setMode('bulk')}
                        title="Switch to Bulk Engine: Use AI prompts or JSON manifests to insert entire hierarchical branches at once."
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            mode === 'bulk' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
                        )}
                    >
                        Bulk Factory
                    </button>
                </div>

                <button
                    onClick={onClose}
                    title="Terminate current factory session and return to management dashboard."
                    className="p-3 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-2xl transition-all border border-transparent hover:border-red-100 italic font-black uppercase text-[10px] flex items-center gap-2"
                >
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
                                <h3 className="text-4xl font-black italic uppercase tracking-tighter text-[#1A1A1A]">
                                    {initialData?.target ? `Single ${initialData.target.charAt(0).toUpperCase() + initialData.target.slice(1)} Registry_` : "Single Domain Registry_"}
                                </h3>
                                <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                                    Register a new {initialData?.target || 'domain'}.
                                    {(!initialData?.target || initialData.target === 'domain') && " You will be able to customize the Assessment Blueprint after registration is complete."}
                                    {initialData?.domainName && ` Target Domain: ${initialData.domainName}`}
                                </p>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <Layers size={14} /> {initialData?.target?.toUpperCase() || 'DOMAIN'} IDENTITY NAME_
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={`e.g., Advanced ${initialData?.domainName || 'Engineering'}`}
                                        value={manualEntry.name}
                                        onChange={(e) => setManualEntry({ ...manualEntry, name: e.target.value })}
                                        className="w-full bg-[#FAFAFA] border-2 border-primary/5 rounded-3xl p-6 text-2xl font-black tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all placeholder:text-slate-300"
                                    />
                                </div>

                                {(['subject', 'topic', 'subtopic'].includes(initialData?.target)) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <SelectField
                                                label="Target Domain_"
                                                value={selections.domainId}
                                                options={hierarchicalChoices.domains.map(d => ({ id: d.domainId, name: d.domainName }))}
                                                loading={false}
                                                onChange={(id) => setSelections({ ...selections, domainId: id, subjectId: '', topicId: '' })}
                                                placeholder="Select Domain"
                                                active={true}
                                                hideCreate={true}
                                            />
                                        </div>

                                        {(['topic', 'subtopic'].includes(initialData?.target)) && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                <SelectField
                                                    label="Target Subject_"
                                                    value={selections.subjectId}
                                                    options={hierarchicalChoices.subjects}
                                                    loading={false}
                                                    onChange={(id) => setSelections({ ...selections, subjectId: id, topicId: '' })}
                                                    placeholder="Select Subject"
                                                    active={!!selections.domainId}
                                                    hideCreate={true}
                                                    disabled={!selections.domainId}
                                                />
                                            </div>
                                        )}

                                        {(initialData?.target === 'subtopic') && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                <SelectField
                                                    label="Target Topic_"
                                                    value={selections.topicId}
                                                    options={hierarchicalChoices.topics}
                                                    loading={false}
                                                    onChange={(id) => setSelections({ ...selections, topicId: id })}
                                                    placeholder="Select Topic"
                                                    active={!!selections.subjectId}
                                                    hideCreate={true}
                                                    disabled={!selections.subjectId}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(initialData?.target === 'domain' || !initialData) && (
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
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col gap-8 animate-in slide-in-from-right-4 overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-[#1A1A1A]">
                                        {initialData?.target ? `Bulk ${initialData.target} Factory_` : "Bulk Hierarchy Engine_"}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase rounded-lg">JSON STRICT_MODE</span>
                                        {!showEditor ? (
                                            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-lg italic">Intelligence Phase</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-green-500/10 text-green-600 text-[9px] font-black uppercase rounded-lg italic">Draft Phase</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {!showEditor ? (
                                <div className="flex-1 flex flex-col gap-6 animate-in zoom-in-95 duration-500 overflow-hidden">
                                    <div className="flex-1 rounded-[2.5rem] bg-white border-2 border-dashed border-slate-200 shadow-sm relative overflow-hidden flex flex-col group hover:border-primary/20 transition-all duration-500">
                                        <div className="px-10 py-6 border-b border-primary/5 flex items-center justify-between bg-slate-50/50">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-[#FF4B91]/10 rounded-xl text-[#FF4B91]">
                                                    <Brain size={20} />
                                                </div>
                                                <h4 className="text-lg font-black uppercase tracking-widest text-slate-800 italic">Surgical AI Prompt_</h4>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    copyToClipboard(generateAiPrompt());
                                                    setMode('bulk');
                                                }}
                                                title="Copy complete contextual prompt to clipboard. Paste this into your AI assistant to generate the required JSON manifest."
                                                className="p-3 bg-white hover:bg-primary text-slate-400 hover:text-white rounded-xl transition-all active:scale-95 shadow-sm hover:shadow-primary/20 border border-slate-100"
                                            >
                                                <ClipboardCopy size={20} />
                                            </button>
                                        </div>
                                        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                                            <div className="p-8 bg-slate-50/80 rounded-3xl border border-primary/5 text-sm font-bold text-slate-600 leading-relaxed font-mono whitespace-pre-wrap selection:bg-[#FF4B91]/20">
                                                {generateAiPrompt()}
                                            </div>
                                        </div>
                                        <div className="px-10 py-6 border-t border-primary/5 bg-slate-50/50 text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">
                                                Domain check filters active: {existingDomains.length} domains found.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowEditor(true)}
                                        title="Manually paste or edit the JSON manifest if you already have the generated data from an AI session."
                                        className="w-full group flex flex-col items-center justify-center gap-4 p-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] hover:bg-primary/[0.03] hover:border-primary/20 transition-all duration-500"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:scale-110 transition-all duration-500">
                                            <FileJson size={32} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-primary transition-all">
                                                Already have the JSON? <span className="text-primary italic">Enter Manual Manifest Mode_</span>
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Unlock Editor for Payload Injection</p>
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 relative group animate-in fade-in slide-in-from-bottom-4">
                                    <textarea
                                        value={payload}
                                        onChange={(e) => setPayload(e.target.value)}
                                        spellCheck={false}
                                        className="absolute inset-0 w-full h-full bg-white text-slate-800 border-2 border-dashed border-primary/20 rounded-[2.5rem] p-12 font-mono text-xl focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all leading-relaxed shadow-sm resize-none selection:bg-primary/20 placeholder:text-slate-300"
                                        placeholder='{
  "domainName": "...",
  "subjects": [
    {
      "name": "...",
      "topics": [...]
    }
  ]
}

PASTE YOUR JSON MANIFEST HERE_'
                                    />
                                    <div className="absolute right-10 bottom-10 px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-[11px] font-mono text-white/90 backdrop-blur-xl flex items-center gap-3 shadow-xl">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        PAYLOAD_SIZE: {payload.length} BYTES
                                    </div>
                                </div>
                            )}
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

                            {success.stats && (
                                <div className="p-4 rounded-3xl bg-white/50 border border-green-200/50 space-y-3">
                                    <h5 className="text-[9px] font-black uppercase tracking-widest text-green-800/60 text-left px-2">Registry Summary_</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(success.stats).map(([k, v]: [string, any]) => (
                                            (v.added > 0 || v.skipped > 0) && (
                                                <div key={k} className="p-3 bg-white rounded-2xl border border-green-100 flex items-center justify-between">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{k}</span>
                                                    <div className="flex gap-2">
                                                        {v.added > 0 && <span className="text-[9px] font-black px-1.5 py-0.5 bg-green-100 text-green-700 rounded-md">+{v.added}</span>}
                                                        {v.skipped > 0 && <span className="text-[9px] font-black px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md text-nowrap">Skipped: {v.skipped}</span>}
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => setBlueprintModal({
                                        isOpen: true,
                                        domainId: success.domainId,
                                        domainName: manualEntry.name || (mode === 'bulk' && payload ? JSON.parse(payload).domainName : "Assessment"),
                                        questionIds: success.questionIds || [],
                                        questionStats: success.questionStats
                                    })}
                                    title="Open the static configuration panel to lock specific questions and calibrate the assessment blueprint for this domain."
                                    className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 px-6 shadow-xl"
                                >
                                    <ClipboardList size={16} />
                                    Configure Blueprint
                                </button>
                                <button
                                    onClick={onClose}
                                    title="Close the factory engine and return to the domain overview. All hierarchical records have been safely committed."
                                    className="w-full py-4 bg-white border border-green-200 text-green-700 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-green-100 transition-all flex items-center justify-center gap-3 px-6"
                                >
                                    Close Engine
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Utility Clustering at Bottom */}
                    <div className="mt-auto pt-8 border-t border-primary/5 space-y-3">
                        {mode === 'bulk' && (
                            <div className="grid grid-cols-1 gap-5">
                                {showEditor && (
                                    <button
                                        onClick={() => setShowEditor(false)}
                                        title="Return to the Surgical AI Prompt to copy requirements or verify context. This ensures the manual JSON adheres to the architectural rules of the project."
                                        className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 text-slate-600 shadow-sm hover:scale-[1.01]"
                                    >
                                        <Wand2 size={16} /> Back to Prompt
                                    </button>
                                )}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Load a .json manifest file from your local storage. This is the fastest way to re-run previously validated batches or bulk-import legacy content."
                                    className="w-full px-6 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 hover:border-slate-300 transition-all flex items-center justify-center gap-3 text-slate-700 shadow-sm hover:scale-[1.01]"
                                >
                                    <Upload size={16} /> Upload Manifest
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
                                <button
                                    onClick={generateTemplate}
                                    title="Populate the editor with a pre-defined schema matching your current target. Use this as a secure template for manual hierarchy definition."
                                    className="w-full px-6 py-4 bg-[#FF4B91]/5 text-[#FF4B91] border-2 border-[#FF4B91]/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#FF4B91]/10 hover:border-[#FF4B91]/20 transition-all flex items-center justify-center gap-3 shadow-none hover:shadow-lg hover:shadow-[#FF4B91]/10 hover:scale-[1.01]"
                                >
                                    <LayoutGrid size={16} /> Import Template
                                </button>
                            </div>
                        )}
                    </div>
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
                            title="Cancel current operation and close the Terminal. Warning: Uncommitted manual entries or unsaved manifests will be lost."
                            className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-slate-50 rounded-2xl transition-all"
                        >
                            Abort Process
                        </button>
                        <button
                            disabled={isProcessing || (mode === 'manual' && !manualEntry.name) || (mode === 'bulk' && !payload)}
                            onClick={handleCreate}
                            title={mode === 'manual' ? `Commit the current entry for "${manualEntry.name}" to the live database.` : "Execute the atomic hierarchy insertion. This will validate the JSON, lookup existing records, and perform a transactional commit."}
                            className="px-12 py-4 bg-[#FF4B91] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-[#FF4B91]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:grayscale disabled:opacity-50"
                        >
                            {isProcessing ? <ZLoader size="xs" className="text-white" center={false} /> : <ShieldCheck size={16} />}
                            {mode === 'manual' ? `Commit ${initialData?.target || 'Domain'}` : "Fire Bulk Factory"}
                        </button>
                    </div>
                </div>
            )}
            {/* Blueprint Configuration Modal */}
            <BlueprintFactoryWizard
                isOpen={blueprintModal.isOpen}
                domainId={blueprintModal.domainId}
                domainName={blueprintModal.domainName}
                questionIds={blueprintModal.questionIds}
                questionStats={blueprintModal.questionStats}
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
                {status === 'active' ? <ZLoader size="xs" center={false} /> :
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
