'use client';

import { useState } from 'react';
import { AssessmentSummary } from './AssessmentSummary';
import { DomainCard } from './DomainCard';
import { TopicChip } from './TopicChip';
import { Code, Shield, Cloud, Database, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const DOMAINS = Array.from({ length: 20 }).map((_, i) => ({
    id: `domain-${i + 1}`,
    name: ['Full Stack Dev', 'Cyber Security', 'Cloud Arch', 'Data Science', 'DevOps Ops', 'AI/ML Engine', 'Mobile Apps', 'Blockchain'][i % 8] + (i >= 8 ? ` ${Math.floor(i / 8) + 1}` : ''),
    description: 'Strategic mastery of modern digital systems and architecture.',
    coverage: 65 + (i * 2) % 35,
    icon: [Code, Shield, Cloud, Database, Code, Shield, Cloud, Database][i % 8],
    accent: ['blue', 'purple', 'green', 'orange'][i % 4]
}));

const SUBJECTS = [
    { id: 's1', name: 'Software Engineering' },
    { id: 's2', name: 'System Design' },
    { id: 's3', name: 'Core Fundamentals' },
    { id: 's4', name: 'Security Arch' },
];

const TOPICS = Array.from({ length: 24 }).map((_, i) => ({
    id: `topic-${i + 1}`,
    name: ['React Hooks', 'Redis Cache', 'SQL Joins', 'Auth Flow', 'K8s Pods', 'CI/CD Flow'][i % 6] + (i >= 6 ? ` ${Math.floor(i / 6) + 1}` : ''),
    subjects: ['s1', 's2']
}));

const SUBTOPICS = Array.from({ length: 12 }).map((_, i) => ({
    id: `sub-${i + 1}`,
    name: `Module ${i + 1}: ${['Deep Dive', 'Efficiency', 'Hardening', 'Scaling'][i % 4]}`,
    topics: [`topic-${(i % 24) + 1}`]
}));

export function QuizSelectionConsole() {
    const [step, setStep] = useState(1);
    const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Pagination State (Surgical Addition)
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 4;

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
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
        setSelectedTopics([]);
        setSelectedSubtopics([]);
    };

    const toggleTopic = (id: string) => {
        setSelectedTopics(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
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

    const handleNextPage = () => {
        const totalItems = step === 1 ? DOMAINS.length : (step === 3 ? TOPICS.length : 0);
        const totalPages = Math.ceil(totalItems / PAGE_SIZE);
        setPage((prev) => (prev + 1) % totalPages);
    };

    const handlePrevPage = () => {
        const totalItems = step === 1 ? DOMAINS.length : (step === 3 ? TOPICS.length : 0);
        const totalPages = Math.ceil(totalItems / PAGE_SIZE);
        setPage((prev) => (prev - 1 + totalPages) % totalPages);
    };

    // Derived Data
    const currentDomain = selectedDomains.length > 0 ? DOMAINS.find(d => d.id === selectedDomains[0]) : null;
    const currentSubjects = SUBJECTS.filter(s => selectedSubjects.includes(s.id));
    const currentTopics = TOPICS.filter(t => selectedTopics.includes(t.id));
    const currentSubtopics = SUBTOPICS.filter(st => selectedSubtopics.includes(st.id));

    return (
        <div className="flex flex-col lg:flex-row gap-12 max-w-[1400px] mx-auto min-h-[550px] relative">
            {/* Left Pane (65%) - Surgical Stationary Overhaul V3 */}
            <div className="w-full lg:w-[65%] h-[550px] flex flex-col relative pb-32">

                {/* Header Section (Zero Layout Shift) */}
                <div className="mb-12 min-h-[100px]">
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                            <h2 className="text-4xl font-black font-outfit tracking-tighter text-[#1A1A1A] mb-2 uppercase">
                                Select Domain ({DOMAINS.length})
                            </h2>
                            <p className="text-muted-foreground font-inter font-medium opacity-70">Choose your area of expertise to begin the assessment.</p>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                            <h2 className="text-4xl font-black font-outfit tracking-tighter text-[#1A1A1A] mb-2 uppercase">
                                Refine Subjects ({SUBJECTS.length})
                            </h2>
                            <p className="text-muted-foreground font-inter font-medium opacity-70 text-sm">Select the core subjects for your assessment pool.</p>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                            <h2 className="text-4xl font-black font-outfit tracking-tighter text-[#1A1A1A] mb-2 uppercase">
                                Select Topics ({TOPICS.length})
                            </h2>
                            <p className="text-muted-foreground font-inter font-medium opacity-70">High-density grid of strategic knowledge units.</p>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                            <h2 className="text-4xl font-black font-outfit tracking-tighter text-[#1A1A1A] mb-2 uppercase">
                                Fine-tune Subtopics ({SUBTOPICS.length})
                            </h2>
                            <p className="text-muted-foreground font-inter font-medium opacity-70">Pinpoint specific skills for deeper evaluation.</p>
                        </div>
                    )}
                </div>

                {/* Content Area (Stationary Grid via Slicing) */}
                <div className="flex-1 overflow-visible">
                    {step === 1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 animate-in fade-in duration-500">
                            {DOMAINS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((domain) => (
                                <DomainCard
                                    key={domain.id}
                                    {...domain}
                                    isSelected={selectedDomains.includes(domain.id)}
                                    onSelect={toggleDomain}
                                    accentColor={domain.accent}
                                />
                            ))}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 animate-in fade-in duration-500">
                            {SUBJECTS.map((sub) => (
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 animate-in fade-in duration-500">
                            {TOPICS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((topic) => (
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 animate-in fade-in duration-500">
                            {SUBTOPICS.map((subtopic) => (
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

                {/* Fixed Action Footer (Absolute Anchored) - Synchronized Branding */}
                <div className="absolute bottom-0 left-0 right-0 py-8 flex items-center justify-between border-t border-gray-100 bg-white/50 backdrop-blur-sm z-20">
                    <div className="flex gap-4">
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className={cn(
                                "px-8 py-3 rounded-xl font-bold font-outfit text-sm uppercase tracking-widest transition-all",
                                step === 1
                                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                    : "bg-[#FF2D55] text-white shadow-[0_10px_30px_rgba(255,45,85,0.2)] hover:shadow-[0_15px_40px_rgba(255,45,85,0.4)] active:scale-95"
                            )}
                        >
                            [ BACK ]
                        </button>

                        {(step === 1 || step === 3) && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrevPage}
                                    className="px-6 py-3 rounded-xl bg-[#FF2D55] text-white font-bold font-outfit text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(255,45,85,0.2)] hover:shadow-[0_15px_40px_rgba(255,45,85,0.4)] active:scale-95 transition-all"
                                >
                                    [ ← PREV ]
                                </button>
                                <button
                                    onClick={handleNextPage}
                                    className="px-6 py-3 rounded-xl bg-[#FF2D55] text-white font-bold font-outfit text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(255,45,85,0.2)] hover:shadow-[0_15px_40px_rgba(255,45,85,0.4)] active:scale-95 transition-all"
                                >
                                    [ NEXT → ]
                                </button>
                            </div>
                        )}
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
                                ? "bg-[#FF2D55] text-white shadow-[0_10px_30px_rgba(255,45,85,0.2)] hover:shadow-[0_15px_40px_rgba(255,45,85,0.4)] active:scale-95"
                                : "bg-gray-100 text-gray-300 cursor-not-allowed"
                        )}
                    >
                        {step === 4 ? "FINALIZE" : "CONTINUE"}
                    </button>
                </div>
            </div>

            {/* Right Pane (35%) - Dynamic Summary (550px Stationary Frame) */}
            <div className="w-full lg:w-[35%] h-[550px] flex flex-col">
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
    );
}
