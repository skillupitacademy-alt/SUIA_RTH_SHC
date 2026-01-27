'use default';
'use client';

import { useState, useEffect } from 'react';
import { CascadingSelect } from '@/components/entry/CascadingSelect';
import { QuestionEditor } from '@/components/entry/QuestionEditor';
import { apiClient } from '@quiz/api-client';
import { CheckCircle2, AlertTriangle, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';

export default function QuestionEntryPage() {
    const [subtopicId, setSubtopicId] = useState<string | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formKey, setFormKey] = useState(0); // Key to force re-render/reset of form

    const handleSelectionChange = (sel: { subtopicId: string | null }) => {
        setSubtopicId(sel.subtopicId);
        if (status?.type === 'error') setStatus(null);
    };

    const handleCreateQuestion = async (data: any) => {
        if (!subtopicId) return;

        setSubmitting(true);
        setStatus(null);

        try {
            await apiClient.admin.createQuestion({
                ...data,
                subtopicId
            });

            setStatus({ type: 'success', message: 'Question created successfully!' });

            // FULL RESET: Reset subtopicId and increment key for all components
            setSubtopicId(null);
            setFormKey(prev => prev + 1);

            // Try to scroll the main scrollable area (AdminLayout main)
            const mainContent = document.querySelector('main');
            if (mainContent) {
                mainContent.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            setTimeout(() => {
                setStatus(prev => prev?.type === 'success' ? null : prev);
            }, 6000);

        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Failed to create question.' });
            const mainContent = document.querySelector('main');
            if (mainContent) {
                mainContent.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full relative">

            {/* Status Banner - Fixed to viewport for absolute visibility */}
            {status && (
                <div className={`
                    fixed top-8 right-8 z-[9999] max-w-md w-full p-6 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-10 fade-in duration-300
                    ${status.type === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-900 shadow-[0_20px_50px_rgba(34,197,94,0.2)]'
                        : 'bg-red-500/10 border-red-500/20 text-red-900 shadow-[0_20px_50px_rgba(239,68,68,0.2)]'}
                `}>
                    <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${status.type === 'success' ? 'bg-green-500 text-white shadow-lg shadow-green-500/40' : 'bg-red-500 text-white shadow-lg shadow-red-500/40'}`}>
                            {status.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-lg">{status.type === 'success' ? 'Success!' : 'Error Occurred'}</h4>
                            <p className="text-sm opacity-90 mt-1 font-semibold">{status.message}</p>
                        </div>
                        <button onClick={() => setStatus(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    {status.type === 'success' && (
                        <div className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-[6000ms] ease-linear w-full animate-[shrink_6s_linear_forwards]" />
                    )}
                </div>
            )}

            {/* Main Content Container - Expanded Width */}
            <div className="w-full max-w-[1800px] mx-auto space-y-12">

                {/* Header */}
                <div className="flex flex-col gap-4">
                    <Link href="/questions" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#FF4B91] transition-colors text-xs font-bold uppercase tracking-wider w-fit">
                        <ArrowLeft className="w-4 h-4" /> Back to Question Bank
                    </Link>
                    <div className="flex items-end justify-between gap-8 pb-8 border-b border-gray-200">
                        <div className="relative">
                            <h1 className="text-5xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">Add New Question</h1>
                            <div className="h-1.5 w-32 bg-[#FF4B91] mt-3 rounded-full shadow-[0_0_20px_rgba(255,75,145,0.4)]" />
                        </div>
                        <p className="text-slate-500 max-w-xl text-right font-medium hidden md:block">
                            Select the target skill hierarchy and create a new assessment item using the rich editor.
                        </p>
                    </div>
                </div>

                <CascadingSelect key={`hierarchy-${formKey}`} onChange={handleSelectionChange} />

                {/* Editor Section */}
                <div className="relative pt-8">
                    {/* Visual Connector */}
                    <div className={`absolute left-1/2 -top-4 w-0.5 h-12 bg-gradient-to-b from-slate-200 to-slate-50 -translate-x-1/2 transition-opacity duration-500 ${subtopicId ? 'opacity-100' : 'opacity-0'}`} />

                    {subtopicId ? (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            <QuestionEditor
                                key={`editor-${formKey}`}
                                onSubmit={handleCreateQuestion}
                                loading={submitting}
                            />
                        </div>
                    ) : (
                        <div className="py-24 text-center border-2 border-dashed border-gray-200 rounded-[2rem] bg-white/50 text-slate-400 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-slate-100">
                                <ArrowLeft className="w-8 h-8 rotate-90 opacity-40 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold uppercase tracking-widest mb-2 text-slate-600">Awaiting Selection</h3>
                            <p className="font-medium">Select a Subtopic above to unlock the question editor.</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
}
