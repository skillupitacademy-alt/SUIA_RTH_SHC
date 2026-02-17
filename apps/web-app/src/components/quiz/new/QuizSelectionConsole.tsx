'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { apiClient, Domain, Subject, Topic, Subtopic } from '@quiz/api-client';
import { AssessmentSummary } from './AssessmentSummary';
import { DomainCard } from './DomainCard';
import { TopicChip } from './TopicChip';
import { Code, Shield, Cloud, Database, Loader2, Activity, ChevronLeft, ChevronRight, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExitGuard } from '@/hooks/useExitGuard';
import { ExitConfirmationDialog } from '@/components/ui/ExitConfirmationDialog';
import { ExamPreflightDialog } from '@/components/quiz/ExamPreflightDialog';
import { getActiveExamId } from '@/hooks/useExamBackup';
import { ZLoader } from '@quiz/ui';

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
    const [domains, setDomains] = useState<Domain[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [subtopics, setSubtopics] = useState<Subtopic[]>([]);

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

    // State for Active Exam Resume (Phase 3)
    const [activeExamId, setActiveExamId] = useState<string | null>(null);

    useEffect(() => {
        const id = getActiveExamId();
        if (id) {
            setActiveExamId(id);
        }
    }, []);

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

    // Exit Guard logic with custom dialog
    const hasUnsavedProgress = (selectedDomains.length > 0 || selectedTopics.length > 0) && !isLocked;
    const { showDialog: showExitDialog, confirmExit, cancelExit } = useExitGuard({
        enabled: hasUnsavedProgress,
        message: 'You have unsaved assessment selections. Are you sure you want to leave?'
    });

    // Pagination State
    const [page, setPage] = useState(0);
    // HYBRID CAPACITY: Locked to 2x3 (6) for Step 1, 3x3 (9) for Steps 2-4
    const currentPageSize = step === 1 ? 6 : 9;

    // UI Meta helper (for icons and accents in Domain Cards)
    const getDomainMeta = (index: number) => {
        const icons = [Code, Shield, Cloud, Database];
        const accents = ['blue', 'purple', 'green', 'orange'];
        return {
            icon: icons[index % icons.length],
            accent: accents[index % accents.length]
        };
    };

    // Selection Heartbeat (Phase 8 Resilience)
    useEffect(() => {
        let isActive = true;
        let timeoutId: NodeJS.Timeout;

        const runHeartbeat = async () => {
            if (!isActive) return;
            try {
                await apiClient.auth.heartbeat();
            } catch (err) {
                console.warn('[Heartbeat] Silence failed - likely background refresh will catch it', err);
            }
            // Jittered interval (120s - 180s) to prevent "Thundering Herd" server spikes
            const jitter = Math.floor(Math.random() * 60000); // 0-60s
            timeoutId = setTimeout(runHeartbeat, 120000 + jitter);
        };

        runHeartbeat();

        return () => {
            isActive = false;
            clearTimeout(timeoutId);
        };
    }, []);

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


    // Preflight State
    const [showPreflight, setShowPreflight] = useState(false);

    const handleLaunch = () => {
        if (isLocked) return;
        setShowPreflight(true);
    };

    // Transactional Launch Logic (Executed AFTER Preflight Success)
    const executeLaunch = async () => {
        setShowPreflight(false); // Close dialog
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

        } catch (err: unknown) {
            console.error('Launch failed:', err);
            const message = err instanceof Error ? err.message : "Launch failed. Please try again.";
            setLaunchError({
                title: "Couldn't start your assessment",
                reason: message
            });
            setIsLocked(false);
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (isLocked) return; // Strict lock check

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
        <div className="w-full h-full flex flex-col min-h-0 relative overflow-hidden">
            {/* Resume Banner (Phase 3 Requirement) */}
            {activeExamId && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-4xl z-[100] px-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-white border-2 border-[#FF2D55]/20 rounded-3xl p-4 flex items-center justify-between gap-6 shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="bg-[#FF2D55]/10 p-2 rounded-xl text-[#FF2D55]">
                                <Activity size={24} className="animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black tracking-tight text-[#FF2D55] uppercase leading-none mb-1">Active Session Detected</h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Recover your ongoing assessment session</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push(`/exam/${activeExamId}`)}
                            className="px-6 py-2 rounded-xl bg-[#FF2D55] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#FF2D55]/20 flex items-center gap-2 group"
                        >
                            Resume Now
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            )}

            {/* HUD HEADER: 12% Slot */}
            <div className="flex-none basis-[12dvh] px-4 md:px-12 flex flex-col justify-center border-b border-gray-200 bg-white">
                <div className="grid grid-cols-3 items-center gap-8 px-0">

                    {/* Column 1: Step Orientation */}
                    <div className="flex flex-col items-start min-w-0">
                        <h2 className="text-[3vw] lg:text-[36px] font-bold font-outfit tracking-tighter text-[#1A1A1A] leading-tight mb-1 whitespace-nowrap">
                            {currentMeta.title} {currentMeta.count > 0 && `(${currentMeta.count})`}
                        </h2>
                        <p className="text-[10px] text-[#FF2D55] font-black uppercase tracking-[0.15em] opacity-80">
                            {currentMeta.desc}
                        </p>
                    </div>

                    {/* Column 2: Journey Breadcrumb Context */}
                    <div className="flex justify-center text-center">
                        <span className="text-[clamp(16px,1.2vw,20px)] font-bold font-outfit text-[#1A1A1A]/80 uppercase tracking-widest px-4">
                            {step === 1 ? "Strategic Ecosystem" :
                                step === 2 ? (currentDomain?.name || "Domain Selection") :
                                    step === 3 ? `${currentDomain?.name || "Domain"} / ${currentSubjects[0]?.name || "Subject"}` :
                                        step === 4 ? `${currentSubjects[0]?.name || "Subject"} / ${currentTopics[0]?.name || "Topic"}` :
                                            "Engine Calibration"}
                        </span>
                    </div>

                    {/* Column 3: Launch Branding & Toggle */}
                    <div className="flex flex-col items-end gap-1 min-w-0">
                        <h1 className="text-[3vw] lg:text-[36px] font-black tracking-tighter font-outfit text-[#1A1A1A] leading-none whitespace-nowrap">
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
            <div className="absolute top-[12dvh] left-1/2 -translate-x-1/2 w-full max-w-3xl px-8 z-[60] space-y-2">
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

            <div className="flex-1 flex min-h-0">
                <div className={cn(
                    "flex flex-col h-full relative",
                    step === 5 ? "w-[65%]" : "w-full",
                    isLocked ? "opacity-30 pointer-events-none" : (isArmed ? "opacity-50 pointer-events-none" : "opacity-100")
                )}>
                    {/* Control Overlay for Loading - Moved to Grandparent */}
                    {loading && (
                        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-md">
                            <div className="flex flex-col items-center gap-6 p-8 rounded-[3rem] bg-white/80 border border-white/60 shadow-2xl">
                                <ZLoader size="lg" className="text-[#FF2D55]" center={false} />
                                <p className="text-xs font-black font-outfit text-[#1A1A1A] uppercase tracking-[0.3em] animate-pulse">Syncing Engine...</p>
                            </div>
                        </div>
                    )}

                    {/* CONTROL ROW: 8% Slot */}
                    <div className="flex-none basis-[8dvh] flex flex-col justify-center px-4 md:px-12">
                        <div className="flex justify-between items-center pr-0">
                            <div className="flex items-center gap-2">
                                {/* Empty Space or help text could go here */}
                            </div>
                            {step < 5 ? (
                                <div className="flex items-center gap-2 bg-white/80 p-0.5 rounded-lg border border-gray-200 shadow-sm backdrop-blur-sm">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={page === 0 || loading || isLocked || (step === 5 && isArmed)}
                                        className={cn(
                                            "p-1.5 rounded-md transition-all",
                                            "bg-[#FF2D551A] border border-[#FF2D5533] text-[#FF2D55] hover:bg-[#FF2D55] hover:text-white",
                                            "disabled:bg-[#FF2D550D] disabled:text-[#FF2D554D] disabled:border-[#FF2D551A] disabled:opacity-100", // PKG FIX
                                            (isArmed && step === 5) && "opacity-100"
                                        )}
                                        title="Previous Page"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <div className="px-2 min-w-[60px] text-center border-x border-gray-200">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                            Page {page + 1} of {Math.ceil((step === 1 ? domains.length : (step === 3 ? topics.length : (step === 2 ? subjects.length : (step === 4 ? subtopics.length : 0)))) / currentPageSize)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={page >= Math.ceil((step === 1 ? domains.length : (step === 3 ? topics.length : (step === 2 ? subjects.length : (step === 4 ? subtopics.length : 0)))) / currentPageSize) - 1 || loading || isLocked || (step === 5 && isArmed)}
                                        className={cn(
                                            "p-1.5 rounded-md transition-all",
                                            "bg-[#FF2D551A] border border-[#FF2D5533] text-[#FF2D55] hover:bg-[#FF2D55] hover:text-white",
                                            "disabled:bg-[#FF2D550D] disabled:text-[#FF2D554D] disabled:border-[#FF2D551A] disabled:opacity-100", // PKG FIX
                                            (isArmed && step === 5) && "opacity-100"
                                        )}
                                        title="Next Page"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            ) : <div className="h-1" />}
                        </div>
                    </div>

                    {/* THE ENGINE (HEART): Left-Side Flex Slot */}
                    <div className={cn(
                        "flex-1 min-h-0 px-4 md:px-12 flex flex-col relative overflow-visible h-full transition-all duration-500",
                        loading && "opacity-40 grayscale-[0.5]"
                    )}>
                        {/* STATIONARY LAYOUT: Flush edges with 12px shadow buffer */}
                        <div className="flex-1 flex flex-col relative overflow-visible py-[12px] px-0 h-full">
                            {/* Loading Overlay Removed from here - moved up */}

                            {step === 1 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grid-rows-[repeat(2,min-content)] gap-6 duration-300 items-start overflow-visible">
                                    {paginatedDomains.map((domain, idx) => {
                                        const meta = getDomainMeta(idx + page * currentPageSize);
                                        const coverage = 70 + ((idx + page * currentPageSize) % 6) * 5; // synthetic coverage for UI
                                        return (
                                        <DomainCard
                                            key={domain.id}
                                            {...domain}
                                            description={domain.description ?? 'Explore curated challenges and labs in this domain.'}
                                            category={domain.category ?? 'General'}
                                            coverage={coverage}
                                            {...meta}
                                            isSelected={selectedDomains.includes(domain.id)}
                                            onSelect={toggleDomain}
                                            accentColor={meta.accent}
                                        />
                                    );
                                    })}
                                </div>
                            )}

                            {(step === 2 || step === 3 || step === 4) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grid-rows-[repeat(3,min-content)] gap-6 duration-300 items-start overflow-visible">
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
                                <div className="duration-300 h-full flex flex-col justify-between py-2">
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
                                                        "p-6 rounded-[1.25rem] border-2 transition-all duration-300 flex flex-col items-start justify-center min-h-[100px] text-left relative overflow-hidden",
                                                        difficulty === tier.id
                                                            ? "bg-[#FF2D55] text-white border-[#FF2D55] shadow-[0_10px_30px_rgba(255,45,85,0.4)] scale-[1.02] z-10"
                                                            : "bg-[#2D2D2D] text-white/90 border-transparent hover:border-[#FF2D55]/30 hover:bg-[#3D3D3D] hover:scale-[1.01]"
                                                    )}
                                                >
                                                    <p className={cn("text-base font-bold font-inter leading-tight mb-2", difficulty === tier.id ? "text-white" : "text-white")}>{tier.name}</p>
                                                    <p className={cn("text-[11px] font-medium font-inter leading-relaxed", difficulty === tier.id ? "text-white/80" : "text-white/40")}>{tier.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Middle Row: Question Count */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black font-outfit text-gray-400 uppercase tracking-[0.2em] mb-4">Density Calibration</p>
                                        <div className="grid grid-cols-3 gap-6">
                                            {(mode === 'basic' ? [10, 15, 20, 25] : [10, 20, 30, 40]).map((v) => (
                                                <button
                                                    key={v}
                                                    disabled={isLocked || isArmed}
                                                    onClick={() => setQuestionCount(v)}
                                                    className={cn(
                                                        "p-5 rounded-[1.25rem] border-2 transition-all duration-300 flex flex-col items-start justify-center min-h-[80px] text-left relative overflow-hidden",
                                                        questionCount === v
                                                            ? "bg-[#FF2D55] text-white border-[#FF2D55] shadow-[0_10px_30px_rgba(255,45,85,0.4)] scale-[1.02] z-10"
                                                            : "bg-[#2D2D2D] text-white/90 border-transparent hover:border-[#FF2D55]/30 hover:bg-[#3D3D3D] hover:scale-[1.01]"
                                                    )}
                                                >
                                                    <div className={cn("text-xl font-bold font-inter leading-none mb-1", questionCount === v ? "text-white" : "text-white")}>{v}</div>
                                                    <div className={cn("text-[10px] font-bold uppercase tracking-widest", questionCount === v ? "text-white/60" : "text-white/40")}>Questions</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* NAVIGATION FOOTER: 12% Slot (Left-Scoped at Step 5) */}
                    <div className="flex-none basis-[12dvh] px-4 md:px-12 flex items-center justify-between border-t border-gray-200 bg-white">
                        <div className="flex items-center justify-between w-full h-full">
                            <button
                                onClick={handleBack}
                                disabled={step === 1 || isLocked || isArmed}
                                className={cn(
                                    "group flex items-center gap-3 px-8 h-[54px] rounded-xl font-black font-outfit text-xs uppercase tracking-widest transition-all shadow-sm border-2",
                                    "bg-[#FF2D551A] border-[#FF2D5533] text-[#FF2D55] hover:bg-[#FF2D55] hover:text-white hover:border-[#FF2D55] hover:shadow-xl hover:shadow-[#FF2D55]/20 hover:scale-[1.02] active:scale-95",
                                    "disabled:bg-[#FF2D550D] disabled:text-[#FF2D554D] disabled:border-[#FF2D551A] disabled:opacity-100 disabled:pointer-events-none" // PKG FIX
                                )}
                            >
                                <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                                <span>BACK</span>
                            </button>

                            <button
                                onClick={handleNext}
                                disabled={
                                    (isLocked) ||
                                    (step === 5 && isArmed) ||
                                    (step === 1 && selectedDomains.length === 0) ||
                                    (step === 2 && selectedSubjects.length === 0) ||
                                    (step === 3 && selectedTopics.length === 0) ||
                                    (step === 4 && selectedSubtopics.length === 0)
                                }
                                className={cn(
                                    "group flex items-center gap-4 px-10 h-[54px] rounded-xl font-black font-outfit text-xs uppercase tracking-widest transition-all shadow-lg",
                                    "disabled:bg-[#FF2D550D] disabled:text-[#FF2D554D] disabled:border-[#FF2D551A] disabled:opacity-100 disabled:shadow-none disabled:scale-95 disabled:pointer-events-none", // PKG FIX
                                    isArmed && step !== 5
                                        ? "bg-black text-white hover:bg-gray-900 shadow-black/20"
                                        : "bg-[#FF2D55] text-white hover:bg-[#E61D44] shadow-[#FF2D55]/30 hover:shadow-xl hover:shadow-[#FF2D55]/40 hover:scale-[1.05] active:scale-95"
                                )}
                            >
                                <span>{step === 5 ? 'CONFIRM MISSION' : (step === 4 ? 'CALIBRATE ENGINE' : 'CONTINUE JOURNEY')}</span>
                                <ChevronRight size={18} className={cn("transition-transform", !isArmed && "group-hover:translate-x-1")} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Pane: Summary (Full-Height Side Pillar) */}
                {step === 5 && (
                    <div className="flex-1 flex flex-col min-h-0 border-l border-gray-100 bg-white">
                        <AssessmentSummary
                            domainName={currentDomain?.name || 'Not Selected'}
                            subjectsCount={selectedSubjects.length}
                            topicsCount={selectedTopics.length}
                            questionCount={questionCount}
                            difficulty={difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                            totalPoints={currentTopics.reduce((acc, curr) => {
                                const points = (curr as Topic & { points?: number }).points
                                    ?? Math.round(15 * questionCount / Math.max(selectedTopics.length || 1, 1));
                                return acc + points;
                            }, 0)}
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

            {/* Exit Confirmation Dialog */}
            <ExitConfirmationDialog
                isOpen={showExitDialog}
                onConfirm={confirmExit}
                onCancel={cancelExit}
                title="Leave Assessment Setup?"
                message="You have unsaved selections. Are you sure you want to leave?"
            />

            <ExamPreflightDialog
                isOpen={showPreflight}
                onSuccess={executeLaunch}
                onClose={() => setShowPreflight(false)}
            />
        </div>
    );
}
