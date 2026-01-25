'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    Sparkles,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';

// Map icons to domain IDs (fallback/static mapping for aesthetics)
const ICON_MAP: Record<string, any> = {
    'full-stack': Code,
    'data-analyst': LineChart,
    'data-science': Database,
    'cyber-security': Lock,
    'ethical-hacking': ShieldCheck,
};

export function QuizSelection() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [domains, setDomains] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [difficulty, setDifficulty] = useState('mixed');
    const [questionCount, setQuestionCount] = useState(10);

    useEffect(() => {
        const fetchDomains = async () => {
            if (!isAuthenticated) return;

            try {
                const data = await apiClient.quiz.getDomains();
                setDomains(data);
            } catch (err) {
                console.error("Failed to load domains", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDomains();
    }, [isAuthenticated]);

    const domain = domains.find(d => d.id === selectedDomain);

    const toggleSubject = (s: string) => {
        setSelectedSubjects(prev =>
            prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]
        );
    };

    const handleStartExam = async () => {
        if (!selectedDomain) return;
        if (selectedSubjects.length === 0) {
            alert("Please select at least one topic.");
            return;
        }

        setStarting(true);
        try {
            // Map selected subject names back to IDs
            const topicIds = domain.subjects
                .filter((s: any) => selectedSubjects.includes(s.name || s))
                .map((s: any) => s.id || s);

            const exam = await apiClient.quiz.startExam({
                blueprintId: selectedDomain,
                subjects: topicIds,
                difficulty,
                questionCount
            });

            router.push(`/quiz/active-session?examId=${exam.examId}`);
        } catch (err: any) {
            console.error("Failed to start exam", err);
            alert(err.message || "Failed to start exam session.");
            setStarting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground font-medium">Loading Enterprise Domains...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            {/* Step 1: Domain Selection */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                    <h2 className="text-2xl font-bold tracking-tight">Select Domain</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {domains.map((item) => {
                        const Icon = ICON_MAP[item.id] || Code;
                        return (
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
                                    <Icon size={32} />
                                </div>
                                <h3 className="text-xl font-extrabold mb-2">{item.name}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {item.description || `Master industry-standard practices and tools in ${item.name}.`}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Step 2: Subject Filtering */}
            {selectedDomain && domain?.subjects && (
                <section className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                        <h2 className="text-2xl font-bold tracking-tight">Refine Subjects</h2>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {domain.subjects.map((subject: any) => (
                            <button
                                key={subject.id || subject}
                                onClick={() => toggleSubject(subject.name || subject)}
                                className={cn(
                                    "px-6 py-3 rounded-2xl border-2 font-bold transition-all",
                                    selectedSubjects.includes(subject.name || subject)
                                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "border-muted bg-background hover:border-primary/30"
                                )}
                            >
                                {subject.name || subject}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Step 3: Configuration */}
            {selectedDomain && (
                <section className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                        <h2 className="text-2xl font-bold tracking-tight">Exam Configuration</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 bg-muted/20 p-8 rounded-[3rem] border border-primary/5">
                        <div className="space-y-8">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 block">Question Count</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[5, 10, 20].map(count => (
                                        <button
                                            key={count}
                                            onClick={() => setQuestionCount(count)}
                                            className={cn(
                                                "p-3 rounded-2xl border-2 font-bold text-sm",
                                                questionCount === count ? "border-primary bg-background text-primary" : "border-muted-foreground/10 bg-transparent text-muted-foreground"
                                            )}
                                        >
                                            {count} Qs
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 block">Difficulty Preference</label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {['mixed', 'simple', 'intermediate', 'expert'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setDifficulty(opt)}
                                            className={cn(
                                                "p-3 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-1",
                                                difficulty === opt ? "border-primary bg-background text-primary" : "border-muted-foreground/10 bg-transparent text-muted-foreground"
                                            )}
                                        >
                                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-4 text-xs text-muted-foreground/80 italic">
                                    * Mixed uses 30/30/40 engine rule. Expert is limited to expert-tier pooled questions.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col justify-end gap-6">
                            <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
                                <div className="flex items-center gap-1.5"><Clock size={16} /> 45 Minutes</div>
                                <div className="flex items-center gap-1.5"><Layers size={16} /> {questionCount} Questions</div>
                            </div>
                            <button
                                className="w-full py-5 rounded-3xl bg-primary text-primary-foreground text-lg font-black shadow-xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                onClick={handleStartExam}
                                disabled={starting}
                            >
                                {starting ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                                    <>
                                        Start Enterprise Exam
                                        <ArrowRight size={22} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
