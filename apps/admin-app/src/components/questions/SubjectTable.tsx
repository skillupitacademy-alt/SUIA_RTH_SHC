'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import { apiClient } from '@quiz/api-client';
import { ZLoader, ZPagination } from '@quiz/ui';
import { BookOpen, Check, Edit2, Layers, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ErrorBanner } from '@/components/layout/ErrorBanner';
import { ZPortalModal } from '@/components/ui/ZPortalModal';
import { useDomains } from '@/hooks/useAdminHierarchy';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SelectField } from '@/components/entry/SelectionFields';

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
            const subjects = Array.isArray(response.data) ? response.data : [];
            setData(subjects);
            setTotalPages(response.totalPages);
            setTotalCount(response.total ?? subjects.length ?? 0);
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
    }, [page, pageSize, debouncedSearch]);

    // --- SELECTION LOGIC ---
    const toggleSelect = (id: string, selected: boolean) => {
        const next = new Set(selectedIds);
        if (selected) next.add(id);
        else next.delete(id);
        setSelectedIds(next);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) setSelectedIds(new Set(data.map(item => item.id)));
        else setSelectedIds(new Set());
    };

    const handleBatchDelete = async () => {
        setIsSubmitting(true);
        try {
            await apiClient.admin.batchDeleteSubjects(Array.from(selectedIds));
            setSelectedIds(new Set());
            setIsDeleteOpen(false);
            void fetchSubjects();
        } catch (error: any) {
            setErrorMessage(`Batch Deletion Failed: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- FORM LOGIC ---
    const handleOpenForm = (subject?: SubjectItem) => {
        if (subject) {
            setCurrentSubject(subject);
            setFormData({
                name: subject.name,
                domainId: subject.domainId,
                description: subject.description || '',
                status: (subject.status as any) || 'active',
                order: subject.order || 0
            });
        } else {
            setCurrentSubject(null);
            setFormData({
                name: '',
                domainId: '',
                description: '',
                status: 'active',
                order: 0
            });
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setCurrentSubject(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (currentSubject) {
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
                                        Registry Modification • Executive Control
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
                                        <SelectField
                                            label="Parent Domain"
                                            value={formData.domainId}
                                            options={(domains ?? []).map((d: any) => ({ id: d.id, name: d.name }))}
                                            loading={domainsHook.loading}
                                            onChange={(val: string) => setFormData({ ...formData, domainId: val })}
                                            placeholder="Select Domain"
                                            active={true}
                                            icon={<BookOpen size={12} />}
                                            hideCreate={true}
                                        />

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
                                            disabled={isSubmitting}
                                            className="px-10 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isSubmitting ? <ZLoader size="xs" className="text-white" center={false} /> : <Check size={16} />}
                                            {isSubmitting ? 'Saving...' : 'Save Subject'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </ZPortalModal>

                {/* HEADER & SEARCH */}
                <div className="bg-white/50 backdrop-blur-xl border border-primary/10 p-6 rounded-[2rem] shadow-xl relative overflow-hidden flex items-center justify-between z-10">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-500 shadow-sm border border-purple-100">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div className="relative flex-1 max-w-md group">
                            <input
                                type="text"
                                placeholder="Search Subjects..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-[11px] font-black tracking-widest text-[#1A1A1A] placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/10 transition-all outline-none border border-transparent shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleOpenForm()}
                            className="px-6 py-3 rounded-2xl bg-[#1A1A1A] text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-black/10"
                        >
                            <Plus size={14} />
                            New Subject
                        </button>
                    </div>
                </div>

                {/* TABLE AREA */}
                <div className="bg-white/50 backdrop-blur-xl border border-primary/10 rounded-[2.5rem] shadow-sm overflow-hidden relative">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-primary/5">
                                <th className="p-6 text-left">
                                    <button
                                        onClick={() => handleSelectAll(selectedIds.size !== data.length)}
                                        className={cn(
                                            "w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center",
                                            (data.length > 0 && selectedIds.size === data.length) ? "bg-teal-500 border-teal-500" : "bg-white border-slate-200"
                                        )}
                                    >
                                        {(data.length > 0 && selectedIds.size === data.length) && <Check size={12} className="text-white" />}
                                    </button>
                                </th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Internal Registry</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Density</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Certification</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                            {(isLoading === true && data.length === 0) ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="p-8">
                                            <div className="h-8 bg-slate-100/50 rounded-xl w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <>
                                    {Array.isArray(data) && data.map((subject) => (
                                        <tr key={subject.id} className={cn("group transition-colors hover:bg-white/60", selectedIds.has(subject.id) && "bg-teal-50/30")}>
                                            <td className="p-6">
                                                <button
                                                    onClick={() => toggleSelect(subject.id, !selectedIds.has(subject.id))}
                                                    className={cn(
                                                        "w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center",
                                                        selectedIds.has(subject.id) ? "bg-teal-500 border-teal-500 shadow-lg shadow-teal-500/20" : "bg-white border-slate-200"
                                                    )}
                                                >
                                                    {selectedIds.has(subject.id) && <Check size={12} className="text-white" />}
                                                </button>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-teal-500/10 group-hover:text-teal-500 transition-colors">
                                                        <BookOpen size={18} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-[#1A1A1A]">{subject.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-400">ID: {subject.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-sm font-black text-[#1A1A1A]">{subject.stats?.total ?? 0}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Assets</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest",
                                                    subject.stats?.isReady ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", subject.stats?.isReady ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                                                    {subject.stats?.isReady ? 'Certified' : 'Deficit'}
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenForm(subject)} className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-teal-500 hover:border-teal-500/20 transition-all shadow-sm">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => { setCurrentSubject(subject); setIsDeleteOpen(true); }} className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(Array.isArray(data) && data.length === 0) && !isLoading && (
                                        <tr>
                                            <td colSpan={5} className="py-32 text-center opacity-50">
                                                <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                                <h3 className="text-lg font-bold text-slate-500 font-outfit uppercase tracking-tighter">Negative Subject Match_</h3>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {data.length > 0 && (
                    <div className="bg-white/50 backdrop-blur-xl border border-primary/10 p-6 rounded-[2rem] flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Showing <span className="text-slate-900">{data.length}</span> of <span className="text-slate-900">{totalCount}</span> Global Registry Nodes
                        </p>
                        <ZPagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalCount={totalCount}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                        />
                    </div>
                )}
            </div>

            {/* DELETE MODAL */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent className="bg-white rounded-[2rem] border border-slate-100 p-0 overflow-hidden max-w-md">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500" />
                    <div className="p-8 flex flex-col items-center text-center gap-6">
                        <div className="h-16 w-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
                            <Trash2 size={32} />
                        </div>
                        <div className="space-y-2">
                            <AlertDialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tight">Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                                {selectedIds.size > 1
                                    ? `You are about to permanently delete ${selectedIds.size} subjects. This action cannot be undone.`
                                    : `You are about to delete "${currentSubject?.name ?? ''}". This action cannot be undone.`
                                }
                            </AlertDialogDescription>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full pt-4">
                            <AlertDialogCancel className="rounded-xl border-2 border-slate-100 py-6 font-bold uppercase tracking-wider text-xs hover:bg-slate-50">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => { void handleDelete(); }}
                                className="rounded-xl bg-red-600 py-6 font-black uppercase tracking-wider text-xs hover:bg-red-700 text-white shadow-xl shadow-red-500/20"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Deleting...' : 'Delete Forever'}
                            </AlertDialogAction>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
