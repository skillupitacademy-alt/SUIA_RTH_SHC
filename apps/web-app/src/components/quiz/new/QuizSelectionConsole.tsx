'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { apiClient } from '@quiz/api-client';
import { AssessmentSummary } from './AssessmentSummary';
import { DomainCard } from './DomainCard';
import { TopicChip } from './TopicChip';
import { Code, Shield, Cloud, Database, Check, Loader2, Activity, ChevronLeft, ChevronRight, AlertCircle, X, ExternalLink, RefreshCcw, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const JourneyBadge = ({ text }: { text: string }) => (
    <div className="flex flex-col items-end gap-2">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full border-2 border-[#FF2D55]/20 bg-white shadow-sm animate-in zoom-in duration-500">
            <span className="text-[12px] font-black font-outfit text-[#FF2D55] uppercase tracking-[0.2em]">{text}</span>
        </div>
    </div>
);

const DottedProgressBar = ({ currentStep, mode }: { currentStep: number; mode: 'basic' | 'advanced' }) => (
    <div className="flex items-center gap-4">
        {[1, 2, 3, 4, 5].map((s) => {
            const isDot4Basic = mode === 'basic' && s === 4;
            return (
                <div key={s} className="flex items-center">
                    <div className={cn(
                        "w-3 h-3 rounded-full border-2 transition-all duration-500",
                        isDot4Basic ? "bg-transparent border-gray-200 opacity-30" :
                            s < currentStep ? "bg-[#FF2D55] border-[#FF2D55]" :
                                s === currentStep ? "bg-[#FF2D55] border-[#FF2D55] shadow-[0_0_20px_rgba(255,45,85,0.5)] scale-125" :
                                    "bg-transparent border-gray-300"
                    )} />
                    {s < 5 && (
                        <div className={cn(
                            "w-12 h-[2px] mx-1 transition-all duration-500",
                            (s < currentStep && !(mode === 'basic' && s === 3)) || (mode === 'basic' && s === 3 && currentStep === 5) ? "bg-[#FF2D55]" : "bg-gray-200/80"
                        )} />
                    )}
                </div>
            );
        })}
    </div>
);

export function QuizSelectionConsole() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-20">
                <Loader2 className="animate-spin text-[#FF2D55]" size={48} />
            </div>
        }>
            <QuizSelectionConsoleContent />
        </Suspense>
    );
}

