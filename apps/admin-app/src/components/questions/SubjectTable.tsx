'use client';

import { apiClient } from '@quiz/api-client';
import { ZLoader, ZPagination } from '@quiz/ui';
import { BookOpen, Check, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

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
import { ZPortalModal } from '@/components/ui/ZPortalModal';
import { useDomains } from '@/hooks/useAdminHierarchy';
import { cn } from '@/lib/utils';

import { SubjectReviewCard } from './SubjectReviewCard';

interface SubjectItem {
    id: string;
    name: string;
    domainId: string;
    description?: string;
    status?: string;
    order?: number;
    stats: {
        total: number;
        isReady: boolean;
        simple: number;
        intermediate: number;
        expert: number;
    };
}

export function SubjectTable() {
    const [data, setData] = useState<SubjectItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
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
        status: 'active' as 'active' | 'inactive',
        order: 0
    });

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchSubjects = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.admin.getSubjects(page, pageSize, debouncedSearch || undefined);
            setData(response.data);
            setTotalPages(response.totalPages);
            setTotalCount(response.total ?? response.data?.length ?? 0);
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Failed to fetch subjects:', error);
            setErrorMessage('Connection Error: Unable to load subjects.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchSubjects();
    }, [page, pageSize, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const handleBatchDelete = async () => { // Make sure this is called by the UI
        if (selectedIds.size === 0) return;

        try {
            await apiClient.admin.batchDeleteSubjects(Array.from(selectedIds));
            setSelectedIds(new Set());
            void fetchSubjects();
            setIsDeleteOpen(false); // Close modal if open
            setCurrentSubject(null);
        } catch (error) {
            console.error('Batch delete failed:', error);
            setErrorMessage('Batch Deletion Failed: Some subjects could not be removed.');
        } finally {
        }
    };

    // --- FORM LOGIC ---
    const handleOpenForm = (subject: SubjectItem | null = null) => {
        if (subject != null) {
            setCurrentSubject(subject);
            setFormData({
                name: subject.name,
                domainId: subject.domainId,
                description: subject.description ?? '',
                status: (subject.status as 'active' | 'inactive') ?? 'active',
                order: subject.order ?? 0
            });
            setIsFormOpen(true);
        } else {
            setCurrentSubject(null);
            setFormData({
                name: '',
                domainId: domains[0]?.id || '',
                description: '',
                status: 'active',
                order: 0
            });
            setIsFactoryOpen(true); // Default to Factory for new subjects? Or form? Let's check original code. 
            // Original code opened Factory for new subjects logic. 
            // "handleOpenForm" logic in original: if (!subject) setIsFactoryOpen(true). 
            // I should respect that or unify. Let's direct "Add Subject" to factory wizard as per previous behavior, 
            // OR keep the manual form available. 
            // The "Add Subject" button in original invoked factory wizard? No, lines 331: onClick={() => handleOpenForm()} -> line 86 setIsFactoryOpen(true).
            // So YES, the original behavior for "Add Subject" was opening the Wizard.
            // But wait, line 149 shows "Standard Edit Form".
            // Let's allow manual creation if they want, but original preferred wizard. 
            // I will default "Add Subject" to OPENING THE FORM manually in this improved version, 
            // but keep the Factory button available separately like in TopicTable.
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
            if (currentSubject !== null) {
                await apiClient.admin.updateSubject(currentSubject.id, formData);
            } else {
                await apiClient.admin.createSubject(formData);
            }
            handleCloseForm();
            void fetchSubjects();
        } catch (error) {
            console.error('Failed to save subject:', error);
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
            console.error('Failed to delete subject:', error);
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
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => setIsDeleteOpen(true)}
                            className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all active:scale-95 flex items-center gap-2"
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
                            <div className="max-w-5xl mx-auto px-8 py-8">
                                <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Parent Domain */}
                                        <SelectField
                                            label="Parent Domain"
                                            value={formData.domainId}
                                            options={(domains ?? []).map((d: { id: string, name: string }) => ({ id: d.id, name: d.name }))}
                                            loading={domainsHook.loading}
                                            onChange={(val: string) => setFormData({ ...formData, domainId: val })}
                                            placeholder="Select Domain"
                                            active={true}
                                            icon={<BookOpen size={12} />}
                                            hideCreate={true}
                                        />

                                        {/* Subject Name */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Subject Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400"
                                                placeholder="e.g., Frontend Development"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400 resize-none"
                                            placeholder="Brief summary..."
                                        />
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Status</label>
                                        <div className="flex bg-white p-1.5 rounded-xl border border-slate-200">
                                            {['active', 'inactive'].map((status) => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, status: status as 'active' | 'inactive' })}
                                                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${formData.status === status
                                                        ? 'bg-[#1A1A1A] text-white shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-600'
                                                        }`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

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
                <div className="bg-white/50 backdrop-blur-xl border border-primary/10 p-6 rounded-[2rem] shadow-xl relative overflow-hidden flex items-center justify-between z-10">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-500 shadow-sm border border-purple-100">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="relative flex-1 max-w-md group">
                            <input
                                type="text"
                                placeholder="Search Subjects..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-[11px] font-black tracking-widest text-[#1A1A1A] placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/10 transition-all outline-none border border-transparent shadow-inner"
                            />
                            {/* SELECT ALL CHECKBOX */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-100 cursor-pointer hover:border-purple-200 transition-all">
                                <input
                                    type="checkbox"
                                    checked={data.length > 0 && selectedIds.size === data.length}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-offset-0 focus:ring-0 cursor-pointer"
                                />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Select All</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsFactoryOpen(true)}
                            className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                        >
                            <Plus size={14} className="text-[#FF4B91]" />
                            Bulk Factory
                        </button>
                        <button
                            onClick={() => handleOpenForm()} // Open for Create
                            className="px-6 py-3 rounded-2xl bg-[#FF4B91] hover:bg-[#ff3382] text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-[#FF4B91]/20 transition-all flex items-center gap-3 active:scale-95"
                        >
                            <Plus size={16} />
                            Add Subject
                        </button>
                    </div>
                </div>

                {/* SUBJECT CARD STACK */}
                <div className="relative min-h-[400px]">
                    {isLoading === true && (
                        <div className="absolute inset-x-0 -top-4 bottom-0 z-10 bg-white/40 backdrop-blur-[2px] flex items-center justify-center rounded-[2.5rem]">
                            <ZLoader text="Synchronizing Subject Matrix_" />
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {(isLoading === true && data.length === 0) ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-28 rounded-[2.5rem] bg-slate-50 border border-slate-100 animate-pulse" />
                            ))
                        ) : (
                            <>
                                {data.map((subject, index) => (
                                    <SubjectReviewCard
                                        key={subject.id}
                                        subject={subject}
                                        index={index + (page - 1) * 20}
                                        isSelected={selectedIds.has(subject.id)}
                                        onSelect={handleSelect}
                                        onDeleteRequest={(d) => { setCurrentSubject(d); setIsDeleteOpen(true); }}
                                        onEditRequest={(d) => handleOpenForm(d)}
                                    />
                                ))}
                                {data.length === 0 && !isLoading && (
                                    <div className="text-center py-20 opacity-50">
                                        <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                        <h3 className="text-lg font-bold text-slate-500 font-outfit uppercase tracking-tighter">Negative Subject Match_</h3>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            <ZPagination
                currentPage={page}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
            />
        </div>
    );
}
