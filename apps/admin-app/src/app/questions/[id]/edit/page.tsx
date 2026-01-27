'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@quiz/api-client';
import { QuestionEditor } from '@/components/entry/QuestionEditor';
import { CascadingSelect, Selection } from '@/components/entry/CascadingSelect';
import { Database, ArrowLeft, CheckCircle2, AlertCircle, X, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function EditQuestionPage() {
    const params = useParams();
    const router = useRouter();

    const [question, setQuestion] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [selection, setSelection] = useState<Selection>({
        domainId: null,
        subjectId: null,
        topicId: null,
        subtopicId: null,
        skillIds: [],
    });

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                const data = await apiClient.admin.getQuestionById(params.id as string);

                if (data) {
                    console.log('[DEBUG] Fetched Question Data:', data);

                    setQuestion(data);

                    // Explicitly map hierarchy with Fallbacks for potential naming variations
                    const domainId = data.topic?.subject?.domainId || data.topic?.subject?.domain_id || null;
                    const subjectId = data.topic?.subjectId || data.topic?.subject_id || null;
                    const topicId = data.topicId || data.topic_id || null;
                    const subtopicId = data.subtopicId || data.subtopic_id || null;

                    // Extract Skill IDs from the junction table relation
                    const skillIds = data.questionSkills?.map((qs: any) => qs.skillId || qs.skill_id) || [];

                    setSelection({
                        domainId,
                        subjectId,
                        topicId,
                        subtopicId,
                        skillIds: Array.isArray(skillIds) ? skillIds : []
                    });
                }
            } catch (error: any) {
                console.error('[CRITICAL] Failed to fetch question:', error);
                setStatus({ type: 'error', message: 'Failed to load assessment data.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestion();
    }, [params.id]);

    const handleSelectionChange = useCallback((newSelection: Selection) => {
        setSelection(newSelection);
    }, []);

    const handleSubmit = async (formData: any) => {
        if (!selection.topicId) {
            setStatus({ type: 'error', message: 'Please select at least a Topic in the hierarchy.' });
            return;
        }

        setIsSaving(true);
        setStatus(null);
        try {
            const payload = {
                ...formData,
                topicId: selection.topicId,
                subtopicId: selection.subtopicId,
                skillIds: selection.skillIds,
            };
            await apiClient.admin.updateQuestion(params.id as string, payload);
            setStatus({ type: 'success', message: 'Assessment updated successfully! Redirecting...' });

            window.scrollTo({ top: 0, behavior: 'smooth' });

            setTimeout(() => {
                router.push('/questions');
            }, 2000);
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Failed to update assessment.' });
            setIsSaving(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const isUnlocked = !!selection.topicId; // Unlocked at Topic level for edit flexibility, but guided

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-[#FF4B91]/20 border-t-[#FF4B91] rounded-full animate-spin" />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Initializing_Editor...</p>
            </div>
        );
    }

    if (!question && !isLoading) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-black text-[#1A1A1A]">Assessment Not Found</h1>
                <Link href="/questions" className="text-[#FF4B91] font-bold mt-4 inline-block hover:underline">Return to Question Bank</Link>
            </div>
        );
    }

    return (
        <div className="w-full relative">
            {/* Status Banner */}
            {status && (
                <div className={cn(
                    "fixed top-8 right-8 z-[9999] max-w-md w-full p-6 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-10 fade-in duration-300",
                    status.type === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-900 shadow-[0_20px_50px_rgba(34,197,94,0.2)]'
                        : 'bg-red-500/10 border-red-500/20 text-red-900 shadow-[0_20px_50px_rgba(239,68,68,0.2)]'
                )}>
                    <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${status.type === 'success' ? 'bg-green-500 text-white shadow-lg shadow-green-500/40' : 'bg-red-500 text-white shadow-lg shadow-red-500/40'}`}>
                            {status.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-lg">{status.type === 'success' ? 'Success!' : 'Error Occurred'}</h4>
                            <p className="text-sm opacity-90 mt-1 font-semibold">{status.message}</p>
                        </div>
                        <button onClick={() => setStatus(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full max-w-[1800px] mx-auto space-y-12 pb-24">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <Link href="/questions" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#FF4B91] transition-colors text-xs font-bold uppercase tracking-wider w-fit">
                        <ArrowLeft className="w-4 h-4" /> Back to Question Bank
                    </Link>
                    <div className="flex items-end justify-between gap-8 pb-8 border-b border-gray-200">
                        <div className="relative">
                            <h1 className="text-5xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">Edit Question</h1>
                            <div className="h-1.5 w-32 bg-[#FF4B91] mt-3 rounded-full shadow-[0_0_20px_rgba(255,75,145,0.4)]" />
                        </div>
                        <div className="flex items-center gap-3">
                            <Database size={20} className="text-[#FF4B91]" />
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF4B91]">Revision_Control</span>
                        </div>
                    </div>
                </div>

                {/* Target Hierarchy Section */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CascadingSelect
                        value={selection}
                        onChange={handleSelectionChange}
                    />
                </div>

                {/* Editor Section with Lock Logic */}
                <div className="relative pt-8">
                    {/* Visual Connector */}
                    <div className={`absolute left-1/2 -top-4 w-0.5 h-12 bg-gradient-to-b from-slate-200 to-slate-50 -translate-x-1/2 transition-opacity duration-500 ${isUnlocked ? 'opacity-100' : 'opacity-0'}`} />

                    {isUnlocked ? (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            <QuestionEditor
                                loading={isSaving}
                                onSubmit={handleSubmit}
                                initialData={{
                                    text: question.questionText || question.question_text,
                                    type: question.type === 'mcq' || question.type === 'single' ? 'single' : 'multiple',
                                    options: question.options,
                                    explanation: question.explanation,
                                    difficulty: question.difficulty,
                                    estimatedTime: question.metadata?.estimatedTime || question.metadata?.estimated_time || 60,
                                }}
                            />
                        </div>
                    ) : (
                        <div className="py-24 text-center border-2 border-dashed border-gray-200 rounded-[2rem] bg-white/50 text-slate-400 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-slate-100">
                                <Edit3 className="w-8 h-8 opacity-40 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold uppercase tracking-widest mb-2 text-slate-600">Awaiting Selection</h3>
                            <p className="font-medium">Selection required to unlock the editor.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
