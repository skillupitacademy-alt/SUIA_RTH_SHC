'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { BookOpen, Plus, Edit2, Trash2, X, AlertTriangle, Layers, Globe, Hash, GitBranch, Clock, Settings, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatTimeAgo } from '@/lib/utils';
import { ErrorBanner } from '@/components/layout/ErrorBanner';
import { ZLoader } from '@/components/ui/ZLoader';
import { useDomains } from '@/hooks/useAdminHierarchy';
import { HierarchyFactoryWizard } from '@/components/content/HierarchyFactoryWizard';
import { SelectField } from '@/components/entry/SelectionFields';

export function SubjectTable() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Hierarchy data
    const domainsHook = useDomains();
    const domains = domainsHook.data;

    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFactoryOpen, setIsFactoryOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [currentSubject, setCurrentSubject] = useState<any>(null);
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
            const response = await apiClient.admin.getSubjects(page, 20, undefined, debouncedSearch || undefined);
            setData(response.data);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Failed to fetch subjects:', error);
            setErrorMessage('Connection Error: Unable to load subjects at this time.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, [page, debouncedSearch]);

    const handleOpenForm = (subject: any = null) => {
        if (subject) {
            setCurrentSubject(subject);
            setFormData({
                name: subject.name,
                domainId: subject.domainId || '',
                description: subject.description || '',
                status: subject.status || 'active',
                order: subject.order || 0
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
            setIsFactoryOpen(true);
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
        if (!formData.domainId) {
            setErrorMessage('Constraint violation: Parent domain selection required.');
            return;
        }
        setIsSubmitting(true);
        try {
            if (currentSubject) {
                await apiClient.admin.updateSubject(currentSubject.id, formData);
            } else {
                await apiClient.admin.createSubject(formData);
            }
            handleCloseForm();
            fetchSubjects();
        } catch (error) {
            console.error('Failed to save subject:', error);
            setErrorMessage('Saving Failed: Please ensure all fields (including parent domain) are correct.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!currentSubject) return;
        setIsSubmitting(true);
        try {
            await apiClient.admin.deleteSubject(currentSubject.id);
            setIsDeleteOpen(false);
            setCurrentSubject(null);
            fetchSubjects();
        } catch (error) {
            console.error('Failed to delete subject:', error);
            setErrorMessage('Deletion Blocked: This subject is currently linked to active topics and cannot be removed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {errorMessage && (
                <ErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} />
            )}

            {/* Standard Edit Form (Update Mode Only) */}
            {isFormOpen && currentSubject && (
                <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300">
                    <div className="h-full flex flex-col">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <BookOpen size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tight">Edit Subject</h3>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">Modify Subject Details</p>
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
                        <div className="flex-1">
                            <div className="max-w-5xl mx-auto px-8 py-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Parent Domain */}
                                        <SelectField
                                            label="Parent Domain"
                                            value={formData.domainId}
                                            options={domains.map(d => ({ id: d.id, name: d.name }))}
                                            loading={domainsHook.loading}
                                            onChange={(val) => setFormData({ ...formData, domainId: val })}
                                            placeholder="Select Domain"
                                            active={true}
                                            icon={<Globe size={12} />}
                                            hideCreate={true}
                                        />

                                        {/* Subject Name */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Subject Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-300"
                                                placeholder="e.g., Frontend Development"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-300 resize-none"
                                            placeholder="Brief summary of this subject..."
                                        />
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


            {/* Factory Wizard Integration */}
            <HierarchyFactoryWizard
                isOpen={isFactoryOpen}
                onClose={() => setIsFactoryOpen(false)}
                onSuccess={() => {
                    setIsFactoryOpen(false);
                    fetchSubjects();
                }}
                initialData={
                    formData.domainId
                        ? { target: 'subject', domainId: formData.domainId, domainName: domains.find(d => d.id === formData.domainId)?.name || '' }
                        : { target: 'subject' }
                }
            />

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
                                    You are about to delete the subject <strong className="text-red-600">"{currentSubject?.name}"</strong>. This action is irreversible and may impact child topics.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button
                                    onClick={() => { setIsDeleteOpen(false); setCurrentSubject(null); }}
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
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-500 shadow-sm border border-purple-100">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="relative flex-1 max-w-md group">
                        <input
                            type="text"
                            placeholder="Search Subjects..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-[11px] font-black tracking-widest text-[#1A1A1A] placeholder:text-slate-300 focus:ring-2 focus:ring-purple-500/10 transition-all outline-none border border-transparent shadow-inner"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenForm()}
                    className="ml-4 px-6 py-3 rounded-2xl bg-[#FF4B91] hover:bg-[#ff3382] text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#FF4B91]/20 transition-all flex items-center gap-3 active:scale-95"
                >
                    <Plus size={16} />
                    Add Subject
                </button>
            </div>

            <div className="rounded-[2.5rem] border border-primary/10 bg-white/50 backdrop-blur-xl overflow-hidden shadow-xl min-h-[400px] relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <ZLoader text="Loading Subject Records_" />
                    </div>
                )}
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-primary/5 bg-primary/5">
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground w-[30%]">Subject</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Domain</th>
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
                                        <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center">
                                            <BookOpen size={16} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#1A1A1A]">{item.name}</p>
                                            <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter truncate max-w-[200px]">{item.description || 'No context provided'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-2">
                                        <Layers size={12} className="text-slate-400" />
                                        <span className="text-[11px] font-bold text-slate-600">{item.domain?.name || 'Unlinked'}</span>
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
                                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-purple-500 hover:bg-purple-50 transition-all"
                                            title="Edit Subject"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => { setCurrentSubject(item); setIsDeleteOpen(true); }}
                                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                            title="Delete Subject"
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
                <div className="p-6 border-t border-primary/5 flex items-center justify-between bg-slate-50/50">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:text-[#FF4B91] transition-colors">Previous</button>
                    <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i + 1)}
                                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${page === i + 1 ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-slate-400 hover:text-[#1A1A1A]'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:text-[#FF4B91] transition-colors">Next</button>
                </div>
            </div>
        </div>
    );
}
