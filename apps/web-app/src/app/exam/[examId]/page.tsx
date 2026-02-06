'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, QuizState } from '@quiz/api-client';
import { Loader2, AlertCircle } from 'lucide-react';

interface ExtendedExamState extends QuizState {
    currentQuestionIndex: number;
}

export default function ActiveExamPage({ params }: { params: { examId: string } }) {
    const router = useRouter();
    const [state, setState] = useState<ExtendedExamState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Initial Fetch
    useEffect(() => {
        const fetchState = async () => {
            try {
                const data = await apiClient.quiz.getQuizState(params.examId);

                // Status Handling (Phase 3 Hardening)
                if (data.status === 'completed' || data.status === 'processing' || data.status === 'failed') {
                    router.replace(`/reports/active-report?examId=${params.examId}`);
                    return;
                }

                // Calculate local current index
                const firstUnanswered = data.questions.findIndex(q => q.userAnswer === null);
                const currentIndex = firstUnanswered !== -1 ? firstUnanswered : 0;

                setState({
                    ...data,
                    currentQuestionIndex: currentIndex
                });
            } catch (err: any) {
                console.error('Failed to load exam:', err);
                if (err.message.includes('403') || err.message.includes('Unauthorized')) {
                    setError('Unauthorized: You do not own this exam.');
                } else if (err.message.includes('404')) {
                    setError('Exam not found.');
                } else {
                    setError('Failed to load assessment. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchState();
    }, [params.examId, router]);

    // Simple Render
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-[#FF2D55]" size={48} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
                <AlertCircle className="text-[#FF2D55]" size={48} />
                <h1 className="text-2xl font-bold text-[#1A1A1A]">Access Error</h1>
                <p className="text-gray-600">{error}</p>
                <button
                    onClick={() => router.push('/console')}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                >
                    Return to Console
                </button>
            </div>
        );
    }

    if (!state) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
            <h1 className="text-3xl font-black font-outfit text-[#1A1A1A] mb-4">ACTIVE EXAM HUD</h1>
            <p className="text-sm font-mono text-gray-500 mb-8">Exam ID: {state.examId}</p>

            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl">
                <p className="text-xl font-bold mb-4">Question {state.currentQuestionIndex + 1} of {state.questions.length}</p>
                <div className="p-4 bg-gray-100 rounded-lg mb-6">
                    <p className="text-gray-700 italic">Question content would render here...</p>
                </div>

                <div className="flex justify-end">
                    <button className="px-8 py-3 bg-[#FF2D55] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95">
                        SAVE & NEXT
                    </button>
                </div>
            </div>
        </div>
    );
}
