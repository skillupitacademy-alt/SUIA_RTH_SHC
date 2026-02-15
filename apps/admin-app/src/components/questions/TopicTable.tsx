'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import { apiClient } from '@quiz/api-client';
import { ZLoader, ZPagination } from '@quiz/ui';
import { BookOpen, Check, Edit2, Hash, Layers, Plus, Trash, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ErrorBanner } from '@/components/layout/ErrorBanner';
import { useDomains, useSubjects } from '@/hooks/useAdminHierarchy';
import { cn } from '@/lib/utils';

export function TopicTable() {
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
    const [isDeleteOpen, setIsDeleteOpen] = useState(false); const [isFactoryOpen, setIsFactoryOpen] = useState(false);
    const [currentTopic, setCurrentTopic] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBatchDeleting, setIsBatchDeleting] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        subjectId: '',
        description: '',
        status: 'active' as 'active' | 'inactive',
        domainId: '', // For cascading selection
        weight: 1,
        complexityLevel: 1
    });

    // Hierarchy data
    const domainsHook = useDomains();
    const subjectsHook = useSubjects(formData.domainId || undefined);
    const domains = domainsHook.data;
    const subjects = subjectsHook.data;

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchTopics = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.admin.getTopics(page, pageSize, debouncedSearch || undefined);
            setData(response.data);
            setTotalPages(response.totalPages);
            setTotalCount(response.total || response.data.length);
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Failed to fetch topics:', error);
            setErrorMessage('Connection Error: Unable to load topics at this time.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchTopics();
    }, [page, pageSize, debouncedSearch]);

    const handleOpenForm = (topic: any = null) => {
        if (topic) {
            setCurrentTopic(topic);
            setFormData({
                name: topic.name,
                subjectId: topic.subjectId || topic.subject?.id || '',
                description: topic.description || '',
                status: topic.status || 'active',
                domainId: topic.subject?.domainId || topic.subject?.domain?.id || '',
                weight: topic.weight || 1,
                complexityLevel: topic.complexityLevel || 1
            });
            if (topic.subject?.domainId) {
                // No manual fetch needed with atomic hooks
            }
        } else {
            setCurrentTopic(null);
            setFormData({
                name: '',
                subjectId: '',
                description: '',
                status: 'active',
                domainId: '',
                weight: 1,
                complexityLevel: 1
            });
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setErrorMessage(null);
        setCurrentTopic(null);
        setFormData({
            name: '',
            subjectId: '',
            description: '',
            status: 'active',
            domainId: '',
            weight: 1,
            complexityLevel: 1
        });
    };

    const handleDomainChange = (domainId: string) => {
        setFormData({ ...formData, domainId, subjectId: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subjectId) {
            setErrorMessage('Constraint violation: Parent subject selection required.');
            return;
        }
        setIsSubmitting(true);
        try {
            if (currentTopic) {
                await apiClient.admin.updateTopic(currentTopic.id, formData);
            } else {
                await apiClient.admin.createTopic(formData);
            }
            handleCloseForm();
            fetchTopics();
        } catch (error) {
            console.error('Failed to save topic:', error);
            setErrorMessage('Saving Failed: Please ensure all fields (including parent subject) are correct.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (currentTopic === null) return;
        setIsSubmitting(true);
        try {
            await apiClient.admin.deleteTopic(currentTopic.id);
            setIsDeleteOpen(false);
            setCurrentTopic(null);
            fetchTopics();
        } catch (error) {
            console.error('Failed to delete topic:', error);
            setErrorMessage('Deletion Blocked: This topic is linked to subtopics or questions and cannot be removed.');
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
            await apiClient.admin.batchDeleteTopics(Array.from(selectedIds));
            setSelectedIds(new Set());
            setIsDeleteOpen(false);
            fetchTopics();
        } catch (error: any) {
            setErrorMessage(`Batch Deletion Failed: ${error.message}`);
        } finally {
            setIsBatchDeleting(false);
        }
    };

    return (
        <div className="space-y-6 flex flex-col min-h-[850px]">
            <div className="flex-1">
                {errorMessage !== null ? <ErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} /> : null}

                <div className="flex items-center justify-between gap-4 p-6 bg-white border border-primary/10 rounded-[2.5rem] shadow-sm overflow-hidden relative">
                    <div className="flex items-center gap-6 flex-1">
                        <div className="relative flex-1 max-w-md group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#FF4B91] transition-colors">
                                <Hash size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search Topic Nodes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-[#FF4B91]/20 transition-all"
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
                            className="px-6 py-3 rounded-2xl bg-[#FF4B91] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#FF3B81] transition-all flex items-center gap-2 shadow-xl shadow-[#FF4B91]/20"
                        >
                            <Plus size={14} />
                            Create Topic
                        </button>
                    </div>
                </div>

                <div className="mt-6 rounded-[2.5rem] border border-primary/10 bg-white/50 backdrop-blur-sm overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-primary/5 bg-primary/5/30 backdrop-blur-md">
                                    <th className="p-6">
                                        <button onClick={toggleSelectAll} className="w-5 h-5 rounded-lg border-2 border-primary/20 flex items-center justify-center transition-all hover:border-[#FF4B91]">
                                            {selectedIds.size === data.length && data.length > 0 && <Check size={12} className="text-[#FF4B91]" />}
                                        </button>
                                    </th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Topic Descriptor</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Parent Subject</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Weight</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                    <th className="p-6 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pulse</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-primary/5">
                                {data.map((topic) => (
                                    <tr key={topic.id} className={cn("group transition-colors hover:bg-white/60", selectedIds.has(topic.id) && "bg-[#FF4B91]/5")}>
                                        <td className="p-6">
                                            <button
                                                onClick={() => toggleSelect(topic.id, !selectedIds.has(topic.id))}
                                                className={cn("w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center", selectedIds.has(topic.id) ? "border-[#FF4B91] bg-[#FF4B91] text-white" : "border-primary/10 hover:border-primary/30")}
                                            >
                                                {selectedIds.has(topic.id) && <Check size={12} />}
                                            </button>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-primary/5 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-[#FF4B91] transition-all">
                                                    <BookOpen size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 uppercase tracking-tight">{topic.name}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 truncate max-w-[200px]">{topic.description || 'No specialized metadata'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                    {topic.subject?.name || 'Unlinked'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className="text-sm font-black text-slate-800">{topic.weight}x</span>
                                        </td>
                                        <td className="p-6">
                                            <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", topic.status === 'active' ? "bg-green-50 text-green-600 border-green-100" : "bg-slate-100 text-slate-400 border-slate-200")}>
                                                {topic.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleOpenForm(topic)} className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#FF4B91] text-slate-400 hover:text-white transition-all border border-slate-100">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => { setCurrentTopic(topic); setIsDeleteOpen(true); }} className="p-2.5 rounded-xl bg-slate-50 hover:bg-red-500 text-slate-400 hover:text-white transition-all border border-slate-100">
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
                            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20">
                                {selectedIds.size}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Nodes Selected</p>
                                <p className="text-[11px] font-bold text-slate-500">Hierarchy Batch Control</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setCurrentTopic(null); setIsDeleteOpen(true); }}
                                disabled={isBatchDeleting === true}
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

            {/* Modals remain below */}
            {isLoading === true ? <div className="fixed inset-0 z-[200] bg-white/50 backdrop-blur-sm flex items-center justify-center">
                <ZLoader text="Syncing Nodes..." />
            </div> : null}
        </div >
    );
}
