'use client';

import { useEffect, useState } from 'react';
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
    Sparkles,
    FileWarning
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { apiClient, Domain, DomainHierarchy, QuestionCounts, Subject, Topic, Subtopic } from '@quiz/api-client';
import { clientLogger } from '@/utils/clientLogger';

// Map icons to domain IDs (fallback/static mapping for aesthetics)
const ICON_MAP: Record<string, typeof Code> = {
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
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [fetchingHierarchy, setFetchingHierarchy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [fullHierarchy, setFullHierarchy] = useState<DomainHierarchy | null>(null);

    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);

    const [difficulty, setDifficulty] = useState('mixed');
    const [questionCount, setQuestionCount] = useState(10);
    const [availableCounts, setAvailableCounts] = useState<QuestionCounts | null>(null);
    // counts fetched inline; no separate fetching state required

    // Initial load of active domains
    useEffect(() => {
        const fetchDomains = async () => {
            if (!isAuthenticated) return;
            try {
                const data = await apiClient.quiz.getDomains();
                setDomains(data);
            } catch (err) {
                clientLogger.error('Failed to load domains', { error: err instanceof Error ? err.message : 'unknown' });
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
                clientLogger.error('Failed to fetch domain hierarchy', { error: err instanceof Error ? err.message : 'unknown' });
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
            try {
                const counts = await apiClient.quiz.getQuestionCount({
                    domainId: selectedDomain,
                    subjects: selectedSubjects,
                    topicIds: selectedTopics,
                    subtopicIds: selectedSubtopics,
                });
                setAvailableCounts(counts);
            } catch (err) {
                clientLogger.error('Failed to fetch counts', { error: err instanceof Error ? err.message : 'unknown' });
            }
        };
        fetchCounts();
    }, [selectedDomain, selectedSubjects, selectedTopics, selectedSubtopics]);

    // Derived data for steps
    const subjects: Array<Subject & { topics: Array<Topic & { subtopics: Subtopic[] }> }> = fullHierarchy?.subjects || [];
    const activeSubjects = selectedSubjects.length > 0
        ? subjects.filter((s) => selectedSubjects.includes(s.id))
        : subjects;

    const topics = activeSubjects.flatMap((s) => s.topics || []);
    const activeTopics = selectedTopics.length > 0
        ? topics.filter((t) => selectedTopics.includes(t.id))
        : topics;

    const subtopics = activeTopics.flatMap((t) => t.subtopics || []);

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
            // Legacy console now uses strict transactional start
            const exam = await apiClient.quiz.startExam({
                blueprintId: selectedDomain,
                subjectIds: selectedSubjects,
                topicIds: selectedTopics.length > 0 ? selectedTopics : undefined,
                subtopicIds: selectedSubtopics.length > 0 ? selectedSubtopics : undefined,
                difficulty,
                questionCount
            }, {
                idempotencyKey: crypto.randomUUID()
            });

            router.push(`/quiz/active-session?examId=${exam.examId}`);
        } catch (err: unknown) {
            clientLogger.error('Failed to start exam', { error: err instanceof Error ? err.message : 'unknown' });
            const message = err instanceof Error ? err.message : "Failed to start exam session.";
            setError(message);
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
        <div className="w-full space-y-24">
            {/* Step 1: Domain Selection */}
            <section className="space-y-12">
                <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-[#FF4B91]/10 text-[#FF4B91] flex items-center justify-center font-black text-2xl shadow-lg border border-[#FF4B91]/10">1</div>
                    <div>
                        <h2 className="text-4xl font-black tracking-tighter uppercase text-[#1A1A1A]">Select Domain_</h2>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1 opacity-60">Strategic Assessment Vector</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {domains.map((item) => {
                        const categoryKey = item.category ? item.category.toLowerCase() : '';
                        const Icon = ICON_MAP[categoryKey] || ICON_MAP[item.id] || Code;
                        const isSelected = selectedDomain === item.id;
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
                                    "group relative p-10 rounded-[3.5rem] border-2 transition-all duration-700 text-left overflow-hidden flex flex-col justify-between min-h-[320px]",
                                    isSelected
                                        ? "border-[#FF4B91] bg-white shadow-[0_40px_80px_-20px_rgba(255,75,145,0.15)] ring-8 ring-[#FF4B91]/5 scale-[1.02] z-10"
                                        : "border-muted-foreground/5 bg-white hover:border-[#FF4B91]/40 hover:shadow-2xl hover:scale-[1.01]"
                                )}
                            >
                                <div className="relative z-10">
                                    <div className={cn(
                                        "mb-8 p-6 rounded-[2rem] w-fit transition-all duration-700 group-hover:rotate-6",
                                        isSelected
                                            ? "bg-gradient-to-br from-[#FF4B91] to-[#FF8E9E] text-white shadow-xl shadow-[#FF4B91]/30"
                                            : "bg-muted text-muted-foreground group-hover:bg-[#FF4B91]/10 group-hover:text-[#FF4B91]"
                                    )}>
                                        <Icon size={36} />
                                    </div>
                                    <h3 className="text-3xl font-black mb-3 text-[#1A1A1A] tracking-tighter uppercase">{item.name}</h3>
                                    <p className="text-xs text-muted-foreground font-black uppercase tracking-wider leading-relaxed opacity-40">
                                        {item.description || `Master industry-standard practices and tools in ${item.name}.`}
                                    </p>
                                </div>

                                {isSelected && (
                                    <div className="absolute top-10 right-10 animate-in fade-in zoom-in duration-500">
                                        <div className="bg-[#FF4B91] text-white p-2 rounded-xl shadow-lg shadow-[#FF4B91]/30">
                                            <Sparkles size={18} className="animate-pulse" />
                                        </div>
                                    </div>
                                )}

                                {/* Decorative background element */}
                                <div className={cn(
                                    "absolute -bottom-20 -right-20 w-48 h-48 rounded-full blur-[80px] transition-all duration-1000",
                                    isSelected ? "bg-[#FF4B91]/10 opacity-100" : "bg-primary/5 opacity-0 group-hover:opacity-100"
                                )} />
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
                <section className="space-y-12 animate-in slide-in-from-bottom-[100px] duration-700">
                    <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-[#FF4B91]/10 text-[#FF4B91] flex items-center justify-center font-black text-2xl shadow-lg border border-[#FF4B91]/10">2</div>
                        <div>
                            <h2 className="text-4xl font-black tracking-tighter uppercase text-[#1A1A1A]">Refine Subjects_</h2>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1 opacity-60">Specialized Focus Areas</p>
                        </div>
                    </div>
                    {fetchingHierarchy ? (
                        <div className="flex items-center gap-4 py-8 px-10 rounded-[2.5rem] bg-white border border-muted-foreground/5 shadow-sm text-muted-foreground font-black text-sm uppercase tracking-widest">
                            <Loader2 className="h-5 w-5 animate-spin text-[#FF4B91]" /> Resolving Strategic Catalog...
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => toggleItem(selectedSubjects, setSelectedSubjects, 'all', () => {
                                    setSelectedTopics([]);
                                    setSelectedSubtopics([]);
                                })}
                                className={cn(
                                    "px-10 py-6 rounded-[2rem] border-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm",
                                    isItemSelected(selectedSubjects, 'all')
                                        ? "border-[#FF4B91] bg-[#FF4B91] text-white shadow-2xl shadow-[#FF4B91]/30"
                                        : "border-muted-foreground/5 bg-white hover:border-[#FF4B91]/30 text-muted-foreground hover:text-[#FF4B91]"
                                )}
                            >
                                [ GLOBAL_SCOPE ]
                            </button>
                            {subjects.map((subject) => (
                                <button
                                    key={subject.id}
                                    onClick={() => toggleItem(selectedSubjects, setSelectedSubjects, subject.id, () => {
                                        setSelectedTopics([]);
                                        setSelectedSubtopics([]);
                                    })}
                                    className={cn(
                                        "px-10 py-6 rounded-[2rem] border-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm",
                                        isItemSelected(selectedSubjects, subject.id)
                                            ? "border-[#FF4B91] bg-[#FF4B91] text-white shadow-2xl shadow-[#FF4B91]/30"
                                            : "border-muted-foreground/5 bg-white hover:border-[#FF4B91]/30 text-muted-foreground hover:text-[#FF4B91]"
                                    )}
                                >
                                    {subject.name}
                                </button>
                            ))}
                        </div>
                    )}
                    {availableCounts && (
                        <div className="mt-8 flex items-center gap-4 px-8 py-4 bg-white/40 backdrop-blur-md rounded-[2rem] w-fit border border-[#FF4B91]/10 animate-in fade-in zoom-in duration-300">
                            <Activity size={16} className="text-[#FF4B91] animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]">Sub-Vector Capacity: <span className="text-[#FF4B91] text-lg ml-2 font-black">{availableCounts.total}</span></span>
                        </div>
                    )}
                </section>
            )}

            {/* Step 3: Topic Selection */}
            {selectedDomain && topics.length > 0 && (
                <section className="space-y-12 animate-in slide-in-from-bottom-[100px] duration-800">
                    <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-[#FF4B91]/10 text-[#FF4B91] flex items-center justify-center font-black text-2xl shadow-lg border border-[#FF4B91]/10">3</div>
                        <div>
                            <h2 className="text-4xl font-black tracking-tighter uppercase text-[#1A1A1A]">Select Topics_</h2>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1 opacity-60">Detailed Knowledge Units</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => toggleItem(selectedTopics, setSelectedTopics, 'all', () => setSelectedSubtopics([]))}
                            className={cn(
                                "px-8 py-5 rounded-[1.5rem] border-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95",
                                isItemSelected(selectedTopics, 'all')
                                    ? "border-[#FF4B91] bg-[#FF4B91]/10 text-[#FF4B91] shadow-xl shadow-[#FF4B91]/5"
                                    : "border-muted-foreground/10 bg-white hover:border-[#FF4B91]/20 text-muted-foreground"
                            )}
                        >
                            [ TOTAL_CLUSTER ]
                        </button>
                        {topics.map((topic) => (
                            <button
                                key={topic.id}
                                onClick={() => toggleItem(selectedTopics, setSelectedTopics, topic.id, () => setSelectedSubtopics([]))}
                                className={cn(
                                    "px-8 py-5 rounded-[1.5rem] border-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95",
                                    isItemSelected(selectedTopics, topic.id)
                                        ? "border-[#FF4B91] bg-[#FF4B91]/5 text-[#FF4B91] shadow-xl shadow-[#FF4B91]/5"
                                        : "border-muted-foreground/10 bg-white hover:border-[#FF4B91]/20 text-muted-foreground"
                                )}
                            >
                                {topic.name}
                            </button>
                        ))}
                    </div>
                    {availableCounts && (
                        <div className="mt-8 flex items-center gap-4 px-8 py-4 bg-white/40 backdrop-blur-md rounded-[2rem] w-fit border border-[#FF4B91]/10 animate-in fade-in zoom-in duration-300">
                            <Activity size={16} className="text-[#FF4B91] animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]">Unit Specificity: <span className="text-[#FF4B91] text-lg ml-2 font-black">{availableCounts.total}</span></span>
                        </div>
                    )}
                </section>
            )}

            {/* Step 4: Subtopic Selection */}
            {selectedDomain && subtopics.length > 0 && (
                <section className="space-y-12 animate-in slide-in-from-bottom-[100px] duration-1000">
                    <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-[#FF4B91]/10 text-[#FF4B91] flex items-center justify-center font-black text-2xl shadow-lg border border-[#FF4B91]/10">4</div>
                        <div>
                            <h2 className="text-4xl font-black tracking-tighter uppercase text-[#1A1A1A]">Subtopic (Component)_</h2>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1 opacity-60">Targeted Skill Verification</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => toggleItem(selectedSubtopics, setSelectedSubtopics, 'all')}
                            className={cn(
                                "px-6 py-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95",
                                isItemSelected(selectedSubtopics, 'all')
                                    ? "border-[#FF4B91] bg-[#FF4B91]/10 text-[#FF4B91]"
                                    : "border-muted-foreground/5 bg-muted/30 hover:border-[#FF4B91]/20 text-muted-foreground"
                            )}
                        >
                            [ ATOMIC_SUM ]
                        </button>
                        {subtopics.map((subtopic) => (
                            <button
                                key={subtopic.id}
                                onClick={() => toggleItem(selectedSubtopics, setSelectedSubtopics, subtopic.id)}
                                className={cn(
                                    "px-6 py-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95",
                                    isItemSelected(selectedSubtopics, subtopic.id)
                                        ? "border-[#FF4B91] bg-[#FF4B91]/10 text-[#FF4B91]"
                                        : "border-muted-foreground/5 bg-muted/30 hover:border-[#FF4B91]/20 text-muted-foreground"
                                )}
                            >
                                {subtopic.name}
                            </button>
                        ))}
                    </div>
                    {availableCounts && (
                        <div className="mt-8 flex items-center gap-4 px-8 py-4 bg-white/40 backdrop-blur-md rounded-[2rem] w-fit border border-[#FF4B91]/10 animate-in fade-in zoom-in duration-300">
                            <Activity size={16} className="text-[#FF4B91] animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]">Precision Targeting: <span className="text-[#FF4B91] text-lg ml-2 font-black">{availableCounts.total}</span></span>
                        </div>
                    )}
                </section>
            )}

            {/* Step 5: Configuration */}
            {selectedDomain && (
                <section className="space-y-16 animate-in slide-in-from-bottom-[100px] duration-1000 pb-32">
                    <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-[#FF4B91]/10 text-[#FF4B91] flex items-center justify-center font-black text-2xl shadow-lg border border-[#FF4B91]/10">5</div>
                        <div>
                            <h2 className="text-4xl font-black tracking-tighter uppercase text-[#1A1A1A]">Exam Configuration_</h2>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1 opacity-60">Runtime Parameters</p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-8 rounded-[2.5rem] bg-red-500/5 border border-red-500/20 text-red-600 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-4 animate-in fade-in duration-300">
                            <ShieldCheck size={24} />
                            {error}
                        </div>
                    )}

                    <div className="grid xl:grid-cols-3 gap-12 bg-white/60 backdrop-blur-3xl p-16 rounded-[5rem] border border-white shadow-[0_50px_100px_-30px_rgba(0,0,0,0.05)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF4B91]/5 rounded-full blur-[150px] -z-10" />

                        <div className="xl:col-span-2 space-y-16">
                            <div className="space-y-8">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-4 block opacity-60" aria-label="Question Count (Max Capability)">Question Count (Max Capability)</p>
                                <div className="flex flex-wrap items-center gap-6">
                                    {[5, 10, 15, 20, 25, 30].map(count => {
                                        const totalAvail = availableCounts?.total || 0;
                                        const isReady = availableCounts?.isReady;
                                        const isDisabled = !isReady || (count - totalAvail) > 5;
                                        return (
                                            <button
                                                key={count}
                                                disabled={isDisabled}
                                                onClick={() => setQuestionCount(count)}
                                                className={cn(
                                                    "px-10 py-6 rounded-[2.5rem] border-2 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300",
                                                    questionCount === count
                                                        ? "border-[#FF4B91] bg-[#FF4B91] text-white shadow-2xl shadow-[#FF4B91]/30"
                                                        : "border-muted-foreground/5 bg-transparent text-muted-foreground hover:bg-[#FF4B91]/5 hover:text-[#FF4B91]",
                                                    isDisabled && "opacity-10 grayscale cursor-not-allowed"
                                                )}
                                            >
                                                {count} QUESTIONS
                                            </button>
                                        );
                                    })}
                                </div>
                                {!availableCounts?.isReady && availableCounts?.total !== undefined && (
                                    <div className="mt-8 flex items-start gap-4 p-6 rounded-[2.5rem] bg-red-500/5 border border-red-500/10 max-w-2xl">
                                        <FileWarning className="text-red-500 shrink-0 mt-1" size={20} />
                                        <div>
                                            <p className="text-[11px] font-black uppercase text-red-600 tracking-[0.2em] leading-none mb-2">Governance Alert: 🔴 Poor Content Pool</p>
                                            <p className="text-[10px] font-bold text-red-500/70 leading-relaxed uppercase tracking-wide">
                                                Available Pool: {availableCounts.simple} Simple / {availableCounts.intermediate} Int / {availableCounts.expert} Expert. Required Minimum: 4s/4i/5e. Deployment Blocked.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-8">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-4 block opacity-60" aria-label="Difficulty Calibration">Difficulty Calibration</p>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    {['mixed', 'simple', 'intermediate', 'expert'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setDifficulty(opt)}
                                            className={cn(
                                                "py-6 rounded-[2.5rem] border-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300",
                                                difficulty === opt
                                                    ? "border-[#FF4B91] bg-[#FF4B91] text-white shadow-2xl shadow-[#FF4B91]/30"
                                                    : "border-muted-foreground/5 bg-transparent text-muted-foreground hover:bg-[#FF4B91]/5 hover:text-[#FF4B91]"
                                            )}
                                        >
                                            {opt} SCALE
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-8 text-[11px] text-muted-foreground font-black tracking-widest opacity-40 uppercase">
                                    * Mixed uses 30/30/40 engine rule. Expert is limited to expert-tier pooled questions.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between gap-12 bg-white/40 backdrop-blur-3xl p-12 rounded-[4rem] border border-white shadow-inner">
                            <div className="space-y-8">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-60 text-center">Session Forecast</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-8 py-5 bg-white rounded-[2rem] shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <Clock size={16} className="text-[#FF4B91]" />
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-[#1A1A1A]">Duration</span>
                                        </div>
                                        <span className="text-sm font-black">{Math.ceil(questionCount * 1.5)} MINS</span>
                                    </div>
                                    <div className="flex items-center justify-between px-8 py-5 bg-white rounded-[2rem] shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <Layers size={16} className="text-[#FF4B91]" />
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-[#1A1A1A]">Payload</span>
                                        </div>
                                        <span className="text-sm font-black">{questionCount} Qs</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="w-full py-10 rounded-[3rem] bg-gradient-to-r from-[#FF4B91] to-[#FF8E9E] text-white text-2xl font-black uppercase tracking-[0.2em] shadow-[0_25px_50px_-12px_rgba(255,75,145,0.5)] flex items-center justify-center gap-6 hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none group"
                                onClick={handleStartExam}
                                disabled={starting || !availableCounts?.isReady}
                            >
                                {starting ? <Loader2 className="h-10 w-10 animate-spin" /> : (
                                    <>
                                        Start Enterprise Exam
                                        <ArrowRight size={32} className="group-hover:translate-x-2 transition-transform duration-300" />
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
