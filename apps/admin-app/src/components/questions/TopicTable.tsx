'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { Hash, Plus, Edit2, Trash2, X, AlertTriangle, BookOpen, Layers, Check, GitBranch, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatTimeAgo } from '@/lib/utils';
import { ErrorBanner } from '@/components/layout/ErrorBanner';
import { ZLoader } from '@/components/ui/ZLoader';
import { useDomains, useSubjects } from '@/hooks/useAdminHierarchy';
import { HierarchyFactoryWizard } from '@/components/content/HierarchyFactoryWizard';
import { SelectField } from '@/components/entry/SelectionFields';

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
    const [currentTopic, setCurrentTopic] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    return (
        <div className="space-y-4">
            {errorMessage && (
                <ErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} />
            )}

            {/* Factory WizardIntegration */}
            <HierarchyFactoryWizard
                isOpen={isFormOpen && !currentTopic}
                onClose={() => setIsFormOpen(false)}
                onSuccess={() => {
                    setIsFormOpen(false);
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
            {isFormOpen && currentTopic && (
                <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300">
                    <div className="h-full flex flex-col">
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

                        {/* Content - Centered with max-w-3xl */}
                        <div className="flex-1">
                            <div className="max-w-3xl mx-auto px-8 py-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Hierarchy Context (Read-Only) */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                                <Layers size={12} />
                                                Parent Domain
                                            </label>
                                            <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl">
                                                <p className="text-sm font-bold text-slate-700">{currentTopic.subject?.domain?.name || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                                <BookOpen size={12} />
                                                Parent Subject
                                            </label>
                                            <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl">
                                                <p className="text-sm font-bold text-slate-700">{currentTopic.subject?.name || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Topic Name */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Topic Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-300"
                                            placeholder="e.g., React Hooks"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-300 resize-none"
                                            placeholder="Brief summary of this topic..."
                                        />
                                    </div>

                                    {/* Reporting Dimensions */}
                                    <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Weight (Impact)</label>
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
                                            <p className="text-[9px] text-slate-400 font-medium italic">Higher weight = greater impact on subject mastery.</p>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Complexity</label>
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
                                            <p className="text-[9px] text-slate-400 font-medium italic">1 = Introductory, 10 = Advanced Research.</p>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Status</label>
                                        <div className="flex bg-white p-1.5 rounded-xl border border-slate-200">
                                            {['active', 'inactive'].map((status) => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, status: status as any })}
                                                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${formData.status === status
                                                        ? 'bg-[#1A1A1A] text-white shadow-sm'
                                                        : 'text-slate-400 hover:text-slate-600'
                                                        }`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
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
                </div>
            )}


            {/* Delete Confirmation Modal */}
            {isDeleteOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white border border-primary/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                <AlertTriangle size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#1A1A1A] italic uppercase tracking-tighter">Confirm Deletion</h3>
                                <p className="text-sm font-medium text-muted-foreground mt-2">
                                    You are about to delete the topic <strong className="text-red-600">"{currentTopic?.name}"</strong>. This action is irreversible and may impact child subtopics and questions.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button
                                    onClick={() => { setIsDeleteOpen(false); setCurrentTopic(null); }}
                                    className="px-6 py-4 rounded-2xl border-2 border-slate-100 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isSubmitting}
                                    className="px-6 py-4 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-[11px] font-black tracking-widest text-[#1A1A1A] placeholder:text-slate-300 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none border border-transparent shadow-inner"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenForm()}
                    className="ml-4 px-6 py-3 rounded-2xl bg-[#FF4B91] hover:bg-[#ff3382] text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#FF4B91]/20 transition-all flex items-center gap-3 active:scale-95"
                >
                    <Plus size={16} />
                    Add Topic
                </button>
            </div>

            <div className="rounded-[2.5rem] border border-primary/10 bg-white/50 backdrop-blur-xl overflow-hidden shadow-xl min-h-[400px] relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <ZLoader text="Loading Topic Records_" />
                    </div>
                )}
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-primary/5 bg-primary/5">
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground w-[30%]">Topic</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Hierarchy</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Created</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground text-right">Settings</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                        {data.map((item) => (
                            <tr key={item.id} className="group hover:bg-primary/5 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                                            <Hash size={16} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#1A1A1A]">{item.name}</p>
                                            <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter truncate max-w-[200px]">{item.description || 'No context provided'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <Layers size={10} className="text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{item.subject?.domain?.name || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BookOpen size={10} className="text-[#FF4B91]/40" />
                                            <span className="text-[11px] font-bold text-[#1A1A1A]">{item.subject?.name || 'Unlinked'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${item.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                                        }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="p-6 text-xs text-muted-foreground font-medium">
                                    {formatTimeAgo(item.createdAt)}
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleOpenForm(item)}
                                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                                            title="Edit Topic"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => { setCurrentTopic(item); setIsDeleteOpen(true); }}
                                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                            title="Delete Topic"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="p-6 border-t border-primary/5 flex items-center justify-between">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:text-[#FF4B91]">Previous</button>
                    <span className="text-xs font-bold text-muted-foreground">Page {page} of {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:text-[#FF4B91]">Next</button>
                </div>
            </div>
        </div>
    );
}
