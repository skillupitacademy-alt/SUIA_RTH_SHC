'use client';

import { useState } from 'react';
import { AssessmentSummary } from './AssessmentSummary';
import { DomainCard } from './DomainCard';
import { TopicChip } from './TopicChip';
import { Code, Shield, Cloud, Database, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const DOMAINS = [
    {
        id: 'full-stack',
        name: 'Full Stack Development',
        description: 'HTML, CSS, JavaScript, React, Node.js',
        icon: Code,
        coverage: 80,
        accent: 'blue'
    },
    {
        id: 'cybersecurity',
        name: 'Cybersecurity',
        description: 'Network Security, Ethical Hacking, Cryptography',
        icon: Shield,
        coverage: 65,
        accent: 'purple'
    },
    {
        id: 'cloud-computing',
        name: 'Cloud Computing',
        description: 'AWS, Azure, Google Cloud, DevOps',
        icon: Cloud,
        coverage: 90,
        accent: 'green'
    },
    {
        id: 'data-science',
        name: 'Data Science & AI',
        description: 'Python, Machine Learning, Deep Learning, SQL',
        icon: Database,
        coverage: 75,
        accent: 'orange'
    }
];

export function QuizSelectionConsole() {
    const [step, setStep] = useState(1);
    const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleDomain = (id: string) => {
        setSelectedDomains(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
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

    return (
        <div className="flex flex-col lg:flex-row gap-12 max-w-[1400px] mx-auto min-h-[600px]">
            {/* Left Pane (65%) */}
            <div className="w-full lg:w-[65%] space-y-12 pb-20">
                {step === 1 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-700">
                        <div>
                            <h2 className="text-4xl font-black font-outfit tracking-tighter text-[#1A1A1A] mb-2 uppercase">Select Domain</h2>
                            <p className="text-muted-foreground font-inter font-medium opacity-70">Choose your area of expertise to begin the assessment.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {DOMAINS.map((domain) => (
                                <DomainCard
                                    key={domain.id}
                                    {...domain}
                                    isSelected={selectedDomains.includes(domain.id)}
                                    onSelect={toggleDomain}
                                    accentColor={domain.accent}
                                />
                            ))}
                        </div>

                        {selectedDomains.length > 0 && (
                            <div className="flex justify-end pt-8 animate-in fade-in zoom-in duration-500">
                                <button
                                    onClick={() => setStep(2)}
                                    className="px-12 py-4 rounded-xl bg-[#FF2D55] text-white font-bold font-outfit uppercase tracking-widest shadow-[0_10px_30px_rgba(255,45,85,0.2)] hover:shadow-[0_15px_40px_rgba(255,45,85,0.4)] transition-all active:scale-95"
                                >
                                    Continue
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-700">
                        <div>
                            <button onClick={() => setStep(1)} className="text-[#FF2D55] text-xs font-bold uppercase tracking-widest mb-4 hover:underline">← Back to Domains</button>
                            <h2 className="text-4xl font-black font-outfit tracking-tighter text-[#1A1A1A] mb-2 uppercase">Refine Subjects</h2>
                            <p className="text-muted-foreground font-inter font-medium opacity-70 text-sm">Select the core subjects for your assessment pool.</p>
                        </div>

                        <div className="space-y-8">
                            <div className="flex flex-wrap gap-4">
                                {['Software Engineering', 'Data Science', 'Product Management', 'Design', 'Mobile', 'Cloud', 'DevOps'].map(sub => (
                                    <TopicChip
                                        key={sub}
                                        id={sub}
                                        name={sub}
                                        selectedCount={12}
                                        totalCount={20}
                                        isSelected={selectedSubjects.includes(sub)}
                                        onToggle={toggleSubject}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-8">
                            <button
                                onClick={() => setStep(3)}
                                disabled={selectedSubjects.length === 0}
                                className="px-12 py-4 rounded-xl bg-[#FF2D55] text-white font-bold font-outfit uppercase tracking-widest shadow-[0_10px_30px_rgba(255,45,85,0.2)] disabled:opacity-50 transition-all hover:shadow-[0_15px_40px_rgba(255,45,85,0.4)]"
                            >
                                Continue to Topics
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-700">
                        <div>
                            <button onClick={() => setStep(2)} className="text-[#FF2D55] text-xs font-bold uppercase tracking-widest mb-4 hover:underline">← Back to Subjects</button>
                            <h2 className="text-4xl font-black font-outfit tracking-tighter text-[#1A1A1A] mb-2 uppercase">Select Topics</h2>
                            <p className="text-muted-foreground font-inter font-medium opacity-70">High-density grid of strategic knowledge units.</p>
                        </div>

                        <div className="space-y-10">
                            {selectedSubjects.map(subject => (
                                <div key={subject} className="space-y-4">
                                    <h3 className="text-lg font-bold font-outfit text-[#1A1A1A] uppercase tracking-wider">{subject}</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {['Algorithms', 'System Design', 'Frontend', 'Backend', 'Deployment', 'Testing'].map(topic => (
                                            <TopicChip
                                                key={topic}
                                                id={`${subject}-${topic}`}
                                                name={topic}
                                                selectedCount={selectedTopics.includes(`${subject}-${topic}`) ? 8 : 0}
                                                totalCount={12}
                                                isSelected={selectedTopics.includes(`${subject}-${topic}`)}
                                                onToggle={toggleTopic}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-12">
                            <button
                                onClick={() => setStep(4)}
                                disabled={selectedTopics.length === 0}
                                className="px-12 py-4 rounded-xl bg-[#FF2D55] text-white font-bold font-outfit uppercase tracking-widest shadow-[0_10px_30px_rgba(255,45,85,0.2)] disabled:opacity-50 transition-all"
                            >
                                Continue to Subtopics
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-700">
                        <div>
                            <button onClick={() => setStep(3)} className="text-[#FF2D55] text-xs font-bold uppercase tracking-widest mb-4 hover:underline">← Back to Topics</button>
                            <h2 className="text-4xl font-black font-outfit tracking-tighter text-[#1A1A1A] mb-2 uppercase">Fine-tune Subtopics</h2>
                            <p className="text-muted-foreground font-inter font-medium opacity-70">Pinpoint specific skills for deeper evaluation.</p>
                        </div>

                        <div className="space-y-10">
                            {selectedTopics.map(topic => (
                                <div key={topic} className="space-y-4">
                                    <h3 className="text-lg font-bold font-outfit text-[#1A1A1A] uppercase tracking-wider">{topic.split('-').pop()}</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {['Fundamentals', 'Advanced Patterns', 'Performance', 'Security', 'Testing'].map(subtopic => (
                                            <TopicChip
                                                key={subtopic}
                                                id={`${topic}-${subtopic}`}
                                                name={subtopic}
                                                selectedCount={selectedSubtopics.includes(`${topic}-${subtopic}`) ? 1 : 0}
                                                totalCount={5}
                                                isSelected={selectedSubtopics.includes(`${topic}-${subtopic}`)}
                                                onToggle={toggleSubtopic}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4 text-muted-foreground">
                                <Shield className="text-[#FF2D55]" size={20} />
                                <span className="text-sm font-bold font-outfit uppercase tracking-widest">Assessment Configuration Finalized</span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Ready to initialize environment</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Pane (35%) */}
            <div className="w-full lg:w-[35%]">
                <AssessmentSummary
                    domainName={selectedDomains.length > 0 ? `${selectedDomains.length} Domains` : 'Not Selected'}
                    subjectsCount={selectedSubjects.length}
                    topicsCount={selectedTopics.length}
                    questionCount={40 + selectedTopics.length * 8 + selectedSubtopics.length * 2}
                    difficulty="Intermediate"
                    totalPoints={200 + selectedTopics.length * 20 + selectedSubtopics.length * 5}
                    isReady={step === 4 && selectedSubtopics.length > 0}
                    onStart={() => {
                        setLoading(true);
                        setTimeout(() => setLoading(false), 2000);
                    }}
                    loading={loading}
                />
            </div>
        </div>
    );
}