function QuizSelectionConsoleContent() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [domains, setDomains] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [topics, setTopics] = useState<any[]>([]);
    const [subtopics, setSubtopics] = useState<any[]>([]);

    const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
    const [mode, setMode] = useState<'basic' | 'advanced'>('basic');
    const [loading, setLoading] = useState(false);
    const [selectionError, setSelectionError] = useState<string | null>(null);
    const [launchError, setLaunchError] = useState<{ title: string; reason: string } | null>(null);

    const searchParams = useSearchParams();
    const [showInvalidLinkError, setShowInvalidLinkError] = useState(false);

    useEffect(() => {
        if (searchParams.get('error') === 'invalid_exam') {
            setShowInvalidLinkError(true);
        }
    }, [searchParams]);

    // Engine Calibration State (Step 5)
    // NORMALIZATION: Ensuring we strictly use backend-supported values (simple/mixed/expert)
    const normalizeDifficulty = (val: string) => {
        const v = val.toLowerCase();
        if (v === 'beginner' || v === 'foundations') return 'simple';
        if (v === 'advanced' || v === 'elite') return 'expert';
        if (['simple', 'mixed', 'expert'].includes(v)) return v;
        return 'mixed'; // Default fallback
    };

    const [difficulty, setDifficulty] = useState(normalizeDifficulty('mixed')); // Initial state guaranteed normalized
    const [questionCount, setQuestionCount] = useState(20);
    const [isArmed, setIsArmed] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    // Pagination State
    const [page, setPage] = useState(0);
    const currentPageSize = 6; // Refactored to 3x2 grid (6 items) for Steps 1-4

    // UI Meta helper (for icons and accents in Domain Cards)
    const getDomainMeta = (index: number) => {
        const icons = [Code, Shield, Cloud, Database];
        const accents = ['blue', 'purple', 'green', 'orange'];
        return {
            icon: icons[index % icons.length],
            accent: accents[index % accents.length]
        };
    };

    // Initial Domains Fetch
    useEffect(() => {
        const fetchDomains = async () => {
            setLoading(true);
            try {
                const data = await apiClient.quiz.getDomains();
                setDomains(data || []);
            } catch (err) {
                console.error('Failed to fetch domains', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDomains();
    }, []);

    // Subject Fetch (Triggered by Domain Selection)
    useEffect(() => {
        if (selectedDomains.length > 0) {
            const fetchSubjects = async () => {
                setLoading(true);
                try {
                    const data = await apiClient.quiz.getSubjects(selectedDomains[0]);
                    setSubjects(data || []);
                } catch (err) {
                    console.error('Failed to fetch subjects', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchSubjects();
        } else {
            setSubjects([]);
        }
    }, [selectedDomains]);

    // Topic Fetch (Triggered by Subject Selection)
    useEffect(() => {
        if (selectedSubjects.length > 0) {
            const fetchTopics = async () => {
                setLoading(true);
                try {
                    // Fetch for the first selected subject (or could be multiple if logic permits)
                    const data = await apiClient.quiz.getTopics(selectedSubjects[0]);
                    setTopics(data || []);
                } catch (err) {
                    console.error('Failed to fetch topics', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchTopics();
        } else {
            setTopics([]);
        }
    }, [selectedSubjects]);

    // Subtopic Fetch (Triggered by Topic Selection)
    useEffect(() => {
        if (selectedTopics.length > 0) {
            const fetchSubtopics = async () => {
                setLoading(true);
                try {
                    const data = await apiClient.quiz.getSubtopics(selectedTopics[0]);
                    setSubtopics(data || []);
                } catch (err) {
                    console.error('Failed to fetch subtopics', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchSubtopics();
        } else {
            setSubtopics([]);
        }
    }, [selectedTopics]);

    // Mode Clamping Rules
    useEffect(() => {
        if (mode === 'basic') {
            let trimmed = false;

            // 1. Clear Subtopics
            if (selectedSubtopics.length > 0) {
                setSelectedSubtopics([]);
                trimmed = true;
            }

            // 2. Clamp Subjects (Max 2)
            if (selectedSubjects.length > 2) {
                setSelectedSubjects(prev => prev.slice(0, 2));
                trimmed = true;
            }

            // 3. Clamp Topics (Max 3)
            if (selectedTopics.length > 3) {
                setSelectedTopics(prev => prev.slice(0, 3));
                trimmed = true;
            }

            // 4. Clamp Question Count
            const presets = [10, 15, 20, 25];
            if (!presets.includes(questionCount)) {
                // Find nearest
                const nearest = presets.reduce((prev, curr) =>
                    Math.abs(curr - questionCount) < Math.abs(prev - questionCount) ? curr : prev
                );
                setQuestionCount(nearest);
                trimmed = true;
            }

            // 5. Navigation Safety
            if (step === 4) {
                setStep(3);
            }

            if (trimmed) {
                setSelectionError("BASIC MODE: trimmed to max 2 subjects / 3 topics");
                setTimeout(() => setSelectionError(null), 3000);
            }
        }
    }, [mode]);

    const toggleDomain = (id: string) => {
        if (isLocked || isArmed) return;
        // Enforce Single Select per user instruction
        setSelectedDomains([id]);
        // Reset child levels
        setSelectedSubjects([]);
        setSelectedTopics([]);
        setSelectedSubtopics([]);
    };

    const toggleSubject = (id: string) => {
        if (isLocked || isArmed) return;
        setSelectedSubjects(prev => {
            if (prev.includes(id)) {
                setSelectionError(null);
                return prev.filter(x => x !== id);
            }
            const cap = mode === 'basic' ? 2 : 4;
            if (prev.length >= cap) {
                setSelectionError(`${mode.toUpperCase()} MODE: MAX ${cap} SUBJECTS ALLOWED`);
                return prev;
            }
            setSelectionError(null);
            return [...prev, id];
        });
        setSelectedTopics([]);
        setSelectedSubtopics([]);
    };

    const toggleTopic = (id: string) => {
        if (isLocked || isArmed) return;
        const cap = mode === 'basic' ? 3 : 4;
        setSelectedTopics(prev => {
            if (prev.includes(id)) {
                setSelectionError(null);
                return prev.filter(x => x !== id);
            }
            if (prev.length >= cap) {
                setSelectionError(`${mode.toUpperCase()} MODE: MAX ${cap} TOPICS ALLOWED`);
                return prev;
            }
            setSelectionError(null);
            return [...prev, id];
        });
        setSelectedSubtopics([]);
    };

    const toggleSubtopic = (id: string) => {
        if (isLocked || isArmed) return;
        setSelectedSubtopics(prev => {
            if (prev.includes(id)) {
                setSelectionError(null);
                return prev.filter(x => x !== id);
            }
            if (prev.length >= 4) {
                setSelectionError("SUBTOPIC LIMIT REACHED: MAX 4 SELECTIONS ALLOWED");
                return prev;
            }
            setSelectionError(null);
            return [...prev, id];
        });
    };


    // Transactional Launch Logic
    const handleLaunch = async () => {
        if (isLocked) return;
        setIsLocked(true); // Lock UI immediately
        setLoading(true);  // Show loader overlay on LEFT pane (via loading state)

        try {
            // 1. Generate Idempotency Key
            const idempotencyKey = crypto.randomUUID();

            // 2. Construct Payload
            const payload = {
                domainId: selectedDomains[0], // Prefer domainId as primary context
                // Backend expects arrays, UI guarantees single/multi select validation
                subjectIds: selectedSubjects.length > 0 ? selectedSubjects : undefined,
                topicIds: selectedTopics.length > 0 ? selectedTopics : undefined,
                subtopicIds: selectedSubtopics.length > 0 ? selectedSubtopics : undefined,
                difficulty: difficulty, // Already normalized
                questionCount: questionCount
            };

            // 3. Execute Transaction
            // Refactored to use apiClient for correct URL/CSRF handling
            const data = await apiClient.quiz.startExam(payload, { idempotencyKey });

            // 4. Navigate to Active HUD
            // Guardrail: Ensure examId is valid before redirecting
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!data?.examId || data.examId === 'undefined' || !uuidRegex.test(data.examId)) {
                throw new Error('Start exam failed: missing or invalid examId in response');
            }

            // Officially cutting over to Premium HUD
            router.push(`/exam/${data.examId}`);

        } catch (err: any) {
            console.error('Launch failed:', err);
            setLaunchError({
                title: 'Couldn’t start your assessment',
                reason: err.message || "Launch failed. Please try again."
            });
            setIsLocked(false);
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (isLocked) return; // Strict lock check

        if (isArmed) {
            // If already armed and at step 5, this is the LAUNCH trigger
            if (step === 5) {
                handleLaunch();
            }
            return;
        }

        if (step === 5) {
            setIsArmed(true);
            return;
        }
        if (step < 5) {
            const nextStep = (mode === 'basic' && step === 3) ? 5 : step + 1;
            setStep(nextStep);
            setPage(0); // Reset page on step change
            setSelectionError(null);
        }
    };

    const handleBack = () => {
        if (isLocked || isArmed) return;
        if (mode === 'basic' && (step === 5 || step === 4)) {
            setStep(3);
            setPage(0);
            setSelectionError(null);
            return;
        }

        if (step > 1) {
            setStep(step - 1);
            setPage(0); // Reset page on step change
            setSelectionError(null);
        }
    };

    const handlePrevPage = () => {
        if (isLocked || isArmed) return;
        setPage((prev) => Math.max(0, prev - 1));
    };

    const handleNextPage = () => {
        if (isLocked || isArmed) return;
        const totalItems = step === 1 ? domains.length : (step === 3 ? topics.length : (step === 2 ? subjects.length : (step === 4 ? subtopics.length : 0)));
        const totalPages = Math.ceil(totalItems / currentPageSize);
        setPage((prev) => Math.min(totalPages - 1, prev + 1));
    };

    // Derived Data for Stationary Logic
    const currentDomain = domains.find(d => d.id === selectedDomains[0]);
    const currentSubjects = subjects.filter(s => selectedSubjects.includes(s.id));
    const currentTopics = topics.filter(t => selectedTopics.includes(t.id));
    const currentSubtopics = subtopics.filter(st => selectedSubtopics.includes(st.id));

    const paginatedDomains = domains.slice(page * currentPageSize, (page + 1) * currentPageSize);
    const paginatedTopics = topics.slice(page * currentPageSize, (page + 1) * currentPageSize);
    const paginatedSubjects = subjects.slice(page * currentPageSize, (page + 1) * currentPageSize);
    const paginatedSubtopics = subtopics.slice(page * currentPageSize, (page + 1) * currentPageSize);

    // Metadata for Journey Orientation
    const journeyInfo = {
        1: { title: "Select Domain", badge: "Foundation Architecture", desc: "Choose your area of expertise to begin the assessment.", count: domains.length },
        2: { title: "Refine Subjects", badge: "Curriculum Calibration", desc: mode === 'basic' ? "Select core subjects (Max 2 for Basic mode)." : "Select the core subjects for your assessment pool.", count: subjects.length },
        3: { title: "Select Topics", badge: "Knowledge Mapping", desc: mode === 'basic' ? "Strategic knowledge units (Max 3 for Basic mode)." : "High-density grid of strategic knowledge units.", count: topics.length },
        4: { title: "Fine-tune Subtopics", badge: "Expert Precision", desc: "Pinpoint specific skills for deeper evaluation.", count: subtopics.length },
        5: { title: "Calibrate Engine", badge: "Engine Mastery", desc: mode === 'basic' ? "Finalize your assessment session with simplified presets." : "Finalize your assessment session by tuning the difficulty tier and question volume.", count: 0 }
    };

    const currentMeta = journeyInfo[step as keyof typeof journeyInfo];

    return (
        <div className="w-full flex-1 flex flex-col min-h-0 relative">
            {/* Refined 3-Part Header Section */}
            <div className="flex-none px-4 md:px-12 pt-6 pb-4 border-b border-gray-200">
                <div className="grid grid-cols-3 items-center gap-8">

                    {/* Column 1: Step Orientation */}
                    <div className="flex flex-col items-start min-w-0">
                        <h2 className="text-[clamp(36px,2.2vw,44px)] font-bold font-outfit tracking-tighter text-[#1A1A1A] leading-[1.1] mb-1">
                            {currentMeta.title} {currentMeta.count > 0 && `(${currentMeta.count})`}
                        </h2>
                        <p className="text-xs text-muted-foreground font-inter font-medium opacity-70 max-w-sm leading-tight italic">
                            {currentMeta.desc}
                        </p>
                    </div>

                    {/* Column 2: Plain Text Journey Context */}
                    <div className="flex justify-center text-center">
                        <span className="text-[clamp(16px,1.2vw,20px)] font-bold font-outfit text-[#1A1A1A]/80 uppercase tracking-widest truncate px-4">
                            {step === 1 ? "Strategic Ecosystem" :
                                step === 2 ? currentDomain?.name :
                                    step === 3 ? `${currentDomain?.name} / ${currentSubjects[0]?.name || '...'}` :
                                        step === 4 ? `${currentSubjects[0]?.name} / ${currentTopics[0]?.name || '...'}` :
                                            "Engine Calibration"}
                        </span>
                    </div>

                    {/* Column 3: Launch Branding & Toggle */}
                    <div className="flex flex-col items-end gap-3 min-w-0">
                        <h1 className="text-[clamp(36px,2.2vw,44px)] font-black tracking-tighter font-outfit text-[#1A1A1A] leading-none">
                            Launch Evaluation
                        </h1>
                        <div className="flex bg-gray-100/80 rounded-lg p-0.5 border border-gray-200 w-fit backdrop-blur-sm">
                            {(['basic', 'advanced'] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => {
                                        if (isLocked || isArmed) return;
                                        setMode(m);
                                    }}
                                    className={cn(
                                        "px-6 py-1.5 rounded-md text-[11px] font-black font-outfit uppercase tracking-tight transition-all",
                                        mode === m
                                            ? "bg-[#FF2D55] text-white shadow-sm"
                                            : "text-gray-500 hover:text-gray-700",
                                        (isLocked || isArmed) && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Error/Notice Bar Section */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-3xl px-8 z-[60] space-y-2">
                {showInvalidLinkError && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#FF2D55]/20 shadow-xl shadow-[#FF2D55]/5 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3 text-[#FF2D55]">
                            <AlertCircle size={18} />
                            <p className="text-xs font-bold">Invalid link. Please start a new session.</p>
                        </div>
                        <button onClick={() => setShowInvalidLinkError(false)} className="p-1 hover:bg-[#FF2D55]/5 rounded-lg text-[#FF2D55]"><X size={16} /></button>
                    </div>
                )}
                {selectionError && (
                    <div className="flex items-center gap-2 justify-center py-2 px-4 rounded-full bg-white border border-[#FF2D55]/10 shadow-lg animate-in slide-in-from-top-2 duration-300 w-fit mx-auto">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#FF2D55] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#FF2D55]">{selectionError}</span>
                    </div>
                )}
            </div>

            {/* Main Interactive Zone */}
            <div className="flex-1 flex flex-col min-h-0 relative px-4 md:px-12 overflow-hidden">
                <div className="flex-1 flex gap-8 items-stretch pt-6 pb-4 min-h-0">

                    {/* Left/Main Pane */}
                    <div className={cn(
                        "flex flex-col h-full transition-all duration-700 relative",
                        step === 5 ? "w-[65%]" : "w-full",
                        isLocked ? "opacity-30 pointer-events-none" : (isArmed ? "opacity-50 pointer-events-none" : "opacity-100")
                    )}>

                        {/* Compact Pagination Header (Secondary Control) - Steps 1-4 Only */}
                        {/* ADDED: SAFE BUFFER WRAPPER AROUND PAGINATION TO PREVENT CLIP */}
                        {step < 5 && (
                            <div className="flex justify-end items-center mb-4 pr-2">
                                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm backdrop-blur-sm">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={page === 0 || loading || isLocked}
                                        className={cn(
                                            "p-1.5 rounded-md transition-all disabled:opacity-30 disabled:grayscale",
                                            "bg-[#FF2D551A] border border-[#FF2D5533] text-[#FF2D55] hover:bg-[#FF2D55] hover:text-white"
                                        )}
                                        title="Previous Page"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <div className="px-2 min-w-[60px] text-center border-x border-gray-200">
                                        <span className="text-[10px] font-black font-outfit text-gray-500 uppercase tracking-widest">
                                            {String(page + 1).padStart(2, '0')} / {String(Math.max(1, Math.ceil((step === 1 ? domains.length : (step === 3 ? topics.length : (step === 2 ? subjects.length : (step === 4 ? subtopics.length : 0)))) / currentPageSize))).padStart(2, '0')}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={page >= Math.ceil((step === 1 ? domains.length : (step === 3 ? topics.length : (step === 2 ? subjects.length : (step === 4 ? subtopics.length : 0)))) / currentPageSize) - 1 || loading || isLocked}
                                        className={cn(
                                            "p-1.5 rounded-md transition-all disabled:opacity-30 disabled:grayscale",
                                            "bg-[#FF2D551A] border border-[#FF2D5533] text-[#FF2D55] hover:bg-[#FF2D55] hover:text-white"
                                        )}
                                        title="Next Page"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* REFACTORED: REMOVED overflow-hidden and ADDED p-2 buffer around grid */}
                        <div className="flex-1 flex flex-col min-h-0 pt-2 relative overflow-visible p-2">
                            {loading && (
                                <div className="absolute inset-x-2 inset-y-2 z-50 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-[1.25rem] animate-in fade-in duration-300">
                                    <Activity className="animate-spin text-[#FF2D55]" size={32} />
                                </div>
                            )}

                            {step === 1 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-500 items-start overflow-visible">
                                    {paginatedDomains.map((domain, idx) => (
                                        <DomainCard
                                            key={domain.id}
                                            {...domain}
                                            {...getDomainMeta(idx + page * currentPageSize)}
                                            isSelected={selectedDomains.includes(domain.id)}
                                            onSelect={toggleDomain}
                                            accentColor={getDomainMeta(idx + page * currentPageSize).accent}
                                        />
                                    ))}
                                </div>
                            )}

                            {(step === 2 || step === 3 || step === 4) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-500 items-start overflow-visible">
                                    {(step === 2 ? paginatedSubjects : step === 3 ? paginatedTopics : paginatedSubtopics).map((item) => (
                                        <TopicChip
                                            key={item.id}
                                            {...item}
                                            isSelected={(step === 2 ? selectedSubjects : step === 3 ? selectedTopics : selectedSubtopics).includes(item.id)}
                                            onToggle={(step === 2 ? toggleSubject : step === 3 ? toggleTopic : toggleSubtopic)}
                                        />
                                    ))}
                                </div>
                            )}

                            {step === 5 && (
                                <div className="animate-in fade-in zoom-in-95 duration-500 h-full flex flex-col justify-between py-2">
                                    {/* Top Row: Difficulty Tier */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black font-outfit text-gray-400 uppercase tracking-[0.2em] mb-4">Engine Tier Selection</p>
                                        <div className="grid grid-cols-3 gap-6">
                                            {[
                                                { id: 'mixed', name: 'Mixed', desc: 'Mastery Blend' },
                                                { id: 'simple', name: 'Simple', desc: 'Core Knowledge' },
                                                { id: 'expert', name: 'Expert', desc: 'Expert Level' }
                                            ].map((tier) => (
                                                <button
                                                    key={tier.id}
                                                    disabled={isLocked || isArmed}
                                                    onClick={() => setDifficulty(normalizeDifficulty(tier.id))}
                                                    className={cn(
                                                        "p-6 rounded-[1.5rem] border-2 transition-all duration-300 flex flex-col items-center justify-center min-h-[100px]",
                                                        difficulty === tier.id
                                                            ? "bg-[#FF2D55] border-[#FF2D55] shadow-lg shadow-[#FF2D55]/20 scale-[1.02]"
                                                            : "bg-white border-gray-100 hover:border-[#FF2D55]/20 hover:bg-gray-50/50"
                                                    )}
                                                >
                                                    <p className={cn("text-base font-black font-outfit uppercase tracking-tight", difficulty === tier.id ? "text-white" : "text-[#1A1A1A]")}>{tier.name}</p>
                                                    <p className={cn("text-[10px] font-bold uppercase tracking-wider opacity-60", difficulty === tier.id ? "text-white" : "text-muted-foreground")}>{tier.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Middle Row: Question Count */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black font-outfit text-gray-400 uppercase tracking-[0.2em] mb-4">Density Calibration</p>
                                        <div className="grid grid-cols-4 gap-4">
                                            {(mode === 'basic' ? [10, 15, 20, 25] : [10, 20, 30, 40]).map((v) => (
                                                <button
                                                    key={v}
                                                    disabled={isLocked || isArmed}
                                                    onClick={() => setQuestionCount(v)}
                                                    className={cn(
                                                        "p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center min-h-[80px]",
                                                        questionCount === v
                                                            ? "bg-[#FF2D55] border-[#FF2D55] shadow-lg shadow-[#FF2D55]/20 scale-[1.02]"
                                                            : "bg-white border-gray-100 hover:border-[#FF2D55]/20 hover:bg-gray-50/50"
                                                    )}
                                                >
                                                    <div className={cn("text-xl font-black font-outfit leading-none", questionCount === v ? "text-white" : "text-[#1A1A1A]")}>{v}</div>
                                                    <div className={cn("text-[8px] font-black uppercase tracking-widest", questionCount === v ? "text-white/60" : "text-muted-foreground/40")}>Questions</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Scoped Footer (Step 5 logic included here) */}
                        {/* STABILIZED: FOOTER IS ANCHORED AT BOTTOM OF LEFT PANE */}
                        <div className="flex-none h-[88px] border-t border-gray-200 bg-white z-[50] -mx-4 md:-mx-12 px-4 md:px-12 flex items-center justify-between mt-auto">
                            <button
                                onClick={handleBack}
                                disabled={step === 1 || isLocked || isArmed}
                                className={cn(
                                    "group flex items-center gap-3 px-8 py-3.5 rounded-xl font-black font-outfit text-xs uppercase tracking-widest transition-all shadow-sm border-2",
                                    "bg-[#FF2D551A] border-[#FF2D5533] text-[#FF2D55] hover:bg-[#FF2D55] hover:text-white hover:border-[#FF2D55] hover:shadow-xl hover:shadow-[#FF2D55]/20 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                                )}
                            >
                                <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                                <span>BACK</span>
                            </button>

                            <button
                                onClick={handleNext}
                                disabled={
                                    (isLocked) ||
                                    (step === 1 && selectedDomains.length === 0) ||
                                    (step === 2 && selectedSubjects.length === 0) ||
                                    (step === 3 && selectedTopics.length === 0) ||
                                    (step === 4 && selectedSubtopics.length === 0)
                                }
                                className={cn(
                                    "flex items-center gap-4 px-12 py-3.5 rounded-xl font-bold font-outfit text-sm uppercase tracking-widest transition-all",
                                    "bg-[#FF2D55] text-white shadow-lg shadow-[#FF2D55]/20 hover:shadow-xl hover:shadow-[#FF2D55]/30 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:pointer-events-none",
                                    step === 5 && isArmed && "bg-black hover:bg-black/90 scale-100 shadow-none ring-2 ring-offset-2 ring-black"
                                )}
                            >
                                <span>
                                    {step === 5 ? (isArmed ? "INITIATE LAUNCH 🚀" : "CONFIRM MISSION 🚀") : (step === 4 ? "CALIBRATE ENGINE" : "CONTINUE JOURNEY")}
                                </span>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Right Pane: Summary (Only Step 5) */}
                    {step === 5 && (
                        <div className="w-[35%] flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
                            <AssessmentSummary
                                domainName={currentDomain?.name || 'Not Selected'}
                                subjectsCount={selectedSubjects.length}
                                topicsCount={selectedTopics.length}
                                questionCount={questionCount}
                                difficulty={difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                                totalPoints={100 + selectedTopics.length * 15 + selectedSubtopics.length * 5}
                                isReady={isArmed}
                                onStart={handleLaunch}
                                isLocked={isLocked}
                                loading={loading}
                                selectedSubjects={currentSubjects.map(s => s.name)}
                                selectedTopics={currentTopics.map(t => t.name)}
                                selectedSubtopics={currentSubtopics.map(st => st.name)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
