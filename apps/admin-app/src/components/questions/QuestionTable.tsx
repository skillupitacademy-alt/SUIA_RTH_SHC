'use client';

import { apiClient } from '@quiz/api-client';
import { ZLoader, ZPagination } from '@quiz/ui';
import { AlertTriangle, FileText, Filter, Hash, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { CascadingSelect, Selection } from '@/components/entry/CascadingSelect';
import { clientLogger } from '@/utils/clientLogger';

import { QuestionReviewCard } from './QuestionReviewCard';

interface QuestionData {
    id: string;
    questionText: string;
    type: string;
    difficulty: string;
    status: string;
    createdAt: string;
    mappingType?: string;
    options?: (string | { text: string; isCorrect: boolean })[];
    questionSkills?: Array<{
        skill: {
            id: string;
            name: string;
            category: string;
        }
    }>;
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
    const [pageSize, setPageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Phase 8: Filters
    const [filters, setFilters] = useState({
        domainId: '',
        subjectId: '',
        topicId: '',
        subtopicId: '',
        skillIds: [] as string[]
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; questionId: string | null; isDeleting: boolean; error: string | null }>({
        isOpen: false,
        questionId: null,
        isDeleting: false,
        error: null
    });

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBatchDeleting, setIsBatchDeleting] = useState(false);

    const handleFilterChange = useCallback((selection: Selection) => {
        setFilters(prev => {
            if (
                prev.domainId === (selection.domainId ?? '') &&
                prev.subjectId === (selection.subjectId ?? '') &&
                prev.topicId === (selection.topicId ?? '') &&
                prev.subtopicId === (selection.subtopicId ?? '') &&
                JSON.stringify(prev.skillIds) === JSON.stringify(selection.skillIds)
            ) {
                return prev;
            }
            return {
                ...prev,
                domainId: (selection.domainId != null && selection.domainId !== '') ? selection.domainId : '',
                subjectId: (selection.subjectId != null && selection.subjectId !== '') ? selection.subjectId : '',
                topicId: (selection.topicId != null && selection.topicId !== '') ? selection.topicId : '',
                subtopicId: (selection.subtopicId != null && selection.subtopicId !== '') ? selection.subtopicId : '',
                skillIds: (selection.skillIds != null) ? selection.skillIds : []
            };
        });
        setPage(1);
    }, []);


    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoading(true);
            try {
                const data = await apiClient.admin.getQuestions(page, pageSize, {
                    domainId: (filters.domainId != null && filters.domainId !== '') ? filters.domainId : undefined,
                    subjectId: (filters.subjectId != null && filters.subjectId !== '') ? filters.subjectId : undefined,
                    topicId: (filters.topicId != null && filters.topicId !== '') ? filters.topicId : undefined,
                    subtopicId: (filters.subtopicId != null && filters.subtopicId !== '') ? filters.subtopicId : undefined,
                    skillIds: filters.skillIds.length > 0 ? filters.skillIds : undefined,
                    search: (debouncedSearch != null && debouncedSearch !== '') ? debouncedSearch : undefined,
                });
                const mappedQuestions: QuestionData[] = data.questions.map((q, idx) => ({
                    id: q.id ?? `q-${idx}`,
                    questionText: q.questionText,
                    type: q.type ?? 'single',
                    difficulty: q.difficulty ?? 'intermediate',
                    status: q.status ?? 'draft',
                    createdAt: (q as { createdAt?: string }).createdAt ?? new Date().toISOString(),
                    mappingType: (q as { mappingType?: string }).mappingType,
                    options: q.options?.map((opt, optIdx) => ({
                        text: opt.text,
                        isCorrect: opt.isCorrect ?? false,
                        id: opt.id ?? `${idx}-${optIdx}`
                    })),
                    questionSkills: (q as { questionSkills?: QuestionData['questionSkills'] }).questionSkills,
                    topic: (q as { topic?: QuestionData['topic'] }).topic
                }));
            setQuestions(mappedQuestions);
            setTotalPages(data.totalPages);
            setTotalCount(data.total ?? data.questions.length); // Fallback if total is missing
        } catch (error) {
            clientLogger.error('Failed to fetch questions', { error: error instanceof Error ? error.message : 'unknown' });
            // We keep silence for main table load but could set an error state if requested
        } finally {
            setIsLoading(false);
        }
    };
        void fetchQuestions();
    }, [page, pageSize, filters, debouncedSearch]);

    const handleDelete = async () => {
        if (deleteModal.questionId === null) return;

        setDeleteModal(prev => ({ ...prev, isDeleting: true }));
        try {
            await apiClient.admin.deleteQuestion(deleteModal.questionId);
            setQuestions(prev => prev.filter(q => q.id !== deleteModal.questionId));
            handleCloseDelete();
        } catch (error) {
            clientLogger.error('Question delete failed', { error: error instanceof Error ? error.message : 'unknown' });
            setDeleteModal(prev => ({ ...prev, isDeleting: false, error: 'Deletion Failed: System could not process the request.' }));
        }
    };

    const openDeleteModal = (id: string) => {
        setDeleteModal({ isOpen: true, questionId: id, isDeleting: false, error: null });
    };

    const handleCloseDelete = () => {
        setDeleteModal({ isOpen: false, questionId: null, isDeleting: false, error: null });
    };

    const toggleSelect = (id: string, selected: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (selected) next.add(id);
            else next.delete(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === questions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(questions.map(q => q.id)));
        }
    };

    const handleBatchDelete = async () => {
        if (selectedIds.size === 0) return;

        setIsBatchDeleting(true);
        try {
            const idsToDelete = Array.from(selectedIds);
            await apiClient.admin.batchDeleteQuestions(idsToDelete);
            setQuestions(prev => prev.filter(q => !selectedIds.has(q.id)));
            setSelectedIds(new Set());
            toast.success(`Successfully deleted ${idsToDelete.length} assessments.`);
        } catch (error) {
            clientLogger.error('Batch delete questions failed', { error: error instanceof Error ? error.message : 'unknown' });
            toast.error('System failed to process batch deletion.');
        } finally {
            setIsBatchDeleting(false);
        }
    };

    return (
        <div className="space-y-6 flex flex-col min-h-[850px]">
            <div className="flex-1">
                {/* Filter Console - Always Mounted */}
                <div className="rounded-[1.75rem] border border-primary/10 bg-white/50 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden">
                    {/* Subtle Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Filter className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-[#1A1A1A]">Advanced Content Filter</h3>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Hierarchy Targeting System</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Content Search Input */}
                            <div className="relative w-full xl:w-[400px]">
                                <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search assessment text..."
                                    aria-label="Search assessments"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-3.5 text-[11px] font-black tracking-widest text-[#1A1A1A] placeholder:text-slate-300 focus:ring-2 focus:ring-[#FF4B91]/10 transition-all outline-none border border-transparent shadow-inner"
                                />
                            </div>

                            {(filters.domainId !== '' || filters.subjectId !== '' || filters.topicId !== '' || filters.subtopicId !== '' || filters.skillIds.length > 0 || searchQuery !== '') ? <button
                                onClick={() => {
                                    setFilters({ domainId: '', subjectId: '', topicId: '', subtopicId: '', skillIds: [] });
                                    setSearchQuery('');
                                    setPage(1);
                                }}
                                className="flex-shrink-0 flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 h-full"
                                aria-label="Clear filters"
                            >
                                <X className="w-3 h-3" /> Clear
                            </button> : null}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <CascadingSelect
                            value={filters as { domainId: string | null; subjectId: string | null; topicId: string | null; subtopicId: string | null; skillIds: string[]; }}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>

                {/* Question Stack Area */}
                <div className="relative min-h-[400px]">
                    {isLoading === true ? <div className="absolute inset-0 z-40 bg-white/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300 rounded-[1.75rem]">
                        <ZLoader text="Synchronizing Matrix_" />
                    </div> : null}

                    {/* Question List */}
                    <div className="space-y-6">
                        {questions.length === 0 ? (
                            <div className="text-center py-24 opacity-50">
                                <Hash className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Intelligence Assets Found</p>
                            </div>
                        ) : null}
                        {questions.length > 0 ? questions.map((q, idx) => (
                            <QuestionReviewCard
                                key={q.id}
                                question={q}
                                index={(page - 1) * 20 + idx}
                                isSelected={selectedIds.has(q.id)}
                                onSelect={toggleSelect}
                                onDeleteRequest={openDeleteModal}
                            />
                        )) : null}
                    </div>

                    {/* Floating Command Bar */}
                    {selectedIds.size > 0 ? (
                        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-500">
                            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-full px-8 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-8 min-w-[500px]">
                                <div className="flex items-center gap-4 border-r border-white/10 pr-8">
                                    <div className="w-10 h-10 rounded-xl bg-[#FF4B91] flex items-center justify-center text-white font-black shadow-lg shadow-[#FF4B91]/20">
                                        {selectedIds.size}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-white tracking-widest">Assessments Selected</p>
                                        <p className="text-[9px] font-bold text-slate-500">Database Batch Operations Ready</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/5"
                                    >
                                        {selectedIds.size === questions.length ? 'Deselect All' : 'Select Page'}
                                    </button>

                                    <button
                                        onClick={() => { void handleBatchDelete(); }}
                                        disabled={isBatchDeleting}
                                        className="px-6 py-2.5 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 group disabled:opacity-50"
                                    >
                                        {isBatchDeleting === true ? (
                                            <ZLoader size="xs" className="text-white" center={false} />
                                        ) : (
                                            <>
                                                <Trash2 size={12} className="group-hover:rotate-12 transition-transform" />
                                                Delete Selected
                                            </>
                                        )}
                                    </button>
                                </div>

                                <button
                                    onClick={() => setSelectedIds(new Set())}
                                    className="ml-auto p-2 text-slate-500 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Pagination Standard */}
            <ZPagination
                currentPage={page}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1); // Reset to first page on size change
                }}
            />

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen === true ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="w-full max-w-md bg-white border border-white/20 rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden">
                    {/* Glows */}
                    <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-red-500/5 rounded-full blur-[60px] -z-10" />

                    <div className="flex flex-col items-center text-center gap-6">
                        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 shadow-lg shadow-red-200">
                            <AlertTriangle size={32} />
                        </div>

                        <div>
                            <h2 className="text-2xl font-black text-[#1A1A1A] mb-2 text-center uppercase tracking-tight">Confirm Deletion</h2>
                            <p className="text-sm font-bold text-muted-foreground">
                                Are you sure you want to decommission this assessment record? It will be marked as <span className="text-red-500 underline">inactive</span> and removed from active rotations.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 w-full pt-4">
                            {deleteModal.error != null && deleteModal.error !== '' ? <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold animate-in slide-in-from-top-2 duration-300">
                                {deleteModal.error}
                            </div> : null}
                            <button
                                onClick={() => { void handleDelete(); }}
                                disabled={deleteModal.isDeleting}
                                className="flex items-center justify-center gap-2 w-full py-4 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {deleteModal.isDeleting === true ? <ZLoader size="xs" className="text-white" center={false} /> : 'Delete Question'}
                            </button>
                            <button
                                onClick={handleCloseDelete}
                                className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div> : null}
        </div>
    );
}
