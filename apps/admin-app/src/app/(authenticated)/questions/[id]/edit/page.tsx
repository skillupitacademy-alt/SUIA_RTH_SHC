'use client';

import { apiClient } from '@quiz/api-client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CascadingSelect, Selection } from '@/components/entry/CascadingSelect';
import { QuestionEditor, QuestionFormData } from '@/components/entry/QuestionEditor';

interface Question {
    id: string;
    questionText?: string;
    question_text?: string;
    type?: string;
    topicId?: string;
    topic_id?: string;
    subtopicId?: string;
    subtopic_id?: string;
    topic?: {
        id: string;
        subjectId?: string;
        subject_id?: string;
        subject?: {
            id: string;
            domainId?: string;
            domain_id?: string;
        }
    };
    options?: Array<{
        id: string;
        text?: string;
        optionText?: string;
        option_text?: string;
        isCorrect?: boolean;
        is_correct?: boolean;
    }>;
    explanation?: string;
    difficulty?: string;
    metadata?: {
        estimatedTime?: number;
        estimated_time?: number;
    };
    questionSkills?: Array<{
        skillId?: string;
        skill_id?: string;
        skill: {
            id: string;
            name: string;
        }
    }>;
}
import { ZLoader } from '@quiz/ui';
import { AlertCircle, ArrowLeft, CheckCircle2, Edit3, X } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

export default function EditQuestionPage() {
    const params = useParams();
    const router = useRouter();

    const [question, setQuestion] = useState<Question | null>(null);
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
                const data = (await apiClient.admin.getQuestionById(String(params.id))) as unknown as Question;

                if (data != null) {

                    setQuestion(data);

                    // Explicitly map hierarchy with Fallbacks for potential naming variations
                    const domainId = (data.topic?.subject?.domainId != null && data.topic.subject.domainId !== '') ? data.topic.subject.domainId : (data.topic?.subject?.domain_id ?? null);
                    const subjectId = (data.topic?.subjectId != null && data.topic.subjectId !== '') ? data.topic.subjectId : (data.topic?.subject_id ?? null);
                    const topicId = (data.topicId != null && data.topicId !== '') ? data.topicId : (data.topic_id ?? null);
                    const subtopicId = (data.subtopicId != null && data.subtopicId !== '') ? data.subtopicId : (data.subtopic_id ?? null);

                    // Extract Skill IDs from the junction table relation
                    const questionSkills = data.questionSkills as Array<{ skillId?: string; skill_id?: string; skill: { id: string; name: string } }> | null | undefined;
                    const skillIds = (questionSkills != null && Array.isArray(questionSkills))
                        ? questionSkills.map((qs) => (qs.skillId != null && qs.skillId !== '') ? qs.skillId : (qs.skill_id ?? ''))
                        : [];

                    setSelection({
                        domainId,
                        subjectId,
                        topicId,
                        subtopicId,
                        skillIds: Array.isArray(skillIds) ? skillIds : []
                    });
                }
            } catch {
                setStatus({ type: 'error', message: 'Failed to load assessment data.' });
            } finally {
                setIsLoading(false);
            }
        };
        void fetchQuestion();
    }, [params.id]);

    const handleSubmit = async (formData: QuestionFormData) => {
        if (selection.topicId == null || selection.topicId === '') {
            setStatus({ type: 'error', message: 'Please select at least a Topic in the hierarchy.' });
            return;
        }

        setIsSaving(true);
        setStatus(null);
        try {
            const payload = {
                ...formData,
                topicId: selection.topicId,
                subtopicId: (selection.subtopicId != null && selection.subtopicId !== '') ? selection.subtopicId : null,
                skillIds: (selection.skillIds != null && selection.skillIds.length > 0) ? selection.skillIds : [],
            };
            await apiClient.admin.updateQuestion(String(params.id), payload);
            setStatus({ type: 'success', message: 'Assessment updated successfully! Redirecting...' });

            window.scrollTo({ top: 0, behavior: 'smooth' });

            setTimeout(() => {
                router.push('/questions');
            }, 2000);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to update assessment.';
            setStatus({ type: 'error', message });
            setIsSaving(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const isUnlocked = (selection.topicId != null && selection.topicId !== ''); // Unlocked at Topic level for edit flexibility, but guided

    if (isLoading === true) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <ZLoader size="lg" text="Initializing Editor..." />
            </div>
        );
    }

    if (question === null && isLoading === false) {
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
            {status !== null ? <div className={cn(
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
            </div> : null}

            <div className="w-full max-w-[1400px] mx-auto space-y-12 pb-24">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <Link href="/questions" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#FF4B91] transition-colors text-xs font-bold uppercase tracking-wider w-fit">
                        <ArrowLeft className="w-4 h-4" /> Back to Question Bank
                    </Link>
                    <div className="flex items-end justify-between gap-8 pb-8 border-b border-gray-100">
                        <div className="relative">
                            <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tighter uppercase">Edit Assessment_</h1>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                System-Alpha • Manual Orchestration Active • ID: {String(params.id)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Target Hierarchy Section */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CascadingSelect
                        value={selection}
                        onChange={setSelection}
                    />
                </div>

                {/* Editor Section with Lock Logic */}
                <div className="relative pt-8">
                    {/* Visual Connector */}
                    <div className={`absolute left-1/2 -top-4 w-0.5 h-12 bg-gradient-to-b from-slate-200 to-slate-50 -translate-x-1/2 transition-opacity duration-500 ${isUnlocked === true ? 'opacity-100' : 'opacity-0'}`} />

                    {isUnlocked === true ? (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            <QuestionEditor
                                loading={isSaving}
                                onSubmit={handleSubmit}
                                initialData={{
                                    text: (question?.questionText != null && question.questionText !== '') ? question.questionText : (question?.question_text ?? ''),
                                    type: (question?.type === 'mcq' || question?.type === 'single') ? 'single' : 'multiple',
                                    options: question?.options?.map((o) => ({
                                        id: o.id,
                                        text: (o.text != null && o.text !== '') ? o.text : ((o.optionText != null && o.optionText !== '') ? o.optionText : (o.option_text ?? '')),
                                        isCorrect: (o.isCorrect === true || o.is_correct === true)
                                    })) || [],
                                    explanation: question?.explanation ?? '',
                                    difficulty: (question?.difficulty as 'simple' | 'intermediate' | 'expert' | undefined) ?? 'simple',
                                    estimatedTime: (question?.metadata?.estimatedTime != null) ? question.metadata.estimatedTime : (question?.metadata?.estimated_time ?? 60),
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
