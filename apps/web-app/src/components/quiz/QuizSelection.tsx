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
    Loader2,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';

// Map icons to domain IDs (fallback/static mapping for aesthetics)
const ICON_MAP: Record<string, any> = {
    'full-stack': Code,
    'web-development': Code,
    'data-analyst': LineChart,
    'data-science': Database,
    'cyber-security': Lock,
    'cybersecurity': Lock,
    'ethical-hacking': ShieldCheck,
    'cloud-computing': Layers,
    'cloud': Layers,
    'mobile-development': Sparkles,
    'devops': Activity,
    'artificial-intelligence': Sparkles,
    'ai': Sparkles,
    'database-systems': Database,
};

export function QuizSelection() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [domains, setDomains] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [fetchingHierarchy, setFetchingHierarchy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [fullHierarchy, setFullHierarchy] = useState<any>(null);

    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);

    const [difficulty, setDifficulty] = useState('mixed');
    const [questionCount, setQuestionCount] = useState(10);

    // Initial load of active domains
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

    // Fetch full hierarchy when a domain is selected
    useEffect(() => {
        const fetchHierarchy = async () => {
            if (!selectedDomain) {
                setFullHierarchy(null);
                return;
            }

            setFetchingHierarchy(true);
            try {
                const hierarchy = await apiClient.quiz.getDomainHierarchy(selectedDomain);
                setFullHierarchy(hierarchy);
            } catch (err) {
                console.error("Failed to fetch domain hierarchy", err);
            } finally {
                setFetchingHierarchy(false);
            }
        };
        fetchHierarchy();
    }, [selectedDomain]);

    // Derived data for steps
    const subjects = fullHierarchy?.subjects || [];
    const activeSubjects = subjects.filter((s: any) => selectedSubjects.includes(s.id));

    const topics = activeSubjects.flatMap((s: any) => s.topics || []);
    const activeTopics = topics.filter((t: any) => selectedTopics.includes(t.id));

    const subtopics = activeTopics.flatMap((t: any) => t.subtopics || []);

    const toggleItem = (list: string[], setList: (val: string[]) => void, id: string, resetChildren?: () => void) => {
        setError(null);
        const next = list.includes(id) ? list.filter(item => item !== id) : [...list, id];
        setList(next);
        if (resetChildren) resetChildren();
    };

    const handleStartExam = async () => {
        if (!selectedDomain) return;
        if (selectedSubjects.length === 0) {
            setError("Please select at least one subject to proceed.");
            return;
        }

        setStarting(true);
        try {
            const exam = await apiClient.quiz.startExam({
                blueprintId: selectedDomain,
                subjects: selectedSubjects,
                topicIds: selectedTopics.length > 0 ? selectedTopics : undefined,
                subtopicIds: selectedSubtopics.length > 0 ? selectedSubtopics : undefined,
                difficulty,
                questionCount
            });

            router.push(`/quiz/active-session?examId=${exam.examId}`);
        } catch (err: any) {
            console.error("Failed to start exam", err);
            setError(err.message || "Failed to start exam session.");
            setStarting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground font-medium uppercase tracking-[0.2em] text-xs">Initializing...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-16">
            {/* Step 1: Domain Selection */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shadow-sm border border-primary/10 italic">1</div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight uppercase italic text-[#1A1A1A]">Select Domain</h2>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Core Assessment Area</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {domains.map((item) => {
                        const Icon = ICON_MAP[item.category?.toLowerCase()] || ICON_MAP[item.id] || Code;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    if (selectedDomain === item.id) return;
                                    setSelectedDomain(item.id);
                                    setSelectedSubjects([]);
                                    setSelectedTopics([]);
                                    setSelectedSubtopics([]);
                                }}
                                className={cn(
                                    "group relative p-8 rounded-[3rem] border-2 transition-all duration-500 text-left overflow-hidden",
                                    selectedDomain === item.id
                                        ? "border-primary bg-primary/[0.02] shadow-2xl shadow-primary/10 ring-4 ring-primary/5"
                                        : "border-muted-foreground/5 bg-white hover:border-primary/40 hover:shadow-xl"
                                )}
                            >
                                <div className={cn(
                                    "mb-6 p-5 rounded-3xl w-fit transition-all duration-500 group-hover:scale-110",
                                    selectedDomain === item.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                )}>
                                    <Icon size={32} />
                                </div>
                                <h3 className="text-2xl font-black mb-2 text-[#1A1A1A] tracking-tight">{item.name}</h3>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-80">
                                    {item.description || `Master industry-standard practices and tools in ${item.name}.`}
                                </p>

                                {selectedDomain === item.id && (
                                    <div className="absolute top-8 right-8 animate-in fade-in zoom-in duration-300">
                                        <div className="bg-primary text-white p-1 rounded-full shadow-lg">
                                            <Sparkles size={14} className="animate-pulse" />
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Step 2: Subject Filtering */}
            {selectedDomain && (
                <section className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shadow-sm border border-primary/10 italic">2</div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight uppercase italic text-[#1A1A1A]">Refine Subjects</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Specialized Focus Areas</p>
                        </div>
                    </div>
                    {fetchingHierarchy ? (
                        <div className="flex items-center gap-3 py-4 text-muted-foreground font-bold italic text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" /> Resolving Catalog...
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-4">
                            {subjects.map((subject: any) => (
                                <button
                                    key={subject.id}
                                    onClick={() => toggleItem(selectedSubjects, setSelectedSubjects, subject.id, () => {
                                        setSelectedTopics([]);
                                        setSelectedSubtopics([]);
                                    })}
                                    className={cn(
                                        "px-8 py-4 rounded-[1.5rem] border-2 font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm",
                                        selectedSubjects.includes(subject.id)
                                            ? "border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                                            : "border-muted bg-white hover:border-primary/30 text-muted-foreground hover:text-primary"
                                    )}
                                >
                                    {subject.name}
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Step 3: Topic Selection */}
            {selectedSubjects.length > 0 && topics.length > 0 && (
                <section className="space-y-8 animate-in slide-in-from-bottom-8 duration-600">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shadow-sm border border-primary/10 italic">3</div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight uppercase italic text-[#1A1A1A]">Select Topics</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Detailed Knowledge Units</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {topics.map((topic: any) => (
                            <button
                                key={topic.id}
                                onClick={() => toggleItem(selectedTopics, setSelectedTopics, topic.id, () => setSelectedSubtopics([]))}
                                className={cn(
                                    "px-6 py-3.5 rounded-2xl border-2 font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95",
                                    selectedTopics.includes(topic.id)
                                        ? "border-primary bg-primary/5 text-primary shadow-md shadow-primary/5"
                                        : "border-muted-foreground/10 bg-white hover:border-primary/20 text-muted-foreground"
                                )}
                            >
                                {topic.name}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Step 4: Subtopic Selection */}
            {selectedTopics.length > 0 && subtopics.length > 0 && (
                <section className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shadow-sm border border-primary/10 italic">4</div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight uppercase italic text-[#1A1A1A]">Subtopic (Component)</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Targeted Skill Verification</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {subtopics.map((subtopic: any) => (
                            <button
                                key={subtopic.id}
                                onClick={() => toggleItem(selectedSubtopics, setSelectedSubtopics, subtopic.id)}
                                className={cn(
                                    "px-5 py-3 rounded-xl border-2 font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95",
                                    selectedSubtopics.includes(subtopic.id)
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-muted-foreground/5 bg-muted/30 hover:border-primary/20 text-muted-foreground"
                                )}
                            >
                                {subtopic.name}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Step 5: Configuration */}
            {selectedDomain && (
                <section className="space-y-10 animate-in slide-in-from-bottom-8 duration-800">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shadow-sm border border-primary/10 italic">5</div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight uppercase italic text-[#1A1A1A]">Exam Configuration</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Runtime Parameters</p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/20 text-red-600 font-extrabold text-xs uppercase tracking-widest flex items-center gap-3 animate-in fade-in duration-300">
                            <ShieldCheck size={20} />
                            {error}
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-12 bg-white/40 backdrop-blur-3xl p-12 rounded-[4rem] border border-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10" />

                        <div className="space-y-10">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-6 block">Question Count</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {[5, 10, 20].map(count => (
                                        <button
                                            key={count}
                                            onClick={() => setQuestionCount(count)}
                                            className={cn(
                                                "py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all",
                                                questionCount === count
                                                    ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5"
                                                    : "border-muted-foreground/5 bg-transparent text-muted-foreground hover:bg-muted/10 font-bold"
                                            )}
                                        >
                                            {count} Qs
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-6 block">Difficulty Preference</label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {['mixed', 'simple', 'intermediate', 'expert'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setDifficulty(opt)}
                                            className={cn(
                                                "py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                                                difficulty === opt
                                                    ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5"
                                                    : "border-muted-foreground/5 bg-transparent text-muted-foreground hover:bg-muted/10 font-bold"
                                            )}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-6 text-[10px] text-muted-foreground font-bold italic tracking-tight opacity-60">
                                    * Mixed uses 30/30/40 engine rule. Expert is limited to expert-tier pooled questions.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col justify-end gap-8 bg-muted/20 p-8 rounded-[3rem] border border-muted/30">
                            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm"><Clock size={14} className="text-primary" /> {Math.ceil(questionCount * 1.5)} MINS</div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm"><Layers size={14} className="text-[#FF4B91]" /> {questionCount} QUESTIONS</div>
                            </div>
                            <button
                                className="w-full py-6 rounded-[2rem] bg-primary text-primary-foreground text-xl font-black uppercase tracking-widest shadow-2xl shadow-primary/40 flex items-center justify-center gap-4 hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                                onClick={handleStartExam}
                                disabled={starting}
                            >
                                {starting ? <Loader2 className="h-7 w-7 animate-spin" /> : (
                                    <>
                                        Start Enterprise Exam
                                        <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
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
