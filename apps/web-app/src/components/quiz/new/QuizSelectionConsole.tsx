'use client';

import { useState, useEffect } from 'react';
import { AssessmentSummary } from './AssessmentSummary';
import { DomainCard } from './DomainCard';
import { TopicChip } from './TopicChip';
import { Code, Shield, Cloud, Database, Check, Loader2, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@quiz/api-client';

const JourneyBadge = ({ text }: { text: string }) => (
    <div className="inline-flex items-center px-4 py-1.5 rounded-full border-2 border-[#FF2D55]/20 bg-white shadow-sm animate-in zoom-in duration-500">
        <span className="text-[10px] font-black font-outfit text-[#FF2D55] uppercase tracking-[0.2em]">{text}</span>
    </div>
);

const DottedProgressBar = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center gap-4">
        {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
                <div className={cn(
                    "w-3 h-3 rounded-full border-2 transition-all duration-500",
                    s < currentStep ? "bg-[#FF2D55] border-[#FF2D55]" :
                        s === currentStep ? "bg-[#FF2D55] border-[#FF2D55] shadow-[0_0_20px_rgba(255,45,85,0.5)] scale-125" :
                            "bg-transparent border-gray-300"
                )} />
                {s < 5 && (
                    <div className={cn(
                        "w-12 h-[2px] mx-1 transition-all duration-500",
                        s < currentStep ? "bg-[#FF2D55]" : "bg-gray-200/80"
                    )} />
                )}
            </div>
        ))}
    </div>
);

