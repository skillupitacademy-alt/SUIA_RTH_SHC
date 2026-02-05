'use client';

import { useState, useEffect } from 'react';
import { AssessmentSummary } from './AssessmentSummary';
import { DomainCard } from './DomainCard';
import { TopicChip } from './TopicChip';
import { Code, Shield, Cloud, Database, Check, Loader2 } from 'lucide-react';
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

    // Pagination State
    const [page, setPage] = useState(0);
    const domainPageSize = 4;
    const subPageSize = 6;
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
        setSelectedSubjects(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [id] // Force single for now to match flow
        );
        setSelectedTopics([]);
        setSelectedSubtopics([]);
    };

    const toggleTopic = (id: string) => {
        setSelectedTopics(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [id]
        );
        setSelectedSubtopics([]);
    };

    const toggleSubtopic = (id: string) => {
        setSelectedSubtopics(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleNext = () => {
        if (step < 4) {
            setStep(step + 1);
            setPage(0); // Reset page on step change
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            setPage(0); // Reset page on step change
        }
    };

    const handleLoadMore = () => {
        const totalItems = step === 1 ? domains.length : (step === 3 ? topics.length : (step === 2 ? subjects.length : (step === 4 ? subtopics.length : 0)));
        const totalPages = Math.ceil(totalItems / currentPageSize);
        setPage((prev) => (prev + 1) % totalPages);
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
        <div className="max-w-[1400px] mx-auto min-h-[850px] relative px-4 sm:px-6 lg:px-8 py-12">
            {/* Header Section (Full Width Top Row) */}
            <div className="mb-9 min-h-[100px]">
                {loading && domains.length === 0 ? (
                    <div className="flex items-center gap-3 text-[#FF2D55] animate-pulse">
                        <Loader2 className="animate-spin" size={24} />
                        <span className="font-outfit font-bold uppercase tracking-widest text-lg">Syncing with Intelligence Hub...</span>
                    </div>
                ) : (
                    <>
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
                    </>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-12 items-stretch">
                {/* Left Pane (65%) - Locked Height Console */}
                <div className="w-full lg:w-[65%] flex flex-col relative h-[650px]">
                    {/* Content Area (Stationary Grid via Slicing) */}
                    <div className="flex-1 overflow-visible">
                        {step === 1 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in duration-500">
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
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in fade-in duration-500">
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
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in fade-in duration-500">
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
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in fade-in duration-500">
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

                        {(step === 1 || step === 3 || step === 2 || step === 4) && (
                            <button
                                onClick={handleLoadMore}
                                className="px-12 py-4 rounded-xl bg-[#FF2D55] text-white font-bold font-outfit text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(255,45,85,0.2)] hover:shadow-[0_15px_40px_rgba(255,45,85,0.45)] active:scale-95 transition-all"
                            >
                                LOAD MORE
                            </button>
                        )}

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
                <div className="w-full lg:w-[35%] flex flex-col h-[650px] pt-[136px]">
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
