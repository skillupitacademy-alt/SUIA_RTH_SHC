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
    Loader2,
    Activity,
    ChevronDown,
    Check,
    Sparkles,
    FileWarning
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
    const [availableCounts, setAvailableCounts] = useState<{
        simple: number;
        intermediate: number;
        expert: number;
        total: number;
        isReady: boolean;
    } | null>(null);
    const [fetchingCounts, setFetchingCounts] = useState(false);
    const [showExtendedCount, setShowExtendedCount] = useState(false);

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

    // Fetch available question counts based on filters
    useEffect(() => {
        const fetchCounts = async () => {
            if (!selectedDomain) {
                setAvailableCounts(null);
                return;
            }
            setFetchingCounts(true);
            try {
                const counts = await apiClient.quiz.getQuestionCount({
                    domainId: selectedDomain,
                    subjects: selectedSubjects,
                    topicIds: selectedTopics,
                    subtopicIds: selectedSubtopics,
                });
                setAvailableCounts(counts);
            } catch (err) {
                console.error("Failed to fetch counts", err);
            } finally {
                setFetchingCounts(false);
            }
        };
        fetchCounts();
    }, [selectedDomain, selectedSubjects, selectedTopics, selectedSubtopics]);

    // Derived data for steps
    const subjects = fullHierarchy?.subjects || [];
    const activeSubjects = selectedSubjects.length > 0
        ? subjects.filter((s: any) => selectedSubjects.includes(s.id))
        : subjects;

    const topics = activeSubjects.flatMap((s: any) => s.topics || []);
    const activeTopics = selectedTopics.length > 0
        ? topics.filter((t: any) => selectedTopics.includes(t.id))
        : topics;

    const subtopics = activeTopics.flatMap((t: any) => t.subtopics || []);

    const toggleItem = (list: string[], setList: (val: string[]) => void, id: string, resetChildren?: () => void) => {
        setError(null);
        if (id === 'all') {
            setList([]);
            if (resetChildren) resetChildren();
            return;
        }
        const next = list.includes(id) ? list.filter(item => item !== id) : [...list, id];
        setList(next);
        if (resetChildren) resetChildren();
    };

    const isItemSelected = (list: string[], id: string) => {
        if (id === 'all') return list.length === 0;
        return list.includes(id);
    };

    const handleStartExam = async () => {
        if (!selectedDomain) {
            setError("Please select a domain to proceed.");
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
                {selectedDomain && availableCounts && (
                    <div className="mt-8 flex items-center gap-3 px-6 py-3 bg-primary/5 rounded-2xl w-fit border border-primary/10 animate-in fade-in zoom-in duration-300">
                        <Activity size={14} className="text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Available Questions in Domain: <span className="text-primary text-sm ml-1">{availableCounts.total}</span></span>
                    </div>
                )}
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
                            <button
                                onClick={() => toggleItem(selectedSubjects, setSelectedSubjects, 'all', () => {
                                    setSelectedTopics([]);
                                    setSelectedSubtopics([]);
                                })}
                                className={cn(
                                    "px-8 py-4 rounded-[1.5rem] border-2 font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm",
                                    isItemSelected(selectedSubjects, 'all')
                                        ? "border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                                        : "border-muted bg-white hover:border-primary/30 text-muted-foreground hover:text-primary"
                                )}
                            >
                                ALL SUBJECTS
                            </button>
                            {subjects.map((subject: any) => (
                                <button
                                    key={subject.id}
                                    onClick={() => toggleItem(selectedSubjects, setSelectedSubjects, subject.id, () => {
                                        setSelectedTopics([]);
                                        setSelectedSubtopics([]);
                                    })}
                                    className={cn(
                                        "px-8 py-4 rounded-[1.5rem] border-2 font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm",
                                        isItemSelected(selectedSubjects, subject.id)
                                            ? "border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                                            : "border-muted bg-white hover:border-primary/30 text-muted-foreground hover:text-primary"
                                    )}
                                >
                                    {subject.name}
                                </button>
                            ))}
                        </div>
                    )}
                    {availableCounts && (
                        <div className="mt-4 flex items-center gap-3 px-6 py-3 bg-primary/5 rounded-2xl w-fit border border-primary/10 animate-in fade-in zoom-in duration-300">
                            <Activity size={14} className="text-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Subject Refinement Pool: <span className="text-primary text-sm ml-1">{availableCounts.total}</span></span>
                        </div>
                    )}
                </section>
            )}

            {/* Step 3: Topic Selection */}
            {selectedDomain && topics.length > 0 && (
                <section className="space-y-8 animate-in slide-in-from-bottom-8 duration-600">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shadow-sm border border-primary/10 italic">3</div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight uppercase italic text-[#1A1A1A]">Select Topics</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Detailed Knowledge Units</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => toggleItem(selectedTopics, setSelectedTopics, 'all', () => setSelectedSubtopics([]))}
                            className={cn(
                                "px-6 py-3.5 rounded-2xl border-2 font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95",
                                isItemSelected(selectedTopics, 'all')
                                    ? "border-primary bg-primary/10 text-primary shadow-md shadow-primary/5"
                                    : "border-muted-foreground/10 bg-white hover:border-primary/20 text-muted-foreground"
                            )}
                        >
                            ALL TOPICS
                        </button>
                        {topics.map((topic: any) => (
                            <button
                                key={topic.id}
                                onClick={() => toggleItem(selectedTopics, setSelectedTopics, topic.id, () => setSelectedSubtopics([]))}
                                className={cn(
                                    "px-6 py-3.5 rounded-2xl border-2 font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95",
                                    isItemSelected(selectedTopics, topic.id)
                                        ? "border-primary bg-primary/5 text-primary shadow-md shadow-primary/5"
                                        : "border-muted-foreground/10 bg-white hover:border-primary/20 text-muted-foreground"
                                )}
                            >
                                {topic.name}
                            </button>
                        ))}
                    </div>
                    {availableCounts && (
                        <div className="mt-4 flex items-center gap-3 px-6 py-3 bg-primary/5 rounded-2xl w-fit border border-primary/10 animate-in fade-in zoom-in duration-300">
                            <Activity size={14} className="text-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Topic Filtered Pool: <span className="text-primary text-sm ml-1">{availableCounts.total}</span></span>
                        </div>
                    )}
                </section>
            )}

            {/* Step 4: Subtopic Selection */}
            {selectedDomain && subtopics.length > 0 && (
                <section className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shadow-sm border border-primary/10 italic">4</div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight uppercase italic text-[#1A1A1A]">Subtopic (Component)</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Targeted Skill Verification</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => toggleItem(selectedSubtopics, setSelectedSubtopics, 'all')}
                            className={cn(
                                "px-5 py-3 rounded-xl border-2 font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95",
                                isItemSelected(selectedSubtopics, 'all')
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-muted-foreground/5 bg-muted/30 hover:border-primary/20 text-muted-foreground"
                            )}
                        >
                            ALL SUBTOPICS
                        </button>
                        {subtopics.map((subtopic: any) => (
                            <button
                                key={subtopic.id}
                                onClick={() => toggleItem(selectedSubtopics, setSelectedSubtopics, subtopic.id)}
                                className={cn(
                                    "px-5 py-3 rounded-xl border-2 font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95",
                                    isItemSelected(selectedSubtopics, subtopic.id)
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-muted-foreground/5 bg-muted/30 hover:border-primary/20 text-muted-foreground"
                                )}
                            >
                                {subtopic.name}
                            </button>
                        ))}
                    </div>
                    {availableCounts && (
                        <div className="mt-4 flex items-center gap-3 px-6 py-3 bg-primary/5 rounded-2xl w-fit border border-primary/10 animate-in fade-in zoom-in duration-300">
                            <Activity size={14} className="text-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Subtopic Final Pool: <span className="text-primary text-sm ml-1">{availableCounts.total}</span></span>
                        </div>
                    )}
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
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-6 block">Question Count (Max)</label>
                                <div className="flex items-center gap-4 flex-wrap">
                                    {[5, 10, 15, 20].map(count => {
                                        const totalAvail = availableCounts?.total || 0;
                                        const isReady = availableCounts?.isReady;
                                        const isDisabled = !isReady || (count - totalAvail) > 5;
                                        return (
                                            <button
                                                key={count}
                                                disabled={isDisabled}
                                                onClick={() => setQuestionCount(count)}
                                                className={cn(
                                                    "px-6 py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all",
                                                    questionCount === count
                                                        ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5"
                                                        : "border-muted-foreground/5 bg-transparent text-muted-foreground hover:bg-muted/10 font-bold",
                                                    isDisabled && "opacity-20 grayscale cursor-not-allowed"
                                                )}
                                            >
                                                {count} Qs
                                            </button>
                                        );
                                    })}

                                    {(availableCounts?.total || 0) > 20 && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowExtendedCount(!showExtendedCount)}
                                                className={cn(
                                                    "px-6 py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2",
                                                    [5, 10, 15, 20].includes(questionCount)
                                                        ? "border-muted-foreground/5 bg-transparent text-muted-foreground hover:bg-muted/10 font-bold"
                                                        : "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5"
                                                )}
                                            >
                                                {![5, 10, 15, 20].includes(questionCount) ? `${questionCount} Qs` : 'More'}
                                                <ChevronDown size={14} className={cn("transition-transform duration-300", showExtendedCount && "rotate-180")} />
                                            </button>

                                            {showExtendedCount && (
                                                <div className="absolute top-full mt-3 left-0 bg-white border border-slate-200 rounded-3xl shadow-2xl p-3 z-50 grid grid-cols-2 gap-2 min-w-[200px] animate-in fade-in slide-in-from-top-2">
                                                    {Array.from({ length: Math.ceil((availableCounts?.total || 0) / 10) - 2 }, (_, i) => (i + 3) * 10).map(c => {
                                                        const totalAvail = availableCounts?.total || 0;
                                                        const isReady = availableCounts?.isReady;
                                                        const isDisabled = !isReady || (c - totalAvail) > 5;
                                                        return (
                                                            <button
                                                                key={c}
                                                                disabled={isDisabled}
                                                                onClick={() => {
                                                                    setQuestionCount(c);
                                                                    setShowExtendedCount(false);
                                                                }}
                                                                className={cn(
                                                                    "p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between",
                                                                    questionCount === c ? "bg-primary text-white" : "hover:bg-slate-50 text-slate-600",
                                                                    isDisabled && "opacity-30 grayscale cursor-not-allowed"
                                                                )}
                                                            >
                                                                {c} Questions
                                                                {questionCount === c && <Check size={12} />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {!availableCounts?.isReady && availableCounts?.total !== undefined && (
                                    <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                                        <FileWarning className="text-red-500 shrink-0 mt-0.5" size={16} />
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-red-600 tracking-widest leading-none mb-1">Governance Alert: 🔴 Action Required</p>
                                            <p className="text-[9px] font-bold text-red-500/80 leading-relaxed uppercase">
                                                This selection has a poor question pool ({availableCounts.simple}/4s, {availableCounts.intermediate}/4i, {availableCounts.expert}/5e). Selection is disabled until Admin solves this in Dashboard.
                                            </p>
                                        </div>
                                    </div>
                                )}
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
                                className="w-full py-6 rounded-[2rem] bg-primary text-primary-foreground text-xl font-black uppercase tracking-widest shadow-2xl shadow-primary/40 flex items-center justify-center gap-4 hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                                onClick={handleStartExam}
                                disabled={starting || !availableCounts?.isReady}
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