export function QuizSelectionConsole() {
    const [step, setStep] = useState(1);
    const [domains, setDomains] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [topics, setTopics] = useState<any[]>([]);
    const [subtopics, setSubtopics] = useState<any[]>([]);

    const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectionError, setSelectionError] = useState<string | null>(null);

    // Engine Calibration State (Step 5)
    const [difficulty, setDifficulty] = useState('mixed');
    const [questionCount, setQuestionCount] = useState(20);
    const [isArmed, setIsArmed] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    // Pagination State
    const [page, setPage] = useState(0);
    const domainPageSize = 4;
    const subPageSize = 8;
    const currentPageSize = step === 1 ? domainPageSize : subPageSize;

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

    const toggleDomain = (id: string) => {
        // Enforce Single Select per user instruction
        setSelectedDomains([id]);
        // Reset child levels
        setSelectedSubjects([]);
        setSelectedTopics([]);
        setSelectedSubtopics([]);
    };

    const toggleSubject = (id: string) => {
        setSelectedSubjects(prev => {
            if (prev.includes(id)) {
                setSelectionError(null);
                return prev.filter(x => x !== id);
            }
            if (prev.length >= 4) {
                setSelectionError("SUBJECT LIMIT REACHED: MAX 4 SELECTIONS ALLOWED");
                return prev;
            }
            setSelectionError(null);
            return [...prev, id];
        });
        setSelectedTopics([]);
        setSelectedSubtopics([]);
    };

    const toggleTopic = (id: string) => {
        setSelectedTopics(prev => {
            if (prev.includes(id)) {
                setSelectionError(null);
                return prev.filter(x => x !== id);
            }
            if (prev.length >= 4) {
                setSelectionError("TOPIC LIMIT REACHED: MAX 4 SELECTIONS ALLOWED");
                return prev;
            }
            setSelectionError(null);
            return [...prev, id];
        });
        setSelectedSubtopics([]);
    };

    const toggleSubtopic = (id: string) => {
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

    const handleNext = () => {
        if (step === 5) {
            setIsArmed(true);
            return;
        }
        if (step < 5) {
            setStep(step + 1);
            setPage(0); // Reset page on step change
            setSelectionError(null);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            setPage(0); // Reset page on step change
            setSelectionError(null);
        }
    };

    const handlePrevPage = () => {
        setPage((prev) => Math.max(0, prev - 1));
    };

    const handleNextPage = () => {
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
        2: { title: "Refine Subjects", badge: "Curriculum Calibration", desc: "Select the core subjects for your assessment pool.", count: subjects.length },
        3: { title: "Select Topics", badge: "Knowledge Mapping", desc: "High-density grid of strategic knowledge units.", count: topics.length },
        4: { title: "Fine-tune Subtopics", badge: "Expert Precision", desc: "Pinpoint specific skills for deeper evaluation.", count: subtopics.length },
        5: { title: "Calibrate Engine", badge: "Engine Mastery", desc: "Finalize your assessment session by tuning the difficulty tier and question volume.", count: 0 }
    };

    const currentMeta = journeyInfo[step as keyof typeof journeyInfo];

    return (
        <div className="max-w-[1400px] mx-auto relative px-4 sm:px-6 lg:px-8 pt-0 pb-12">
            {/* Executive Dashboard Header (Stateless Baseline) */}
            <div className="mb-1 border-b border-gray-200/80 pb-2">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                    {/* Left: Global Context */}
                    <div className="flex-none min-w-fit">
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter font-outfit text-[#1A1A1A]">
                            Launch Evaluation
                        </h1>
                        <p className="text-xs text-muted-foreground font-inter font-medium opacity-60 mt-1 uppercase tracking-[0.3em]">
                            Strategic Ecosystem Configuration
                        </p>
                    </div>

                    {/* Center: Heartbeat Progress */}
                    <div className="flex justify-center flex-1">
                        <DottedProgressBar currentStep={step} />
                    </div>

                    {/* Right: Step Orientation */}
                    <div className="flex flex-col items-start lg:items-end text-left lg:text-right flex-none min-w-fit">
                        <div className="flex items-center gap-4 mb-2 whitespace-nowrap">
                            <JourneyBadge text={currentMeta.badge} />
                            <h2 className="text-3xl font-black font-outfit tracking-tight text-[#1A1A1A] uppercase">
                                {currentMeta.title} {currentMeta.count > 0 && `(${currentMeta.count})`}
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground font-inter font-medium opacity-70 max-w-md leading-relaxed">
                            {currentMeta.desc}
                        </p>
                    </div>
                </div>
            </div>

            <div className="h-[1px] bg-gray-200/80 w-full mb-1" />

            <div className="min-h-[32px] mb-4">
                {selectionError && (
                    <div className="flex items-center gap-2 text-[#FF2D55] animate-in slide-in-from-top-2 duration-300">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#FF2D55] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{selectionError}</span>
                    </div>
                )}
            </div>
            <div className="flex flex-col lg:flex-row gap-12 items-stretch">
                {/* Left Pane (65%) - Locked Height Console */}
                <div className="w-full lg:w-[65%] flex flex-col relative h-[600px]">
                    {/* Content Area (Stationary Grid via Slicing) */}
                    <div className="flex-1 overflow-visible relative">
                        {loading && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-[2px] rounded-[1.25rem] animate-in fade-in duration-300">
                                <Activity className="animate-spin text-[#FF2D55]" size={48} />
                            </div>
                        )}
                        {step === 1 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 animate-in fade-in duration-500">
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

                        {step === 2 && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-6 gap-y-12 animate-in fade-in duration-500">
                                {paginatedSubjects.map((sub) => (
                                    <TopicChip
                                        key={sub.id}
                                        {...sub}
                                        isSelected={selectedSubjects.includes(sub.id)}
                                        onToggle={toggleSubject}
                                    />
                                ))}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-6 gap-y-12 animate-in fade-in duration-500">
                                {paginatedTopics.map((topic) => (
                                    <TopicChip
                                        key={topic.id}
                                        {...topic}
                                        isSelected={selectedTopics.includes(topic.id)}
                                        onToggle={toggleTopic}
                                    />
                                ))}
                            </div>
                        )}

                        {step === 4 && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-6 gap-y-12 animate-in fade-in duration-500">
                                {paginatedSubtopics.map((subtopic) => (
                                    <TopicChip
                                        key={subtopic.id}
                                        {...subtopic}
                                        isSelected={selectedSubtopics.includes(subtopic.id)}
                                        onToggle={toggleSubtopic}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Step 5: Engine Calibration (Refactored Dark HUD) */}
                        {step === 5 && (
                            <div className="animate-in fade-in duration-500 h-full flex flex-col pt-6">
                                <div className="space-y-6">
                                    {/* Section 1: Difficulty Tier */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="h-4 w-1 bg-[#FF2D55] rounded-full" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Difficulty Tier</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-6">
                                            {[
                                                { id: 'mixed', name: 'Mixed', desc: 'Mastery Blend' },
                                                { id: 'beginner', name: 'Foundations', desc: 'Core Knowledge' },
                                                { id: 'expert', name: 'Elite', desc: 'Expert Level' }
                                            ].map((tier) => (
                                                <button
                                                    key={tier.id}
                                                    disabled={isLocked}
                                                    onClick={() => setDifficulty(tier.id)}
                                                    className={cn(
                                                        "p-6 rounded-[1.25rem] border-2 transition-all duration-300 group relative flex flex-col items-center justify-center min-h-[120px]",
                                                        difficulty === tier.id
                                                            ? "bg-[#FF2D55] border-[#FF2D55] shadow-[0_10px_30px_rgba(255,45,85,0.2)]"
                                                            : "bg-[#2B2B2B] border-transparent hover:bg-[#3D3D3D]",
                                                        isLocked && "opacity-50 pointer-events-none"
                                                    )}
                                                >
                                                    <p className="text-base font-black font-outfit uppercase tracking-tight text-white">
                                                        {tier.name}
                                                    </p>
                                                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-60 mt-1 text-white">
                                                        {tier.desc}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Section 2: Total Density (Refactored Dark Grid) - 10% Push */}
                                    <div className="space-y-4 mt-[10%]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="h-4 w-1 bg-[#FF2D55] rounded-full" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Total Density</p>
                                        </div>
                                        <div className="grid grid-cols-4 gap-6">
                                            {[5, 10, 15, 20, 25, 30, 40, 50].map((v) => (
                                                <button
                                                    key={v}
                                                    disabled={isLocked}
                                                    onClick={() => setQuestionCount(v)}
                                                    className={cn(
                                                        "p-6 rounded-[1.25rem] border-2 transition-all duration-300 group relative flex flex-col items-center justify-center min-h-[80px]",
                                                        questionCount === v
                                                            ? "bg-[#FF2D55] border-[#FF2D55] shadow-[0_10px_30px_rgba(255,45,85,0.2)]"
                                                            : "bg-[#2B2B2B] border-transparent hover:bg-[#3D3D3D]",
                                                        isLocked && "opacity-50 pointer-events-none"
                                                    )}
                                                >
                                                    <div className="text-xl font-black font-outfit text-white tracking-tighter">{v}</div>
                                                    <div className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">Questions</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Resulting Logic Display - 5% Push */}
                                    <div className={cn("bg-gray-50/50 p-6 rounded-3xl border border-gray-200/80 mt-[5%] transition-all", isLocked && "opacity-50 grayscale")}>
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-0.5">
                                                <p className="text-3xl font-black font-outfit text-[#1A1A1A] tracking-tighter">~{Math.ceil(questionCount * 1.5)} MINS</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#FF2D55]">Calculated Duration</p>
                                            </div>
                                            <div className="h-8 w-[1px] bg-gray-200/80" />
                                            <div className="text-right">
                                                <p className="text-3xl font-black font-outfit text-[#1A1A1A] tracking-tighter">{difficulty.toUpperCase()}</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mastery Profile</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Fixed Action Footer (Absolute Anchored) with Hairline */}
                    <div className="h-[1px] bg-gray-200/80 w-full mt-auto" />
                    <div className="py-8 flex items-center justify-between border-gray-100 bg-white/50 backdrop-blur-sm z-20">
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className={cn(
                                "px-12 py-4 rounded-xl font-bold font-outfit text-sm uppercase tracking-widest transition-all bg-[#FF2D55] text-white shadow-[0_10px_30px_rgba(255,45,85,0.2)] hover:shadow-[0_15px_40px_rgba(255,45,85,0.45)] active:scale-95",
                                (step === 1 || isLocked) && "opacity-20 pointer-events-none shadow-none"
                            )}
                        >
                            BACK
                        </button>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePrevPage}
                                disabled={page === 0 || loading || isLocked || step === 5}
                                className={cn(
                                    "p-4 rounded-xl transition-all active:scale-95 bg-[#FF2D55] text-white shadow-[0_10px_30px_rgba(255,45,85,0.2)] hover:shadow-[0_15px_40px_rgba(255,45,85,0.45)]",
                                    (page === 0 || loading || isLocked || step === 5) && "opacity-20 pointer-events-none shadow-none"
                                )}
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div className={cn("px-6 py-4 rounded-xl border border-gray-100 bg-white/50 backdrop-blur-sm flex items-center justify-center min-w-[120px] transition-opacity", step === 5 && "opacity-10 pointer-events-none")}>
                                <span className="text-[10px] font-black font-outfit text-gray-500 uppercase tracking-[0.2em]">
                                    {String(page + 1).padStart(2, '0')} / {String(Math.max(1, Math.ceil((step === 1 ? domains.length : (step === 3 ? topics.length : (step === 2 ? subjects.length : (step === 4 ? subtopics.length : 0)))) / currentPageSize))).padStart(2, '0')}
                                </span>
                            </div>

                            <button
                                onClick={handleNextPage}
                                disabled={page >= Math.ceil((step === 1 ? domains.length : (step === 3 ? topics.length : (step === 2 ? subjects.length : (step === 4 ? subtopics.length : 0)))) / currentPageSize) - 1 || loading || isLocked || step === 5}
                                className={cn(
                                    "p-4 rounded-xl transition-all active:scale-95 bg-[#FF2D55] text-white shadow-[0_10px_30px_rgba(255,45,85,0.2)] hover:shadow-[0_15px_40px_rgba(255,45,85,0.45)]",
                                    (page >= Math.ceil((step === 1 ? domains.length : (step === 3 ? topics.length : (step === 2 ? subjects.length : (step === 4 ? subtopics.length : 0)))) / currentPageSize) - 1 || loading || isLocked || step === 5) && "opacity-20 pointer-events-none shadow-none"
                                )}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

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
                                "px-12 py-4 rounded-xl font-bold font-outfit uppercase tracking-widest transition-all bg-[#FF2D55] text-white shadow-[0_10px_30px_rgba(255,45,85,0.2)] hover:shadow-[0_15px_40_rgba(255,45,85,0.45)] active:scale-95",
                                (isLocked || (step < 5 && ((step === 1 && selectedDomains.length === 0) ||
                                    (step === 2 && selectedSubjects.length === 0) ||
                                    (step === 3 && selectedTopics.length === 0) ||
                                    (step === 4 && selectedSubtopics.length === 0)))) && "opacity-20 pointer-events-none shadow-none",
                                step === 5 && isArmed && "bg-white text-[#FF2D55] border-2 border-[#FF2D55] shadow-none cursor-default active:scale-100"
                            )}
                        >
                            {step === 5 ? (isArmed ? "MISSION ARMED 🚀" : "INITIATE ASSESSMENT 🚀") : (step === 4 ? "CALIBRATE ENGINE →" : "CONTINUE →")}
                        </button>
                    </div>
                </div>

                {/* Right Pane (35%) - Aligned Top & Bottom */}
                <div className="w-full lg:w-[35%] flex flex-col h-[600px] pt-0">
                    <AssessmentSummary
                        domainName={currentDomain?.name || 'Not Selected'}
                        subjectsCount={selectedSubjects.length}
                        topicsCount={selectedTopics.length}
                        questionCount={questionCount}
                        difficulty={difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        totalPoints={100 + selectedTopics.length * 15 + selectedSubtopics.length * 5}
                        isReady={isArmed}
                        onStart={() => setIsLocked(true)}
                        isLocked={isLocked}
                        loading={loading}
                        selectedSubjects={currentSubjects.map(s => s.name)}
                        selectedTopics={currentTopics.map(t => t.name)}
                        selectedSubtopics={currentSubtopics.map(st => st.name)}
                    />
                </div>
            </div>
        </div >
    );
}
