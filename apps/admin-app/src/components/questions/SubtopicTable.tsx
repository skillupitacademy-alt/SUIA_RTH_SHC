'use client';

import { apiClient } from '@quiz/api-client';
import { HierarchySearchBar, ZPagination, ZPortalModal } from '@quiz/ui';
import { Check, Edit2, GitBranch, Layers, Plus, Trash, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { HierarchyFactoryWizard } from '@/components/content/HierarchyFactoryWizard';
import { ErrorBanner } from '@/components/layout/ErrorBanner';
import { useDomains, useSubjects, useTopics } from '@/hooks/useAdminHierarchy';
import { cn } from '@/lib/utils';
import { clientLogger } from '@/utils/clientLogger';

import type { Domain } from '../../types/domain';

type SubtopicRow = {
    id: string;
    name: string;
    topicId: string;
    description?: string | null;
    status?: 'active' | 'inactive' | 'draft';
    order?: number;
    depthLevel?: number;
    topic?: {
        id?: string;
        name?: string;
        subjectId?: string;
        domainId?: string;
        subject?: { id?: string; name?: string; domainId?: string; domain?: Domain };
    };
};

type SubtopicForm = {
    name: string;
    topicId: string;
    description: string;
    status: 'active' | 'inactive';
    domainId: string;
    subjectId: string;
    order: number;
    depthLevel: number;
};

export function SubtopicTable() {
    const [data, setData] = useState<SubtopicRow[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);


    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentSubtopic, setCurrentSubtopic] = useState<SubtopicRow | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFactoryOpen, setIsFactoryOpen] = useState(false);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBatchDeleting, setIsBatchDeleting] = useState(false);

    const [formData, setFormData] = useState<SubtopicForm>({
        name: '',
        topicId: '',
        description: '',
        status: 'active',
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

    const fetchSubtopics = useCallback(async () => {
        try {
            const response = await apiClient.admin.getSubtopics(page, pageSize, debouncedSearch || undefined);
            const mapped: SubtopicRow[] = Array.isArray(response.data)
                ? response.data.map((s) => ({
                    id: String((s as { id?: string }).id ?? crypto.randomUUID()),
                    name: (s as { name?: string }).name ?? '',
                    topicId: (s as { topicId?: string }).topicId ?? '',
                    description: (s as { description?: string | null }).description ?? null,
                    status: (s as { status?: string }).status as SubtopicRow['status'] ?? 'active',
                    order: (s as { order?: number }).order ?? (s as { orderIndex?: number }).orderIndex ?? 0,
                    depthLevel: (s as { depthLevel?: number }).depthLevel ?? 0,
                    topic: (s as { topic?: SubtopicRow['topic'] }).topic
                }))
                : [];
            setData(mapped);
            setTotalPages(response.totalPages);
            setTotalCount(response.total ?? mapped.length);
            setSelectedIds(new Set());
        } catch (error) {
            clientLogger.error('Failed to fetch subtopics', { error: error instanceof Error ? error.message : 'unknown' });
            setErrorMessage('Connection Error: Unable to load subtopics at this time.');
        }
    }, [debouncedSearch, page, pageSize]);

    useEffect(() => {
        void fetchSubtopics();
    }, [fetchSubtopics]);

    const handleOpenForm = (subtopic: SubtopicRow | null = null) => {
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
            setIsFormOpen(true);
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
            const payload = {
                ...formData,
                slug: formData.name || 'subtopic',
                orderIndex: formData.order ?? 0
            };
            if (currentSubtopic !== null) {
                await apiClient.admin.updateSubtopic(currentSubtopic.id, payload);
            } else {
                await apiClient.admin.createSubtopic(payload);
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

    const deleteSubtopic = async (id: string) => {
        setIsSubmitting(true);
        try {
            await apiClient.admin.deleteSubtopic(id);
            void fetchSubtopics();
        } catch (error) {
            clientLogger.error('Failed to delete subtopic', { error: error instanceof Error ? error.message : 'unknown' });
            setErrorMessage('Deletion Blocked: This subtopic is currently in use and cannot be removed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBatchDelete = useCallback(async () => {
        if (selectedIds.size === 0) return;
        setIsBatchDeleting(true);
        try {
            await apiClient.admin.batchDeleteSubtopics(Array.from(selectedIds));
            setSelectedIds(new Set());
            void fetchSubtopics();
        } catch (error) {
            clientLogger.error('Failed to batch delete subtopics', { error: error instanceof Error ? error.message : 'unknown' });
            setErrorMessage('Batch Deletion Failed: Some subtopics may have dependencies.');
        } finally {
            setIsBatchDeleting(false);
        }
    }, [fetchSubtopics, selectedIds]);

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

    return (
        <div className="space-y-6 flex flex-col min-h-[800px]">
            <div className="flex-1 space-y-6">
                {errorMessage !== null ? <ErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} /> : null}

                <HierarchyFactoryWizard
                    isOpen={isFactoryOpen}
                    onClose={() => setIsFactoryOpen(false)}
                    initialData={(formData.topicId !== '' && formData.subjectId !== '' && formData.domainId !== '')
                        ? { target: 'subtopic', domainId: formData.domainId, subjectId: formData.subjectId, topicId: formData.topicId }
                        : { target: 'subtopic' }}
                    onSuccess={() => { setIsFactoryOpen(false); void fetchSubtopics(); }}
                />

                {/* Modalized Form */}
                <ZPortalModal isOpen={isFormOpen} zIndex={100}>
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
                        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30 p-6 custom-scrollbar overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
                            <div className="w-full max-w-[1920px] mx-auto space-y-4 bg-white border border-primary/10 rounded-[2rem] p-6 shadow-2xl shadow-primary/5 relative overflow-hidden">
                                {/* Form Header Context */}
                                <div className="grid grid-cols-3 gap-3 p-5 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
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
                                <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Parent Domain</p>
                                            <select
                                                value={formData.domainId}
                                                onChange={(e) => handleDomainChange(e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#1A1A1A] focus:ring-2 focus:ring-teal-500/20"
                                            >
                                                <option value="">Select Domain</option>
                                                {Array.isArray(domains) && domains.map((d: { id: string; name: string }) => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Parent Subject</p>
                                            <select
                                                value={formData.subjectId}
                                                onChange={(e) => handleSubjectChange(e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#1A1A1A] focus:ring-2 focus:ring-teal-500/20"
                                            >
                                                <option value="">Select Subject</option>
                                                {Array.isArray(subjects) && subjects.map((s: { id: string; name: string }) => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Parent Topic</p>
                                            <select
                                                value={formData.topicId}
                                                onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#1A1A1A] focus:ring-2 focus:ring-teal-500/20"
                                            >
                                                <option value="">Select Topic</option>
                                                {Array.isArray(topics) && topics.map((t: { id: string; name: string }) => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</p>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#1A1A1A] focus:ring-2 focus:ring-teal-500/20"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Display Order</p>
                                            <input
                                                type="number"
                                                value={formData.order}
                                                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#1A1A1A] focus:ring-2 focus:ring-teal-500/20"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Depth Level</p>
                                            <input
                                                type="number"
                                                value={formData.depthLevel}
                                                onChange={(e) => setFormData({ ...formData, depthLevel: Number(e.target.value) })}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#1A1A1A] focus:ring-2 focus:ring-teal-500/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subtopic Name</p>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#1A1A1A] focus:ring-2 focus:ring-teal-500/20"
                                            placeholder="Enter subtopic name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</p>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#1A1A1A] focus:ring-2 focus:ring-teal-500/20 min-h-[120px]"
                                            placeholder="Brief description of this subtopic"
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-1">
                                        <button
                                            type="button"
                                            onClick={handleCloseForm}
                                            className="px-5 py-3 rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-6 py-3 rounded-2xl bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-60"
                                        >
                                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </ZPortalModal>

                <HierarchySearchBar
                    value={searchQuery}
                    placeholder="Search Subtopics..."
                    onChange={(val) => setSearchQuery(val)}
                    onSelectAll={() => toggleSelectAll()}
                    selectAllChecked={selectedIds.size === data.length && data.length > 0}
                    leftIcon={<GitBranch size={18} />}
                    actions={(
                        <>
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
                        </>
                    )}
                />

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
                                                {item.status ?? 'Active'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleOpenForm(item)} className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-500 text-slate-400 hover:text-white transition-all border border-slate-100">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => { void deleteSubtopic(item.id); }} className="p-2.5 rounded-xl bg-slate-50 hover:bg-red-500 text-slate-400 hover:text-white transition-all border border-slate-100">
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
                                onClick={() => { void handleBatchDelete(); }}
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
