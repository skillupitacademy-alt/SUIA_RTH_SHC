'use client';

import { useEffect, useState } from 'react';
import { Hash, Plus, Edit2, Trash2, X, AlertTriangle, BookOpen, Layers, Check, GitBranch, Clock, LayoutGrid, Target, Trash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatTimeAgo, cn } from '@/lib/utils';
import { ErrorBanner } from '@/components/layout/ErrorBanner';
import { ZLoader } from '@/components/ui/ZLoader';
import { useDomains, useSubjects } from '@/hooks/useAdminHierarchy';
import { HierarchyFactoryWizard } from '@/components/content/HierarchyFactoryWizard';
import { SelectField } from '@/components/entry/SelectionFields';
import { TopicReviewCard } from './TopicReviewCard';
import { ZPortalModal } from '@/components/ui/ZPortalModal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { apiClient } from '@quiz/api-client';

export function TopicTable() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);


    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isFactoryOpen, setIsFactoryOpen] = useState(false);
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
            const response = await apiClient.admin.getTopics(page, 20, undefined, debouncedSearch || undefined);
            setData(response.data);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Failed to fetch topics:', error);
            setErrorMessage('Connection Error: Unable to load topics at this time.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTopics();
    }, [page, debouncedSearch]);

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
        if (!currentTopic) return;
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
        <div className="space-y-4">
            {errorMessage && (
                <ErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} />
            )}

            {/* Factory WizardIntegration */}
            <HierarchyFactoryWizard
                isOpen={isFactoryOpen}
                onClose={() => setIsFactoryOpen(false)}
                onSuccess={() => {
                    setIsFactoryOpen(false);
                    fetchTopics();
                }}
                initialData={
                    formData.subjectId
                        ? {
                            target: 'topic',
                            domainId: formData.domainId,
                            subjectId: formData.subjectId,
                            subjectName: subjects.find(s => s.id === formData.subjectId)?.name || ''
                        }
                        : { target: 'topic' }
                }
            />

            {/* Standard Edit Form (Update Mode Only) - Full Screen */}
            <ZPortalModal isOpen={isFormOpen && !!currentTopic} zIndex={100}>
                <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                <Edit2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tight">Edit Topic</h3>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">Modify Topic Details</p>
                            </div>
                        </div>
                        <button
                            onClick={handleCloseForm}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content - Landscape Grid */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-5xl mx-auto px-8 py-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Row 1: Hierarchy Context (Read-Only) */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                            <Layers size={12} />
                                            Parent Domain
                                        </label>
                                        <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl">
                                            <p className="text-sm font-bold text-slate-700">{currentTopic?.subject?.domain?.name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                            <BookOpen size={12} />
                                            Parent Subject
                                        </label>
                                        <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl">
                                            <p className="text-sm font-bold text-slate-700">{currentTopic?.subject?.name || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Name & Status */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Topic Name */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Topic Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                                            placeholder="e.g., React Hooks"
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
                                                    onClick={() => setFormData({ ...formData, status: status as any })}
                                                    className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${formData.status === status
                                                        ? 'bg-[#1A1A1A] text-white shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-600'
                                                        }`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Row 3: Reporting Dimensions */}
                                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Weight (Impact)</label>
                                            <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">{formData.weight || 1}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            step="1"
                                            value={formData.weight || 1}
                                            onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                        />
                                        <p className="text-[9px] text-slate-500 font-medium italic">Higher weight = greater impact on subject mastery.</p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Complexity</label>
                                            <span className="text-xs font-black text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">{formData.complexityLevel || 1}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            step="1"
                                            value={formData.complexityLevel || 1}
                                            onChange={(e) => setFormData({ ...formData, complexityLevel: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
                                        />
                                        <p className="text-[9px] text-slate-500 font-medium italic">1 = Introductory, 10 = Advanced Research.</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400 resize-none"
                                        placeholder="Brief summary of this topic..."
                                    />
                                </div>


                                {/* Hierarchy Reassignment (Caution) */}
                                <div className="pt-6 border-t border-slate-200">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-[#FF4B91] mb-4 flex items-center gap-2">
                                        <AlertTriangle size={14} />
                                        Move Hierarchy (Caution)
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <SelectField
                                            label="Domain"
                                            value={formData.domainId}
                                            options={domains.map(d => ({ id: d.id, name: d.name }))}
                                            loading={domainsHook.loading}
                                            onChange={handleDomainChange}
                                            placeholder="Change Domain"
                                            active={false}
                                            hideCreate={true}
                                        />
                                        <SelectField
                                            label="Subject"
                                            value={formData.subjectId}
                                            options={subjects.map(s => ({ id: s.id, name: s.name }))}
                                            loading={subjectsHook.loading}
                                            disabled={!formData.domainId}
                                            onChange={(id) => setFormData({ ...formData, subjectId: id })}
                                            placeholder="Change Subject"
                                            active={false}
                                            hideCreate={true}
                                        />
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="pt-8 flex items-center justify-end gap-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseForm}
                                        className="px-8 py-3 rounded-xl text-slate-600 font-bold uppercase tracking-widest text-xs hover:bg-slate-100 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-10 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <ZLoader size="xs" className="text-white" center={false} /> : <Check size={16} />}
                                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </ZPortalModal>


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
                                {currentTopic ? (
                                    <>You are about to delete the topic <strong className="text-red-600">"{currentTopic.name}"</strong>. This action is irreversible and may impact child subtopics and questions.</>
                                ) : (
                                    <>You are about to delete <strong className="text-red-600">{selectedIds.size} topics</strong> and all their nested content. This cannot be undone.</>
                                )}
                            </AlertDialogDescription>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full pt-4">
                            <AlertDialogCancel
                                onClick={() => { setIsDeleteOpen(false); setCurrentTopic(null); }}
                                className="rounded-xl border-2 border-slate-100 py-6 font-bold uppercase tracking-wider text-xs hover:bg-slate-50 hover:text-slate-800"
                            >
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={currentTopic ? handleDelete : handleBatchDelete}
                                className="rounded-xl bg-red-600 py-6 font-black uppercase tracking-wider text-xs hover:bg-red-700 shadow-xl shadow-red-500/20 text-white"
                                disabled={isSubmitting || isBatchDeleting}
                            >
                                {isSubmitting || isBatchDeleting ? 'Processing...' : 'Delete Forever'}
                            </AlertDialogAction>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* Search Bar & Add Button */}
            <div className="bg-white/50 backdrop-blur-xl border border-primary/10 p-6 rounded-[2rem] shadow-xl relative overflow-hidden flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 rounded-xl bg-orange-50 text-orange-500 shadow-sm border border-orange-100">
                        <Hash className="w-5 h-5" />
                    </div>
                    <div className="relative flex-1 max-w-md group">
                        <input
                            type="text"
                            placeholder="Search Topics..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-[11px] font-black tracking-widest text-[#1A1A1A] placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none border border-transparent shadow-inner"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
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
                    {data.length > 0 && (
                        <button
                            onClick={toggleSelectAll}
                            className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                            {selectedIds.size === data.length ? 'Deselect All' : 'Select All'}
                        </button>
                    )}
                    <button
                        onClick={() => handleOpenForm()}
                        className="px-6 py-3 rounded-2xl bg-[#FF4B91] hover:bg-[#ff3382] text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-[#FF4B91]/20 transition-all flex items-center gap-3 active:scale-95"
                    >
                        <Plus size={16} />
                        Add Topic
                    </button>
                </div>
            </div>

            <div className="min-h-[400px] relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-[2.5rem]">
                        <ZLoader text="Loading Topic Records_" />
                    </div>
                )}

                <div className="space-y-6">
                    {data.length === 0 && !isLoading ? (
                        <div className="bg-white border border-dashed border-slate-200 rounded-[2.5rem] p-20 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-6">
                                <LayoutGrid size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase italic">No Topics Found</h3>
                            <p className="text-sm text-slate-500 mt-2 max-w-xs">Try adjusting your search or use the Factory to seed new hierarchy nodes.</p>
                        </div>
                    ) : (
                        data.map((item, idx) => (
                            <TopicReviewCard
                                key={item.id}
                                topic={item}
                                index={(page - 1) * 20 + idx}
                                isSelected={selectedIds.has(item.id)}
                                onSelect={toggleSelect}
                                onEditRequest={handleOpenForm}
                                onDeleteRequest={(t) => { setCurrentTopic(t); setIsDeleteOpen(true); }}
                            />
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8 p-6 bg-white/50 backdrop-blur-xl border border-primary/10 rounded-[2rem] flex items-center justify-between shadow-sm">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-slate-100 transition-all">Previous</button>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i + 1)}
                                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${page === i + 1 ? 'bg-slate-900 text-white shadow-lg scale-110' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-slate-100 transition-all">Next</button>
                    </div>
                )}

                {/* Floating Command Bar */}
                {selectedIds.size > 0 && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500">
                        <div className="bg-slate-900 text-white rounded-3xl px-8 py-4 shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl bg-opacity-95">
                            <div className="flex items-center gap-4 border-r border-white/10 pr-8">
                                <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black italic shadow-lg shadow-orange-500/20">
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
                                    disabled={isBatchDeleting}
                                    className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all group disabled:opacity-50"
                                >
                                    {isBatchDeleting ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Trash size={16} className="transition-transform group-hover:scale-110" />
                                    )}
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {isBatchDeleting ? 'Executing...' : 'Perm-Delete Batch'}
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
        </div >
    );
}
