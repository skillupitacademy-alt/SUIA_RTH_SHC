'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import { apiClient } from '@quiz/api-client';
import { ZPagination } from '@quiz/ui';
import { Check, Edit2, GitBranch, Layers, Plus, Trash, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ErrorBanner } from '@/components/layout/ErrorBanner';
import { ZPortalModal } from '@/components/ui/ZPortalModal';
import { useDomains, useSubjects, useTopics } from '@/hooks/useAdminHierarchy';
import { cn } from '@/lib/utils';
import { clientLogger } from '@/utils/clientLogger';

export function SubtopicTable() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);


    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isFactoryOpen, setIsFactoryOpen] = useState(false);
    const [currentSubtopic, setCurrentSubtopic] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBatchDeleting, setIsBatchDeleting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        topicId: '',
        description: '',
        status: 'active' as 'active' | 'inactive',
        domainId: '',   // For cascading
        subjectId: '',   // For cascading
        order: 0,
        depthLevel: 1
    });

    // Hierarchy data
    const domainsHook = useDomains();
    const subjectsHook = useSubjects(formData.domainId || undefined);
    const topicsHook = useTopics(formData.subjectId || undefined);

    const domains = domainsHook.data;
    const subjects = subjectsHook.data;
    const topics = topicsHook.data;

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchSubtopics = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.admin.getSubtopics(page, pageSize, debouncedSearch || undefined);
            setData(response.data);
            setTotalPages(response.totalPages);
            setTotalCount(response.total || response.data.length);
            setSelectedIds(new Set());
        } catch (error) {
            clientLogger.error('Failed to fetch subtopics', { error: error instanceof Error ? error.message : 'unknown' });
            setErrorMessage('Connection Error: Unable to load subtopics at this time.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchSubtopics();
    }, [page, pageSize, debouncedSearch]);

    const handleOpenForm = (subtopic: any = null) => {
        if (subtopic != null) {
            setCurrentSubtopic(subtopic);

            // Robust lineage extraction with fallbacks
            const topic = subtopic.topic;
            const topicId = (subtopic.topicId as string | undefined) ?? (topic?.id as string | undefined) ?? '';
            const subject = topic?.subject;
            const subjectId = (topic?.subjectId as string | undefined) ?? (subject?.id as string | undefined) ?? '';
            const domainId = (subject?.domainId as string | undefined) ?? (subject?.domain?.id as string | undefined) ?? '';

            setFormData({
                name: (subtopic.name as string),
                topicId: topicId,
                description: (subtopic.description as string | undefined) ?? '',
                status: ((subtopic.status as string | undefined) ?? 'active') as 'active' | 'inactive',
                domainId: domainId,
                subjectId: subjectId,
                order: (subtopic.order as number | undefined) ?? 0,
                depthLevel: (subtopic.depthLevel as number | undefined) ?? 1
            });
            setIsFormOpen(true);
        } else {
            setCurrentSubtopic(null);
            setFormData({
                name: '',
                topicId: '',
                description: '',
                status: 'active',
                domainId: '',
                subjectId: '',
                order: 0,
                depthLevel: 1
            });
            setIsFactoryOpen(true); // Open factory for new subtopic
        }
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setErrorMessage(null);
        setCurrentSubtopic(null);
        setFormData({
            name: '',
            topicId: '',
            description: '',
            status: 'active',
            domainId: '',
            subjectId: '',
            order: 0,
            depthLevel: 1
        });
    };

    const handleDomainChange = (domainId: string) => {
        setFormData({ ...formData, domainId, subjectId: '', topicId: '' });
    };

    const handleSubjectChange = (subjectId: string) => {
        setFormData({ ...formData, subjectId, topicId: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.topicId === '') {
            setErrorMessage('Constraint violation: Parent topic selection required.');
            return;
        }
        setIsSubmitting(true);
        try {
            if (currentSubtopic !== null) {
                await apiClient.admin.updateSubtopic(currentSubtopic.id, formData);
            } else {
                await apiClient.admin.createSubtopic(formData);
            }
            handleCloseForm();
            void fetchSubtopics();
        } catch (error) {
            clientLogger.error('Failed to save subtopic', { error: error instanceof Error ? error.message : 'unknown' });
            setErrorMessage('Saving Failed: Please ensure all parent hierarchy fields are selected.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (currentSubtopic === null) return;
        setIsSubmitting(true);
        try {
            await apiClient.admin.deleteSubtopic(currentSubtopic.id);
            setIsDeleteOpen(false);
            setCurrentSubtopic(null);
            void fetchSubtopics();
        } catch (error) {
            clientLogger.error('Failed to delete subtopic', { error: error instanceof Error ? error.message : 'unknown' });
            setErrorMessage('Deletion Blocked: This subtopic is currently in use and cannot be removed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- SELECTION ENGINE ---
    const toggleSelect = (id: string, selected: boolean) => {
        const next = new Set(selectedIds);
        if (selected) next.add(id);
        else next.delete(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === data.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(data.map(q => q.id)));
        }
    };

    const handleBatchDelete = async () => {
        setIsBatchDeleting(true);
        try {
            await apiClient.admin.batchDeleteSubtopics(Array.from(selectedIds));
            setSelectedIds(new Set());
            setIsDeleteOpen(false);
            void fetchSubtopics();
        } catch (error: any) {
            setErrorMessage(`Batch Deletion Failed: ${error.message}`);
        } finally {
            setIsBatchDeleting(false);
        }
    };

    return (
        <div className="space-y-6 flex flex-col min-h-[800px]">
            <div className="flex-1 space-y-6">
                {errorMessage !== null ? <ErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} /> : null}

                {/* Modalized Form */}
                <ZPortalModal isOpen={isFormOpen === true && currentSubtopic !== null} zIndex={100}>
                    <div className="h-full min-h-0 flex flex-col bg-white animate-in slide-in-from-right duration-300">
                        {/* Header Strip */}
                        <div className="px-12 py-6 border-b border-primary/5 flex items-center justify-between bg-white sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-500 flex items-center justify-center border border-teal-100 shadow-sm">
                                    <GitBranch size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tighter">Edit Subtopic</h3>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">Registry Modification • Executive Control</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseForm}
                                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-all border border-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30 p-8 custom-scrollbar overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
                            <div className="max-w-5xl mx-auto space-y-6 bg-white border border-primary/10 rounded-[2.5rem] p-8 shadow-2xl shadow-primary/5 relative overflow-hidden">
                                {/* Form Header Context */}
                                <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                    <div className="space-y-1 text-center">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Domain</p>
                                        <div className="font-bold text-slate-600 text-xs truncate">{(domains != null && Array.isArray(domains)) ? (domains.find((d: { id: string; name: string }) => d.id === formData.domainId)?.name ?? 'N/A') : 'N/A'}</div>
                                    </div>
                                    <div className="space-y-1 text-center border-x border-slate-200">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Subject</p>
                                        <div className="font-bold text-slate-600 text-xs truncate">{(subjects != null && Array.isArray(subjects)) ? (subjects.find((s: { id: string; name: string }) => s.id === formData.subjectId)?.name ?? 'N/A') : 'N/A'}</div>
                                    </div>
                                    <div className="space-y-1 text-center">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Topic</p>
                                        <div className="font-bold text-teal-600 text-xs truncate">{(topics != null && Array.isArray(topics)) ? (topics.find((t: { id: string; name: string }) => t.id === formData.topicId)?.name ?? 'N/A') : 'N/A'}</div>
                                    </div>
                                </div>

                                {/* Inputs Section */}
                                <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* The rest of the form inputs would go here */}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </ZPortalModal>

                <div className="flex items-center justify-between gap-4 p-6 bg-white border border-primary/10 rounded-[2.5rem] shadow-sm overflow-hidden relative">
                    <div className="flex items-center gap-6 flex-1">
                        <div className="relative flex-1 max-w-md group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-teal-500 transition-colors">
                                <GitBranch size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search Subtopics..."
                                aria-label="Search subtopics"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-teal-500/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsFactoryOpen(true)}
                            className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-black/10"
                        >
                            <Layers size={14} />
                            Hierarchy Factory
                        </button>
                        <button
                            onClick={() => handleOpenForm()}
                            className="px-6 py-3 rounded-2xl bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center gap-2 shadow-xl shadow-teal-500/20"
                        >
                            <Plus size={14} />
                            Create Subtopic
                        </button>
                    </div>
                </div>

                <div className="mt-6 rounded-[2.5rem] border border-primary/10 bg-white/50 backdrop-blur-sm overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-primary/5 bg-primary/5/30 backdrop-blur-md">
                                    <th className="p-6">
                                        <button onClick={toggleSelectAll} className="w-5 h-5 rounded-lg border-2 border-primary/20 flex items-center justify-center transition-all hover:border-teal-500">
                                            {selectedIds.size === data.length && data.length > 0 && <Check size={12} className="text-teal-500" />}
                                        </button>
                                    </th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subtopic Context</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Parent Topic</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Order</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                    <th className="p-6 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pulse</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-primary/5">
                                {data.map((item) => (
                                    <tr key={item.id} className={cn("group transition-colors hover:bg-white/60", selectedIds.has(item.id) && "bg-teal-50/30")}>
                                        <td className="p-6">
                                            <button
                                                onClick={() => toggleSelect(item.id, !selectedIds.has(item.id))}
                                                className={cn("w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center", selectedIds.has(item.id) ? "border-teal-500 bg-teal-500 text-white" : "border-primary/10 hover:border-primary/30")}
                                            >
                                                {selectedIds.has(item.id) && <Check size={12} />}
                                            </button>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-400 group-hover:bg-white group-hover:text-teal-500 transition-all">
                                                    <Layers size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 uppercase tracking-tight">{item.name}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 truncate max-w-[200px]">{(item.description != null && item.description !== '') ? item.description : 'Standard Knowledge Node'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                    {(item.topic?.name != null && item.topic.name !== '') ? item.topic.name : 'Unlinked'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className="text-sm font-black text-slate-800">#{item.order}</span>
                                        </td>
                                        <td className="p-6">
                                            <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", item.status === 'active' ? "bg-green-50 text-green-600 border-green-100" : "bg-slate-100 text-slate-400 border-slate-200")}>
                                                {item.status != null && item.status !== '' ? item.status : 'Active'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleOpenForm(item)} className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-500 text-slate-400 hover:text-white transition-all border border-slate-100">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => { setCurrentSubtopic(item); setIsDeleteOpen(true); }} className="p-2.5 rounded-xl bg-slate-50 hover:bg-red-500 text-slate-400 hover:text-white transition-all border border-slate-100">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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

            {/* Floating Command Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-slate-900 text-white rounded-3xl px-8 py-4 shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl bg-opacity-95">
                        <div className="flex items-center gap-4 border-r border-white/10 pr-8">
                            <div className="w-10 h-10 rounded-2xl bg-teal-500 flex items-center justify-center text-white font-black shadow-lg shadow-teal-500/20">
                                {selectedIds.size}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-500">Nodes Selected</p>
                                <p className="text-[11px] font-bold text-slate-500">Hierarchy Batch Control</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setCurrentSubtopic(null); setIsDeleteOpen(true); }}
                                disabled={isBatchDeleting}
                                className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all group disabled:opacity-50"
                            >
                                {isBatchDeleting === true ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Trash size={16} className="transition-transform group-hover:scale-110" />
                                )}
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {isBatchDeleting === true ? 'Executing...' : 'Perm-Delete Batch'}
                                </span>
                            </button>

                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
