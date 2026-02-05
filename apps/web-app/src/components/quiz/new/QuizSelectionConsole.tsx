'use client';

import { useState, useEffect } from 'react';
import { AssessmentSummary } from './AssessmentSummary';
import { DomainCard } from './DomainCard';
import { TopicChip } from './TopicChip';
import { Code, Shield, Cloud, Database, Check, Loader2, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@quiz/api-client';

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

    // Pagination State
    const [page, setPage] = useState(0);
    const domainPageSize = 6;
    const subPageSize = 12;
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
        if (step < 4) {
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

    // Derived Data
    const currentDomain = domains.find(d => d.id === selectedDomains[0]);
    const currentSubjects = subjects.filter(s => selectedSubjects.includes(s.id));
    const currentTopics = topics.filter(t => selectedTopics.includes(t.id));
    const currentSubtopics = subtopics.filter(st => selectedSubtopics.includes(st.id));

    const paginatedDomains = domains.slice(page * currentPageSize, (page + 1) * currentPageSize);
    const paginatedTopics = topics.slice(page * currentPageSize, (page + 1) * currentPageSize);
    const paginatedSubjects = subjects.slice(page * currentPageSize, (page + 1) * currentPageSize);
    const paginatedSubtopics = subtopics.slice(page * currentPageSize, (page + 1) * currentPageSize);

    return (
        <div className="max-w-[1400px] mx-auto min-h-[800px] relative px-4 sm:px-6 lg:px-8 pt-4 pb-12">
            {/* Header Section (Full Width Top Row) */}
            <div className="mb-10 min-h-[100px] flex flex-col justify-end">
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                        <h2 className="text-4xl font-black font-outfit tracking-tighter text-[#1A1A1A] mb-2 uppercase">
                            Select Domain ({domains.length})
                        </h2>
                        <p className="text-muted-foreground font-inter font-medium opacity-70">Choose your area of expertise to begin the assessment.</p>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                        <h2 className="text-4xl font-black font-outfit tracking-tighter text-[#1A1A1A] mb-2 uppercase">
                            Refine Subjects ({subjects.length})
                        </h2>
                        <p className="text-muted-foreground font-inter font-medium opacity-70 text-sm">Select the core subjects for your assessment pool.</p>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                        <h2 className="text-4xl font-black font-outfit tracking-tighter text-[#1A1A1A] mb-2 uppercase">
                            Select Topics ({topics.length})
                        </h2>
                        <p className="text-muted-foreground font-inter font-medium opacity-70">High-density grid of strategic knowledge units.</p>
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                        <h2 className="text-4xl font-black font-outfit tracking-tighter text-[#1A1A1A] mb-2 uppercase">
                            Fine-tune Subtopics ({subtopics.length})
                        </h2>
                        <p className="text-muted-foreground font-inter font-medium opacity-70">Pinpoint specific skills for deeper evaluation.</p>
                    </div>
                )}

                {selectionError && (
                    <div className="mt-2 flex items-center gap-2 text-[#FF2D55] animate-in slide-in-from-top-2 duration-300">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#FF2D55] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{selectionError}</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-12 items-stretch">
                {/* Left Pane (65%) - Locked Height Console */}
                <div className="w-full lg:w-[65%] flex flex-col relative h-[700px]">
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
                    </div>

                    {/* Fixed Action Footer (Absolute Anchored) */}
                    <div className="mt-auto py-8 flex items-center justify-between border-t border-gray-100 bg-white/50 backdrop-blur-sm z-20">
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className={cn(
                                "px-12 py-4 rounded-xl font-bold font-outfit text-sm uppercase tracking-widest transition-all",
                                step === 1
                                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                    : "bg-[#FF2D55] text-white shadow-[0_10px_30px_rgba(255,45,85,0.2)] hover:shadow-[0_15px_40px_rgba(255,45,85,0.45)] active:scale-95"
                            )}
                        >
                            BACK
                        </button>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePrevPage}
                                disabled={page === 0 || loading}
                                className={cn(
                                    "p-4 rounded-xl transition-all active:scale-95 disabled:grayscale disabled:opacity-20",
                                    page === 0
                                        ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                        : "bg-[#FF2D55] text-white shadow-[0_10px_30px_rgba(255,45,85,0.2)] hover:shadow-[0_15px_40px_rgba(255,45,85,0.45)]"
                                )}
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div className="px-6 py-4 rounded-xl border border-gray-100 bg-white/50 backdrop-blur-sm flex items-center justify-center min-w-[120px]">
                                <span className="text-[10px] font-black font-outfit text-gray-500 uppercase tracking-[0.2em]">
                                    {String(page + 1).padStart(2, '0')} / {String(Math.max(1, Math.ceil((step === 1 ? domains.length : (step === 3 ? topics.length : (step === 2 ? subjects.length : (step === 4 ? subtopics.length : 0)))) / currentPageSize))).padStart(2, '0')}
                                </span>
                            </div>

                            <button
                                onClick={handleNextPage}
                                disabled={page >= Math.ceil((step === 1 ? domains.length : (step === 3 ? topics.length : (step === 2 ? subjects.length : (step === 4 ? subtopics.length : 0)))) / currentPageSize) - 1 || loading}
                                className={cn(
                                    "p-4 rounded-xl transition-all active:scale-95 disabled:grayscale disabled:opacity-20",
                                    page >= Math.ceil((step === 1 ? domains.length : (step === 3 ? topics.length : (step === 2 ? subjects.length : (step === 4 ? subtopics.length : 0)))) / currentPageSize) - 1
                                        ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                        : "bg-[#FF2D55] text-white shadow-[0_10px_30px_rgba(255,45,85,0.2)] hover:shadow-[0_15px_40px_rgba(255,45,85,0.45)]"
                                )}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={
                                (step === 1 && selectedDomains.length === 0) ||
                                (step === 2 && selectedSubjects.length === 0) ||
                                (step === 3 && selectedTopics.length === 0) ||
                                (step === 4 && selectedSubtopics.length === 0)
                            }
                            className={cn(
                                "px-12 py-4 rounded-xl font-bold font-outfit uppercase tracking-widest transition-all",
                                ((step === 1 && selectedDomains.length > 0) ||
                                    (step === 2 && selectedSubjects.length > 0) ||
                                    (step === 3 && selectedTopics.length > 0) ||
                                    (step === 4 && selectedSubtopics.length > 0))
                                    ? "bg-[#FF2D55] text-white shadow-[0_10px_30px_rgba(255,45,85,0.2)] hover:shadow-[0_15px_40_rgba(255,45,85,0.45)] active:scale-95"
                                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                            )}
                        >
                            {step === 4 ? "FINALIZE →" : "CONTINUE →"}
                        </button>
                    </div>
                </div>

                {/* Right Pane (35%) - Aligned Top & Bottom */}
                <div className="w-full lg:w-[35%] flex flex-col h-[700px] pt-0">
                    <AssessmentSummary
                        domainName={currentDomain?.name || 'Not Selected'}
                        subjectsCount={selectedSubjects.length}
                        topicsCount={selectedTopics.length}
                        questionCount={20 + selectedTopics.length * 5 + selectedSubtopics.length * 2}
                        difficulty="Intermediate"
                        totalPoints={100 + selectedTopics.length * 15 + selectedSubtopics.length * 5}
                        isReady={step === 4 && selectedSubtopics.length > 0}
                        onStart={() => {
                            setLoading(true);
                            setTimeout(() => setLoading(false), 2000);
                        }}
                        loading={loading}
                        selectedSubjects={currentSubjects.map(s => s.name)}
                        selectedTopics={currentTopics.map(t => t.name)}
                        selectedSubtopics={currentSubtopics.map(st => st.name)}
                    />
                </div>
            </div>
        </div>
    );
}
