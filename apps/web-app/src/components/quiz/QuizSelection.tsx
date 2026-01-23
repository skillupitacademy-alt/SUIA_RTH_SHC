'use client';

import { useState } from 'react';
import {
    Code,
    ShieldCheck,
    Database,
    LineChart,
    Lock,
    ArrowRight,
    Clock,
    Layers,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuizStore } from '@/store/quiz-store';

const DOMAINS = [
    { id: 'full-stack', title: 'Full Stack', icon: Code, subjects: ['Frontend', 'Backend', 'DevOps', 'Mobile'] },
    { id: 'data-analyst', title: 'Data Analyst', icon: LineChart, subjects: ['SQL', 'Excel', 'Statistics', 'PowerBI'] },
    { id: 'data-science', title: 'Data Science', icon: Database, subjects: ['Python', 'Machine Learning', 'Data Visualization'] },
    { id: 'cyber-security', title: 'Cyber Security', icon: Lock, subjects: ['Networking', 'Penetration Testing', 'Incident Response'] },
    { id: 'ethical-hacking', title: 'Ethical Hacking', icon: ShieldCheck, subjects: ['Linux', 'Web App Hacking', 'Digital Forensics'] },
];

export function QuizSelection() {
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [difficulty, setDifficulty] = useState('mixed');

    const domain = DOMAINS.find(d => d.id === selectedDomain);

    const toggleSubject = (s: string) => {
        setSelectedSubjects(prev =>
            prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            {/* Step 1: Domain Selection */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                    <h2 className="text-2xl font-bold tracking-tight">Select Domain</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {DOMAINS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setSelectedDomain(item.id);
                                setSelectedSubjects([]);
                            }}
                            className={cn(
                                "group relative p-8 rounded-[2.5rem] border-2 transition-all duration-300 text-left",
                                selectedDomain === item.id
                                    ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 ring-2 ring-primary/20"
                                    : "border-muted-foreground/10 bg-background hover:border-primary/40 hover:shadow-lg"
                            )}
                        >
                            <div className={cn(
                                "mb-6 p-4 rounded-2xl w-fit transition-colors",
                                selectedDomain === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            )}>
                                <item.icon size={32} />
                            </div>
                            <h3 className="text-xl font-extrabold mb-2">{item.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Master industry-standard practices and tools in {item.title}.
                            </p>
                            <div className={cn(
                                "absolute top-8 right-8 transition-opacity",
                                selectedDomain === item.id ? "opacity-100" : "opacity-0"
                            )}>
                                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                    <ChevronRight size={14} className="text-white" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Step 2: Subject Filtering */}
            {selectedDomain && (
                <section className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                        <h2 className="text-2xl font-bold tracking-tight">Refine Subjects</h2>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {domain?.subjects.map(subject => (
                            <button
                                key={subject}
                                onClick={() => toggleSubject(subject)}
                                className={cn(
                                    "px-6 py-3 rounded-2xl border-2 font-bold transition-all",
                                    selectedSubjects.includes(subject)
                                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "border-muted bg-background hover:border-primary/30"
                                )}
                            >
                                {subject}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Step 3: Configuration */}
            {selectedDomain && selectedSubjects.length > 0 && (
                <section className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                        <h2 className="text-2xl font-bold tracking-tight">Exam Configuration</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 bg-muted/20 p-8 rounded-[3rem] border border-primary/5">
                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 block">Difficulty Distribution</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['mixed', 'fixed'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setDifficulty(opt)}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2",
                                                difficulty === opt ? "border-primary bg-background text-primary" : "border-muted-foreground/10 bg-transparent text-muted-foreground"
                                            )}
                                        >
                                            {opt === 'mixed' ? <Sparkles size={16} /> : <Layers size={16} />}
                                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-4 text-xs text-muted-foreground/80 italic">
                                    * Mixed difficulty uses our 30/30/40 engine rule.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col justify-end gap-6">
                            <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                                <div className="flex items-center gap-1.5"><Clock size={16} /> 45 Minutes</div>
                                <div className="flex items-center gap-1.5"><Layers size={16} /> 20 Questions</div>
                            </div>
                            <button
                                className="w-full py-5 rounded-3xl bg-primary text-primary-foreground text-lg font-black shadow-xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform active:scale-95"
                                onClick={() => {
                                    useQuizStore.getState().startQuiz(
                                        [
                                            {
                                                id: 1,
                                                type: 'MCQ',
                                                text: 'What is the primary purpose of React Hooks?',
                                                options: [
                                                    'To manage state and lifecycle in functional components',
                                                    'To replace all class components',
                                                    'To handle CSS-in-JS directly',
                                                    'To optimize image loading automatically'
                                                ],
                                                difficulty: 'Simple'
                                            },
                                            {
                                                id: 2,
                                                type: 'CODE_MCQ',
                                                text: 'Analyze the following code snippet. What will be the output?',
                                                code: `const x = [1, 2, 3];\nconst y = x.map(n => n * 2).filter(n => n > 3);\nconsole.log(y);`,
                                                options: [
                                                    '[4, 6]',
                                                    '[2, 4, 6]',
                                                    '[3, 6]',
                                                    '[1, 2, 3]'
                                                ],
                                                difficulty: 'Intermediate'
                                            },
                                        ],
                                        { domain: selectedDomain, subjects: selectedSubjects, difficulty },
                                        2700
                                    );
                                    window.location.href = '/quiz/active-session';
                                }}
                            >
                                Start Enterprise Exam
                                <ArrowRight size={22} />
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
