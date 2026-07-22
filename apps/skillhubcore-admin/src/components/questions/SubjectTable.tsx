'use client';

import { apiClient } from '@quiz/api-client';
import { HierarchySearchBar, ZLoader, ZPagination, ZPortalModal } from '@quiz/ui';
import { BookOpen, Check, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { HierarchyFactoryWizard } from '@/components/content/HierarchyFactoryWizard';
import { SelectField } from '@/components/entry/SelectionFields';
import { ErrorBanner } from '@/components/layout/ErrorBanner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDomains } from '@/hooks/useAdminHierarchy';
import { cn } from '@/lib/utils';
import { clientLogger } from '@/utils/clientLogger';

import type { Domain } from '../../types/domain';
import { SubjectReviewCard } from './SubjectReviewCard';
type SubjectItem = {
    id: string;
    name: string;
    domainId: string;
    description?: string | null;
    status?: 'draft' | 'active' | 'archived' | 'deleted';
    order?: number;
    orderIndex?: number;
    domain?: { name?: string; id?: string; domainId?: string };
    stats?: {
        total: number;
        isReady: boolean;
        simple: number;
        intermediate: number;
        expert: number;
    };
    createdAt?: string;
    updatedAt?: string;
};

const STATUS_OPTIONS = [
    { id: 'draft', name: 'Draft' },
    { id: 'active', name: 'Active' },
    { id: 'archived', name: 'Archived' }
];

export function SubjectTable() {
    const [data, setData] = useState<SubjectItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentCursor, setCurrentCursor] = useState<string | null>(null);
    const [cursorStack, setCursorStack] = useState<Array<string | null>>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Hierarchy Data
    const domainsHook = useDomains();
    const domains = domainsHook.data;

    // Batch Operation State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [currentSubject, setCurrentSubject] = useState<SubjectItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFactoryOpen, setIsFactoryOpen] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        domainId: '',
        description: '',
        status: 'active' as 'draft' | 'active' | 'archived',
        order: 0
    });

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchSubjects = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.admin.getSubjects(currentCursor, pageSize, undefined, debouncedSearch || undefined);
            const mapped: SubjectItem[] = (Array.isArray(response.data) ? response.data : []).map((s) => ({
                id: String(s.id),
                name: s.name ?? '',
                domainId: s.domainId ?? '',
                description: s.description ?? null,
                status: ((s as { status?: SubjectItem['status'] }).status) ?? 'active',
                order: (s as { order?: number }).order ?? (s as { orderIndex?: number }).orderIndex ?? 0,
                orderIndex: (s as { orderIndex?: number }).orderIndex,
                createdAt: (s as { createdAt?: string }).createdAt,
                domain: (s as { domain?: { name?: string } }).domain,
                stats: {
                    total: 0,
                    isReady: false,
                    simple: 0,
                    intermediate: 0,
                    expert: 0,
                    ...(s as { stats?: SubjectItem['stats'] }).stats
                }
            }));
            setData(mapped);
            const total = response.total ?? response.data.length ?? 0;
            setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
            setTotalCount(total);
            setNextCursor(response.nextCursor ?? null);
            setSelectedIds(new Set());
        } catch (error) {
            clientLogger.error('Failed to fetch subjects', { error: error instanceof Error ? error.message : 'unknown' });
            setErrorMessage('Connection Error: Unable to load subjects.');
        } finally {
            setIsLoading(false);
        }
    }, [currentCursor, debouncedSearch, pageSize]);

    useEffect(() => {
        void fetchSubjects();
    }, [fetchSubjects]);

    const currentPage = cursorStack.length + 1;

    const resetPagination = () => {
        setCurrentCursor(null);
        setCursorStack([]);
        setNextCursor(null);
    };

    const handleNextPage = () => {
        if (nextCursor === null) return;
        setCursorStack((prev) => [...prev, currentCursor]);
        setCurrentCursor(nextCursor);
    };

    const handlePreviousPage = () => {
        setCursorStack((prev) => {
            if (prev.length === 0) return prev;
            const nextStack = [...prev];
            const previousCursor = nextStack.pop() ?? null;
            setCurrentCursor(previousCursor);
            return nextStack;
        });
    };

    // --- SELECTION LOGIC ---
    const handleSelect = (id: string, selected: boolean) => {
        const newSelected = new Set(selectedIds);
        if (selected) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSelectAll = (selected: boolean) => {
        if (selected) {
            const allIds = data.map(d => d.id);
            setSelectedIds(new Set(allIds));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleBatchDelete = useCallback(async () => {
        if (selectedIds.size === 0) return;

        try {
            await apiClient.admin.batchDeleteSubjects(Array.from(selectedIds));
            setSelectedIds(new Set());
            void fetchSubjects();
            setIsDeleteOpen(false); // Close modal if open
            setCurrentSubject(null);
        } catch (error) {
            clientLogger.error('Batch delete subjects failed', { error: error instanceof Error ? error.message : 'unknown' });
            setErrorMessage('Batch Deletion Failed: Some subjects could not be removed.');
        }
    }, [fetchSubjects, selectedIds]);

    // --- FORM LOGIC ---
    const handleOpenForm = (subject: SubjectItem | null = null) => {
        if (subject != null) {
            setCurrentSubject(subject);
            setFormData({
                name: subject.name,
                domainId: subject.domainId,
                description: subject.description ?? '',
                status: subject.status === 'draft' || subject.status === 'archived' ? subject.status : 'active',
                order: subject.order ?? 0
            });
            setIsFormOpen(true);
        } else {
            setCurrentSubject(null);
            setFormData({
                name: '',
                domainId: '',
                description: '',
                status: 'active',
                order: 0
            });
            setIsFormOpen(true);
        }
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setErrorMessage(null);
        setCurrentSubject(null);
        setFormData({
            name: '',
            domainId: '',
            description: '',
            status: 'active',
            order: 0
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.domainId === '') {
            setErrorMessage('Constraint violation: Parent domain selection required.');
            return;
        }
        setIsSubmitting(true);
        try {
            const payload: {
                name: string;
                domainId: string;
                description?: string;
                status: 'draft' | 'active' | 'archived';
                order?: number;
                slug: string;
                icon: string;
                orderIndex: number;
            } = {
                ...formData,
                slug: formData.name || 'subject',
                icon: 'default',
                orderIndex: formData.order ?? 0
            };
            if (currentSubject !== null) {
                await apiClient.admin.updateSubject(currentSubject.id, payload);
            } else {
                await apiClient.admin.createSubject(payload);
            }
            handleCloseForm();
            void fetchSubjects();
        } catch (error) {
            clientLogger.error('Failed to save subject', { error: error instanceof Error ? error.message : 'unknown' });
            setErrorMessage('Saving Failed: Please ensure all fields are correct.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        // If batch delete mode (multiple selected)
        if (selectedIds.size > 0 && (currentSubject === null || selectedIds.size > 1)) {
            await handleBatchDelete();
            return;
        }

        if (currentSubject === null) return;

        setIsSubmitting(true);
        try {
            await apiClient.admin.deleteSubject(currentSubject.id);
            setIsDeleteOpen(false);
            setCurrentSubject(null);
            void fetchSubjects();
        } catch (error) {
            clientLogger.error('Failed to delete subject', { error: error instanceof Error ? error.message : 'unknown' });
            setErrorMessage('Deletion Blocked: This subject is linked to active topics.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 flex flex-col min-h-[800px]">
            <div className="flex-1 space-y-6">
                {errorMessage !== null ? <ErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} /> : null}

                {/* FLOATING COMMAND BAR */}
                <div className={cn(
                    "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 transition-all duration-300 border border-white/10",
                    selectedIds.size > 0 ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
                )}>
                    <div className="flex items-center gap-4 border-r border-white/10 pr-6">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Selection</span>
                            <span className="text-xl font-black">{selectedIds.size} <span className="text-sm font-bold text-white/60">subjects</span></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                            aria-label="Clear selected subjects"
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => setIsDeleteOpen(true)}
                            className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all active:scale-95 flex items-center gap-2"
                            aria-label="Delete selected subjects"
                        >
                            <Trash2 size={14} />
                            Delete Selection
                        </button>
                    </div>
                </div>

                {/* Standard Edit Form */}
                <ZPortalModal isOpen={isFormOpen} zIndex={100}>
                    <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300">
                        <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <BookOpen size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tight">
                                        {currentSubject !== null ? 'Edit Subject' : 'New Subject'}
                                    </h3>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">
                                        {currentSubject !== null ? 'Modify Subject Details' : 'Create New Subject'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseForm}
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="w-full max-w-[1920px] mx-auto px-8 py-8">
                                <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Parent Domain */}
                                        <SelectField
                                            label="Parent Domain"
                                            value={formData.domainId}
                                            options={(domains ?? []).map((d: Domain) => ({ id: d.id, name: d.name }))}
                                            loading={domainsHook.loading}
                                            onChange={(val: string) => setFormData({ ...formData, domainId: val })}
                                            placeholder="Select Domain"
                                            active={true}
                                            icon={<BookOpen size={12} />}
                                            hideCreate={true}
                                        />

                                        {/* Subject Name */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1" htmlFor="subject-name">Subject Name</label>
                                            <input
                                                type="text"
                                                required
                                                id="subject-name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400"
                                                placeholder="e.g., Frontend Development"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1" htmlFor="subject-description">Description</label>
                                        <textarea
                                            id="subject-description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400 resize-none"
                                            placeholder="Brief summary..."
                                        />
                                    </div>

                                    <SelectField
                                        label="Status"
                                        value={formData.status}
                                        options={STATUS_OPTIONS}
                                        loading={false}
                                        onChange={(val) => setFormData({ ...formData, status: val as typeof formData.status })}
                                        placeholder="Select Status"
                                        active={true}
                                        icon={<Check size={12} />}
                                        hideCreate={true}
                                    />

                                    {/* Footer Actions */}
                                    <div className="pt-8 flex items-center justify-end gap-4">
                                        <button
                                            type="button"
                                            onClick={handleCloseForm}
                                            className="px-8 py-3 rounded-xl text-slate-500 font-bold uppercase tracking-widest text-xs hover:bg-slate-100 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting === true}
                                            className="px-10 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isSubmitting === true ? <ZLoader size="xs" className="text-white" center={false} /> : <Check size={16} />}
                                            {isSubmitting === true ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </ZPortalModal>

                <HierarchyFactoryWizard
                    isOpen={isFactoryOpen}
                    onClose={() => setIsFactoryOpen(false)}
                    onSuccess={() => {
                        setIsFactoryOpen(false);
                        void fetchSubjects();
                    }}
                    initialData={
                        (formData.domainId != null && formData.domainId !== '')
                            ? { target: 'subject', domainId: formData.domainId as string, domainName: ((domains ?? []).find(d => d.id === formData.domainId)?.name) ?? '' }
                            : { target: 'subject' }
                    }
                />

                {/* Delete Confirmation Modal */}
                <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <AlertDialogContent className="bg-white rounded-[2rem] border border-slate-100 p-0 overflow-hidden max-w-md">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500" />
                        <div className="p-8 flex flex-col items-center text-center gap-6">
                            <div className="h-16 w-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
                                <Trash2 size={32} />
                            </div>

                            <div className="space-y-2">
                                <AlertDialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                    Confirm Deletion
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                                    {selectedIds.size > 1
                                        ? `You are about to permanently delete ${selectedIds.size} subjects. This action cannot be undone.`
                                        : `You are about to delete "${currentSubject?.name ?? ''}". This action cannot be undone.`
                                    }
                                </AlertDialogDescription>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full pt-4">
                                <AlertDialogCancel className="rounded-xl border-2 border-slate-100 py-6 font-bold uppercase tracking-wider text-xs hover:bg-slate-50 hover:text-slate-800">
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => { void handleDelete(); }}
                                    className="rounded-xl bg-red-600 py-6 font-black uppercase tracking-wider text-xs hover:bg-red-700 shadow-xl shadow-red-500/20 text-white"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Deleting...' : 'Delete Forever'}
                                </AlertDialogAction>
                            </div>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>

                {/* HEADER & SEARCH */}
                <HierarchySearchBar
                    value={searchQuery}
                    placeholder="Search Subjects..."
                    onChange={(val) => { setSearchQuery(val); resetPagination(); }}
                    onSelectAll={(checked) => handleSelectAll(checked)}
                    selectAllChecked={data.length > 0 && selectedIds.size === data.length}
                    leftIcon={<BookOpen className="w-5 h-5" />}
                    actions={(
                        <>
                            <button
                                onClick={() => setIsFactoryOpen(true)}
                                className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                                aria-label="Open subject bulk factory"
                            >
                                <Plus size={14} className="text-[#FF4B91]" />
                                Bulk Factory
                            </button>
                            <button
                                onClick={() => handleOpenForm()} // Open for Create
                                className="px-6 py-3 rounded-2xl bg-[#FF4B91] hover:bg-[#ff3382] text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-[#FF4B91]/20 transition-all flex items-center gap-3 active:scale-95"
                                aria-label="Add subject"
                            >
                                <Plus size={16} />
                                Add Subject
                            </button>
                        </>
                    )}
                />

                {/* SUBJECT CARD STACK */}
                {isLoading === true ? (
                    <div className="min-h-[400px] flex items-center justify-center">
                        <ZLoader text="Loading Subjects..." />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {data.map((subject, index) => {
                            const normalized = {
                                id: subject.id,
                                name: subject.name,
                                domainId: subject.domainId,
                                status: subject.status ?? 'active',
                                description: subject.description ?? undefined,
                                createdAt: subject.createdAt,
                                domain: subject.domain
                            };
                            return (
                                <SubjectReviewCard
                                    key={subject.id}
                                    subject={normalized}
                                    index={index + (currentPage - 1) * pageSize}
                                    isSelected={selectedIds.has(subject.id)}
                                    onSelect={handleSelect}
                                    onDeleteRequest={(d) => {
                                        setCurrentSubject({
                                            ...subject,
                                            status: (d.status as SubjectItem['status']) ?? 'active',
                                            description: d.description ?? null
                                        }); setIsDeleteOpen(true);
                                    }}
                                    onEditRequest={(d) => handleOpenForm({
                                        ...subject,
                                        status: (d.status as SubjectItem['status']) ?? 'active',
                                        description: d.description ?? null
                                    })}
                                />
                            );
                        })}
                        {data.length === 0 && (
                            <div className="text-center py-20 opacity-50">
                                <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                <h3 className="text-lg font-bold text-slate-500">No subjects found</h3>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <ZPagination
                mode="cursor"
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                canGoPrevious={cursorStack.length > 0}
                hasNextPage={nextCursor !== null}
                onPrevious={handlePreviousPage}
                onNext={handleNextPage}
                onPageChange={() => undefined}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    resetPagination();
                }}
            />
        </div>
    );
}
