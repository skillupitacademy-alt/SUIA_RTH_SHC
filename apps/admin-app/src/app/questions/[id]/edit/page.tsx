'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@quiz/api-client';
import { QuestionEditor } from '@/components/entry/QuestionEditor';
import { Database, ArrowLeft, CheckCircle2, AlertCircle, X } from 'lucide-react';
import Link from 'next/link';

export default function EditQuestionPage() {
    const params = useParams();
    const router = useRouter();
    const [question, setQuestion] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                const data = await apiClient.admin.getQuestionById(params.id as string);
                setQuestion(data);
            } catch (error) {
                console.error('Failed to fetch question:', error);
                setStatus({ type: 'error', message: 'Failed to load assessment data.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestion();
    }, [params.id]);

    const handleSubmit = async (formData: any) => {
        setIsSaving(true);
        setStatus(null);
        try {
            await apiClient.admin.updateQuestion(params.id as string, formData);
            setStatus({ type: 'success', message: 'Assessment updated successfully! Redirecting...' });
            setTimeout(() => {
                router.push('/questions');
            }, 2000);
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Failed to update assessment.' });
            setIsSaving(false);
        }
    };

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
        <div className="max-w-5xl mx-auto pb-24 space-y-8">
            {/* Status Banner */}
            {status && (
                <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[9999] p-4 rounded-2xl backdrop-blur-xl border shadow-2xl animate-in slide-in-from-top-8 duration-500 flex items-center gap-4 min-w-[400px] ${status.type === 'success'
                        ? 'bg-green-50/90 border-green-200 text-green-800'
                        : 'bg-red-50/90 border-red-200 text-red-800'
                    }`}>
                    {status.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">System_Notification</p>
                        <p className="text-sm font-bold">{status.message}</p>
                    </div>
                    <button onClick={() => setStatus(null)} className="p-1 hover:bg-black/5 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col gap-6">
                <Link
                    href="/questions"
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-[#FF4B91] transition-colors group w-fit"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to questions
                </Link>
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Database size={20} className="text-[#FF4B91]" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF4B91]">Revision_Control</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter italic uppercase text-[#1A1A1A]">Edit Assessment</h1>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Modify existing content with precision</p>
                </div>
            </div>

            {/* Main Editor */}
            <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                <QuestionEditor
                    loading={isSaving}
                    onSubmit={handleSubmit}
                    initialData={{
                        text: question.questionText,
                        type: question.type === 'mcq' ? 'single' : 'single', // Need better mapping if multiple
                        options: question.options,
                        explanation: question.explanation,
                        difficulty: question.difficulty,
                        estimatedTime: question.metadata?.estimatedTime || 60,
                        tags: question.metadata?.tags || []
                    }}
                />
            </div>
        </div>
    );
}
