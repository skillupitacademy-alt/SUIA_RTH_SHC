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
    ClipboardList,
    ArrowUp,
    ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZLoader } from '@/components/ui/ZLoader';
import { ZTooltip } from '@/components/ui/ZTooltip';
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
    const [showEditor, setShowEditor] = useState(false);
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
    const [loadingChoices, setLoadingChoices] = useState({
        domains: false,
        subjects: false,
        topics: false
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
        setLoadingChoices(prev => ({ ...prev, domains: true }));
        try {
            const data = await apiClient.admin.getContentHealthReport();
            setExistingDomains(data.map((d: any) => d.domainName));
            setHierarchicalChoices(prev => ({ ...prev, domains: data }));
        } catch (e) {
            console.error("Failed to fetch existing domains", e);
        } finally {
            setLoadingChoices(prev => ({ ...prev, domains: false }));
        }
    };

    useEffect(() => {
        const fetchSubjects = async () => {
            if (selections.domainId) {
                setLoadingChoices(prev => ({ ...prev, subjects: true }));
                try {
                    const data = await apiClient.admin.getSubjectsByDomain(selections.domainId);
                    setHierarchicalChoices(prev => ({ ...prev, subjects: data }));
                } catch (e) { console.error(e); }
                finally { setLoadingChoices(prev => ({ ...prev, subjects: false })); }
            } else {
                setHierarchicalChoices(prev => ({ ...prev, subjects: [] }));
            }
        };
        fetchSubjects();
    }, [selections.domainId]);

    useEffect(() => {
        const fetchTopics = async () => {
            if (selections.subjectId) {
                setLoadingChoices(prev => ({ ...prev, topics: true }));
                try {
                    const data = await apiClient.admin.getTopicsBySubject(selections.subjectId);
                    setHierarchicalChoices(prev => ({ ...prev, topics: data }));
                } catch (e) { console.error(e); }
                finally { setLoadingChoices(prev => ({ ...prev, topics: false })); }
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

        // Resolve parent names from either initialData or state lookups
        // Resolve parent names dynamically from state first (enabling context switching), backing off to initialData only if needed.
        const domainName = hierarchicalChoices.domains.find(d => d.domainId === selections.domainId)?.domainName || (selections.domainId === initialData?.domainId ? initialData?.domainName : null) || "Selected Domain";
        const subjectName = hierarchicalChoices.subjects.find(s => s.id === selections.subjectId)?.name || (selections.subjectId === initialData?.subjectId ? initialData?.subjectName : null) || "Selected Subject";
        const topicName = hierarchicalChoices.topics.find(t => t.id === selections.topicId)?.name || (selections.topicId === initialData?.topicId ? initialData?.topicName : null) || "Selected Topic";

        let base = `I need to generate a structured educational hierarchy.
        
IMPORTANT REQUIREMENT: 
The following items ALREADY EXIST in our system. DO NOT provide redundant records for existing names.
${existingDomains.join(', ')}

ENUM DEFINITIONS:
- difficulty: choose from [simple | intermediate | expert]
- mappingType: choose from [conceptual | technical | practical]
- skillCategory: choose from [technical | conceptual | process]

Please provide a valid JSON object matching this schema for NEW data only:`;

        if (target === 'domain') {
            return `I need to generate a list of new educational DOMAINS for our quiz platform.

Please provide a valid JSON object matching this schema:
{
  "batchDomains": [
    { "name": "string", "description": "string", "category": "string" }
  ]
}

- Focus on Unique, high-level educational areas (e.g., "Full Stack Development", "Cloud Architecture").
- Provide at least 5-10 domains.
- guide AI model to generate data for given json format.
- Return ONLY the JSON object.`;
        }

        if (target === 'subject') {
            return `I need to generate a list of SUBJECTS for the domain: "${domainName}".

Please provide a valid JSON object matching this schema:
{
  "domainId": "${selections.domainId}",
  "subjects": [
    { "name": "string" }
  ]
}

- Focus on core areas within "${domainName}".
- guide AI model to generate data for given json format for this ${domainName} provide subjects.
- Return ONLY the JSON object.`;
        }

        if (target === 'topic') {
            return `I need to generate a list of TOPICS for the subject: "${subjectName}" within "${domainName}".

Please provide a valid JSON object matching this schema:
{
  "domainId": "${selections.domainId}",
  "subjects": [
    {
      "id": "${selections.subjectId}",
      "topics": [
        { 
          "name": "string",
          "weight": 1,
          "complexityLevel": 1
        }
      ]
    }
  ]
}

- Focus on technical sub-disciplines.
- guide AI model to generate data for given json format for this ${domainName} , ${subjectName} provide topics . And weight key explanation and what all possible values can be given and same explanation for key complexitylevel.
- weight: 1 (low impact) to 10 (high impact).
- complexityLevel: 1 (intro) to 10 (advanced).
- Return ONLY the JSON object.`;
        }

        if (target === 'subtopic') {
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
              "depthLevel": 1,
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
- guide AI model to generate data for given json format for this ${domainName} , ${subjectName} and for this ${topicName} provide sub topics . And deptlevel key explanation and what all possible values can be given
- depthLevel: 1 (foundational) to 10 (architectural).
- difficulty must be one of [simple, intermediate, expert].
- mappingType must be one of [conceptual, technical, practical].
- skillNames should be relevant competency names (e.g., "Problem Solving", "API Design").
- Return ONLY the JSON object.`;
        }

        if (target === 'skill') {
            return `I need to generate a core set of SKILLS to be used across the platform.

Please provide a valid JSON object matching this schema:
{
  "batchSkills": [
    { "name": "string", "category": "technical|conceptual|process", "mappingType": "conceptual|technical|practical", "weight": 1 }
  ]
}

- Focus on universal competencies (e.g., "Problem Solving", "API Design", "Security Posture").
- weight: 1 (minor) to 10 (critical).
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
          "questions": [
            {
               "questionText": "string",
               "options": [{ "text": "...", "isCorrect": true }, ...],
               "correctAnswer": "...",
               "difficulty": "simple|intermediate|expert",
               "mappingType": "conceptual|technical|practical"
            }
          ]
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
                    { name: "string", description: "string", category: "string" }
                ]
            };
        } else if (target === 'subject') {
            template = {
                domainId: selections.domainId || "DOMAIN_UUID",
                subjects: [
                    { name: "string" }
                ]
            };
        } else if (target === 'topic') {
            template = {
                domainId: selections.domainId || "DOMAIN_UUID",
                subjects: [{
                    id: selections.subjectId || "SUBJECT_UUID",
                    topics: [
                        { name: "string", weight: 1, complexityLevel: 1 }
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
                                name: "string",
                                depthLevel: 1,
                                questions: [{
                                    questionText: "string",
                                    options: ["A", "B", "C", "D"],
                                    correctAnswer: "string",
                                    difficulty: "simple|intermediate|expert",
                                    mappingType: "conceptual|technical|practical",
                                    skillNames: ["Skill A", "Skill B"]
                                }]
                            }
                        ]
                    }]
                }]
            };
        } else if (target === 'skill') {
            template = {
                batchSkills: [
                    { name: "string", category: "technical|conceptual|process", mappingType: "conceptual|technical|practical" }
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
                        questions: [
                            {
                                questionText: "Sample Question?",
                                options: [
                                    { text: "Correct Ans", isCorrect: true },
                                    { text: "Wrong Ans", isCorrect: false }
                                ],
                                correctAnswer: "Correct Ans",
                                difficulty: "intermediate",
                                mappingType: "technical"
                            }
                        ]
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
                    <ZTooltip content="Domain Factory Console: An advanced orchestration layer for bulk hierarchy ingestion and atomic state synchronization." side="bottom">
                        <div className="p-2.5 bg-[#1A1A1A] text-[#FF4B91] rounded-2xl shadow-xl shadow-black/10">
                            <Zap size={24} />
                        </div>
                    </ZTooltip>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter italic text-[#1A1A1A]">Domain Factory</h2>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-0.5 flex items-center gap-2">
                            System-Alpha • Manual Orchestration Active
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl">
                    <ZTooltip content="Switch to Single Entry Mode: Manually define a single level of hierarchy (Domain, Subject, Topic, or Subtopic)." side="bottom">
                        <button
                            onClick={() => setMode('manual')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                mode === 'manual' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
                            )}
                        >
                            Manual Entry
                        </button>
                    </ZTooltip>
                    <ZTooltip content={
                        (!selections.domainId && ['subject', 'topic', 'subtopic'].includes(initialData?.target)) ?
                            "Context Required: Please select a Target Domain in 'Manual Entry' mode to unlock the Bulk AI Factory." :
                            "Switch to Bulk Engine: Use AI prompts or JSON manifests to insert entire hierarchical branches at once."
                    } side="bottom">
                        <div className="relative">
                            <button
                                onClick={() => setMode('bulk')}
                                disabled={(!selections.domainId && ['subject', 'topic', 'subtopic'].includes(initialData?.target))}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    mode === 'bulk' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary",
                                    (!selections.domainId && ['subject', 'topic', 'subtopic'].includes(initialData?.target)) && "opacity-50 cursor-not-allowed bg-slate-100"
                                )}
                            >
                                Bulk Factory
                                {(!selections.domainId && ['subject', 'topic', 'subtopic'].includes(initialData?.target)) && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                )}
                            </button>
                        </div>
                    </ZTooltip>
                </div>

                <ZTooltip content="Terminate current factory session and return to management dashboard." side="bottom">
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-2xl transition-all border border-transparent hover:border-red-100 italic font-black uppercase text-[10px] flex items-center gap-2"
                    >
                        <X size={20} /> Close Terminal
                    </button>
                </ZTooltip>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden lg:flex-row divide-x divide-primary/5">
                {/* Workspace Area */}
                <div className={cn(
                    "flex-1 flex flex-col overflow-hidden p-12 gap-10",
                    mode === 'manual' ? "bg-white" : "bg-white"
                )}>
                    {mode === 'manual' ? (
                        <div className="max-w-5xl w-full mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-4">
                                <h3 className="text-4xl font-black italic uppercase tracking-tighter text-[#1A1A1A]">
                                    {initialData?.target ? `Single ${initialData.target.charAt(0).toUpperCase() + initialData.target.slice(1)} Registry` : "Single Domain Registry"}
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
                                        <Layers size={14} /> {initialData?.target?.toUpperCase() || 'DOMAIN'} IDENTITY NAME
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
                                                label="Target Domain"
                                                value={selections.domainId}
                                                options={hierarchicalChoices.domains.map(d => ({ id: d.domainId, name: d.domainName }))}
                                                loading={loadingChoices.domains}
                                                onChange={(id) => setSelections({ ...selections, domainId: id, subjectId: '', topicId: '' })}
                                                placeholder="Select Domain"
                                                active={true}
                                                hideCreate={true}
                                            />
                                        </div>

                                        {(['topic', 'subtopic'].includes(initialData?.target)) && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                <SelectField
                                                    label="Target Subject"
                                                    value={selections.subjectId}
                                                    options={hierarchicalChoices.subjects}
                                                    loading={loadingChoices.subjects}
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
                                                    label="Target Topic"
                                                    value={selections.topicId}
                                                    options={hierarchicalChoices.topics}
                                                    loading={loadingChoices.topics}
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
                                            <Activity size={14} /> Factory Compliance
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
                                        {initialData?.target ? `Bulk ${initialData.target} Factory` : "Bulk Hierarchy Engine"}
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
                                        {!selections.domainId && !initialData?.domainName ? (
                                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 animate-in fade-in zoom-in-95">
                                                <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shadow-sm">
                                                    <ArrowUp size={32} />
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
                                                        Awaiting Selection
                                                    </h4>
                                                    <p className="text-[10px] font-bold text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                                                        Select Target Hierarchy (up to Subtopic) to unlock the bulk uploader or use the manual text editor below.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="px-10 py-6 border-b border-primary/5 flex items-center justify-between bg-slate-50/50">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2.5 bg-[#FF4B91]/10 rounded-xl text-[#FF4B91]">
                                                            <Brain size={20} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <h4 className="text-lg font-black uppercase tracking-widest text-slate-800 italic">Surgical AI Prompt</h4>
                                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 mt-0.5">
                                                                <span className={cn("uppercase tracking-wider", selections.domainId ? "text-[#FF4B91]" : "text-slate-300")}>
                                                                    {hierarchicalChoices.domains.find(d => d.domainId === selections.domainId)?.domainName || "Domain"}
                                                                </span>
                                                                <span className="text-slate-200">/</span>
                                                                <span className={cn("uppercase tracking-wider", selections.subjectId ? "text-[#FF4B91]" : "text-slate-300")}>
                                                                    {hierarchicalChoices.subjects.find(s => s.id === selections.subjectId)?.name || "Subject"}
                                                                </span>
                                                                <span className="text-slate-200">/</span>
                                                                <span className={cn("uppercase tracking-wider", selections.topicId ? "text-[#FF4B91]" : "text-slate-300")}>
                                                                    {hierarchicalChoices.topics.find(t => t.id === selections.topicId)?.name || "Topic"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ZTooltip content="Copy complete contextual prompt to clipboard. Paste this into your AI assistant to generate the required JSON manifest." side="left">
                                                        <button
                                                            onClick={() => {
                                                                copyToClipboard(generateAiPrompt());
                                                                setMode('bulk');
                                                            }}
                                                            className="p-3 bg-white hover:bg-primary text-slate-400 hover:text-white rounded-xl transition-all active:scale-95 shadow-sm hover:shadow-primary/20 border border-slate-100"
                                                        >
                                                            <ClipboardCopy size={20} />
                                                        </button>
                                                    </ZTooltip>
                                                    <div className="w-px h-8 bg-slate-200 mx-1" />
                                                    <ZTooltip content="Switch to Editor Phase (Paste Payload)." side="left">
                                                        <button
                                                            onClick={() => setShowEditor(true)}
                                                            className="p-3 bg-white hover:bg-primary text-slate-400 hover:text-white rounded-xl transition-all active:scale-95 shadow-sm hover:shadow-primary/20 border border-slate-100 group/editor-nav"
                                                        >
                                                            <FileJson size={20} className="group-hover/editor-nav:scale-110 transition-transform" />
                                                        </button>
                                                    </ZTooltip>
                                                </div>
                                                <div className="flex-1 p-10 overflow-y-auto custom-scrollbar space-y-8">
                                                    {/* Pre-selection Context Visualization */}
                                                    {/* Context Scope Moved to Header */}

                                                    <div className="p-8 bg-slate-50 border border-slate-200/60 rounded-3xl text-sm font-medium text-blue-600 leading-relaxed whitespace-pre-wrap selection:bg-[#FF4B91]/10 shadow-sm relative overflow-hidden group/prompt">
                                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover/prompt:opacity-100 transition-opacity pointer-events-none">
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Read-Only Preview</span>
                                                        </div>
                                                        {generateAiPrompt()}
                                                    </div>
                                                </div>
                                                {/* Button Removed - Combined with Header Nav */}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 relative group animate-in fade-in slide-in-from-bottom-4 flex flex-col bg-white border-2 border-dashed border-primary/20 rounded-[2.5rem] overflow-hidden shadow-sm hover:border-primary/20 transition-all duration-500">
                                    {/* Editor Header */}
                                    <div className="px-10 py-6 border-b border-primary/5 flex items-center justify-between bg-slate-50/50 shrink-0">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-[#FF4B91]/10 rounded-xl text-[#FF4B91]">
                                                <Code2 size={20} />
                                            </div>
                                            <h4 className="text-lg font-black uppercase tracking-widest text-slate-800 italic">JSON Manifest Editor</h4>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <ZTooltip content="Return to Intelligence Scope (Prompt View)." side="left">
                                                <button
                                                    onClick={() => setShowEditor(false)}
                                                    className="p-3 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all active:scale-95 shadow-sm hover:shadow-slate-200 border border-slate-100"
                                                >
                                                    <ArrowLeft size={20} />
                                                </button>
                                            </ZTooltip>
                                            <ZTooltip content="Copy raw JSON payload." side="left">
                                                <button
                                                    onClick={() => copyToClipboard(payload)}
                                                    className="p-3 bg-white hover:bg-primary text-slate-400 hover:text-white rounded-xl transition-all active:scale-95 shadow-sm hover:shadow-primary/20 border border-slate-100"
                                                >
                                                    <ClipboardCopy size={20} />
                                                </button>
                                            </ZTooltip>
                                        </div>
                                    </div>

                                    {/* Editor Content */}
                                    <div className="relative flex-1 bg-slate-50/30">
                                        {!payload && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 p-12 opacity-60">
                                                <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-6">
                                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                                                        <ArrowUp size={24} />
                                                    </div>
                                                    <div className="text-center space-y-2">
                                                        <h5 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                                                            Paste {initialData?.target?.toUpperCase() || 'HIERARCHY'} Payload
                                                        </h5>
                                                        <p className="text-[10px] font-bold text-slate-300">
                                                            Ctrl + V to Insert JSON
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <textarea
                                            value={payload}
                                            onChange={(e) => setPayload(e.target.value)}
                                            placeholder="" // Placeholder removed, using watermark
                                            className="absolute inset-0 w-full h-full p-8 bg-transparent text-sm font-mono text-slate-600 resize-none focus:outline-none z-10 custom-scrollbar selection:bg-[#FF4B91]/20"
                                            spellCheck={false}
                                        />
                                        <div className="absolute right-10 bottom-10 px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-[11px] font-mono text-white/90 backdrop-blur-xl flex items-center gap-3 shadow-xl pointer-events-none">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            PAYLOAD_SIZE: {payload.length} BYTES
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar: Intelligence & Steps (Only visible in Bulk Mode) */}
                {mode === 'bulk' && (
                    <div className="w-full lg:w-[480px] bg-slate-50/50 flex flex-col p-12 gap-10 overflow-hidden border-l border-slate-200/50 animate-in slide-in-from-right-4 duration-500">
                        <div className="h-[40px] flex items-center shrink-0">
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-[#1A1A1A]">
                                Factory Monitor
                            </h3>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
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
                                        <h4 className="text-xl font-black uppercase tracking-tighter text-green-800 italic">Emission Successful</h4>
                                        <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mt-1">Domain ID: {success.domainId}</p>
                                    </div>

                                    {success.stats && (
                                        <div className="p-4 rounded-3xl bg-white/50 border border-green-200/50 space-y-3">
                                            <h5 className="text-[9px] font-black uppercase tracking-widest text-green-800/60 text-left px-2">Registry Summary</h5>
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
                        </div>

                        {/* Utility Clustering at Bottom */}
                        <div className="pt-8 border-t border-primary/5 space-y-3 shrink-0">
                            <div className="grid grid-cols-1 gap-5">
                                <ZTooltip content="Load a .json manifest file from your local storage. This is the fastest way to re-run previously validated batches or bulk-import legacy content." side="top">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full px-6 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 hover:border-slate-300 transition-all flex items-center justify-center gap-3 text-slate-700 shadow-sm hover:scale-[1.01]"
                                    >
                                        <Upload size={16} /> Upload Manifest
                                    </button>
                                </ZTooltip>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
                            </div>
                        </div>
                    </div>
                )}
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
        </div >,
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
