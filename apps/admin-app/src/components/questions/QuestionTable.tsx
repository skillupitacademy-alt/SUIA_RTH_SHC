'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@quiz/api-client';
import { FileText, Layers, Hash, Activity, Edit3, Trash2, Filter, X, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CascadingSelect, Selection } from '@/components/entry/CascadingSelect';
import { MultiSelectField } from '../entry/SelectionFields';
import { useAllSkills } from '@/hooks/useAdminHierarchy';
import Link from 'next/link';

interface QuestionData {
    id: string;
    questionText: string;
    type: string;
    difficulty: string;
    status: string;
    createdAt: string;
    topic?: {
        name: string;
        subject?: {
            name: string;
            domain?: {
                name: string;
            }
        }
    };
}

export function QuestionTable() {
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const skills = useAllSkills();

    // Phase 8: Filters
    const [filters, setFilters] = useState({
        domainId: '',
        subjectId: '',
        topicId: '',
        subtopicId: '',
        skillIds: [] as string[]
    });
    const [isFiltering, setIsFiltering] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; questionId: string | null; isDeleting: boolean; error: string | null }>({
        isOpen: false,
        questionId: null,
        isDeleting: false,
        error: null
    });

    const handleFilterChange = useCallback((selection: Selection) => {
        setFilters(prev => {
            if (
                prev.domainId === (selection.domainId || '') &&
                prev.subjectId === (selection.subjectId || '') &&
                prev.topicId === (selection.topicId || '') &&
                prev.subtopicId === (selection.subtopicId || '') &&
                JSON.stringify(prev.skillIds) === JSON.stringify(selection.skillIds)
            ) {
                return prev;
            }
            return {
                ...prev,
                domainId: selection.domainId || '',
                subjectId: selection.subjectId || '',
                topicId: selection.topicId || '',
                subtopicId: selection.subtopicId || '',
                skillIds: selection.skillIds || []
            };
        });
        setPage(1);
    }, []);


    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoading(true);
            try {
                const data = await apiClient.admin.getQuestions(page, 20, {
                    domainId: filters.domainId || undefined,
                    subjectId: filters.subjectId || undefined,
                    topicId: filters.topicId || undefined,
                    subtopicId: filters.subtopicId || undefined,
                    skillIds: filters.skillIds.length > 0 ? filters.skillIds : undefined,
                });
                setQuestions(data.questions);
                setTotalPages(data.totalPages);
            } catch (error) {
                console.error('Failed to fetch questions:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestions();
    }, [page, filters]);

    const handleDelete = async () => {
        if (!deleteModal.questionId) return;

        setDeleteModal(prev => ({ ...prev, isDeleting: true }));
        try {
            await apiClient.admin.deleteQuestion(deleteModal.questionId);
            setQuestions(prev => prev.filter(q => q.id !== deleteModal.questionId));
            setDeleteModal({ isOpen: false, questionId: null, isDeleting: false, error: null });
        } catch (error) {
            console.error('Delete failed:', error);
            setDeleteModal(prev => ({ ...prev, isDeleting: false, error: 'Authorization failure or system error.' }));
        }
    };

    const openDeleteModal = (id: string) => {
        setDeleteModal({ isOpen: true, questionId: id, isDeleting: false, error: null });
    };

    return (
        <div className="space-y-4">
            {/* Filter Console - Always Mounted */}
            <div className="rounded-[1.75rem] border border-primary/10 bg-white/50 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden">
                {/* Subtle Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Filter className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg text-[#1A1A1A]">Advanced Content Filter</h3>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Hierarchy Targeting System</p>
                        </div>
                    </div>
                    {(filters.domainId || filters.subjectId || filters.topicId || filters.subtopicId || filters.skillIds.length > 0) && (
                        <button
                            onClick={() => setFilters({ domainId: '', subjectId: '', topicId: '', subtopicId: '', skillIds: [] })}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                        >
                            <X className="w-3 h-3" /> Clear Filters
                        </button>
                    )}
                </div>

                <div className="space-y-6">
                    <CascadingSelect
                        value={filters as any}
                        onChange={handleFilterChange}
                    />
                </div>
            </div>

            {/* Table Area */}
            <div className="rounded-[1.75rem] border border-primary/10 bg-white/50 backdrop-blur-xl overflow-hidden shadow-xl min-h-[400px] relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Synchronizing_Matrix...</p>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans">
                        <thead>
                            <tr className="border-b border-primary/5 bg-primary/5">
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-[45%]">Assessment Content & Hierarchy</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Complexity</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Governance</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                            {questions.length === 0 && !isLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center">
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No matching assessments found.</p>
                                    </td>
                                </tr>
                            ) : (
                                questions.map((q) => (
                                    <tr key={q.id} className="group hover:bg-primary/5 transition-colors">
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <p className="font-bold text-[#1A1A1A] line-clamp-2 text-[13px] leading-snug">{q.questionText}</p>
                                                <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-widest text-muted-foreground/60">
                                                    <span>{q.topic?.subject?.domain?.name || 'N/A'}</span>
                                                    <span>/</span>
                                                    <span>{q.topic?.subject?.name || 'N/A'}</span>
                                                    <span>/</span>
                                                    <span className="text-[#FF4B91]">{q.topic?.name || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[9px] font-black uppercase tracking-wider border border-gray-200">
                                                {q.type}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${q.difficulty === 'simple' ? 'bg-green-100 text-green-700 border-green-200' :
                                                q.difficulty === 'mean' || q.difficulty === 'intermediate' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                    'bg-red-100 text-red-700 border-red-200'
                                                }`}>
                                                {q.difficulty}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${q.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                                <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{q.status}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/questions/${q.id}/edit`}
                                                    className="p-1.5 rounded-lg bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all border border-primary/10"
                                                    title="Edit Assessment"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </Link>
                                                <button
                                                    onClick={() => openDeleteModal(q.id)}
                                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100"
                                                    title="Delete Assessment"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="text-right mt-1">
                                                <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                                                    Added {formatDistanceToNow(new Date(q.createdAt))} ago
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-6 border-t border-primary/5 flex items-center justify-between">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:text-[#FF4B91] transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-xs font-bold text-muted-foreground">Page {page} of {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:text-[#FF4B91] transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white border border-white/20 rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden">
                        {/* Glows */}
                        <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-red-500/5 rounded-full blur-[60px] -z-10" />

                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 shadow-lg shadow-red-200">
                                <AlertTriangle size={32} />
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-[#1A1A1A] mb-2 text-center uppercase tracking-tight">Security Protocol</h2>
                                <p className="text-sm font-bold text-muted-foreground">
                                    Are you sure you want to decommission this assessment record? It will be marked as <span className="text-red-500 underline">inactive</span> and removed from active rotations.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 w-full pt-4">
                                {deleteModal.error && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold animate-in slide-in-from-top-2 duration-300">
                                        {deleteModal.error}
                                    </div>
                                )}
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteModal.isDeleting}
                                    className="flex items-center justify-center gap-2 w-full py-4 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {deleteModal.isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Confirm Decommission'}
                                </button>
                                <button
                                    onClick={() => setDeleteModal({ isOpen: false, questionId: null, isDeleting: false, error: null })}
                                    className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Cancel Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
