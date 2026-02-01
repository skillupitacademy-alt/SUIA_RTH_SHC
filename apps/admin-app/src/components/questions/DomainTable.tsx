import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { Layers, Globe, Clock, Plus, Edit2, Trash2, X, AlertTriangle, Monitor, Shield, BookOpen, Hash, GitBranch, Check } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import { ErrorBanner } from '@/components/layout/ErrorBanner';
import { ZLoader } from '@/components/ui/ZLoader';
import { HierarchyFactoryWizard } from '@/components/content/HierarchyFactoryWizard';

export function DomainTable() {
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
    const [currentDomain, setCurrentDomain] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFactoryOpen, setIsFactoryOpen] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        description: '',
        status: 'active' as 'active' | 'inactive'
    });

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchDomains = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.admin.getDomains(page, 20, debouncedSearch || undefined);
            setData(response.data);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Failed to fetch domains:', error);
            setErrorMessage('Connection Error: Unable to load the domain catalog at this time.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDomains();
    }, [page, debouncedSearch]);

    const handleOpenForm = (domain: any = null) => {
        if (domain) {
            setCurrentDomain(domain);
            setFormData({
                name: domain.name,
                category: domain.category || '',
                description: domain.description || '',
                status: domain.status || 'active'
            });
        } else {
            setCurrentDomain(null);
            setFormData({
                name: '',
                category: '',
                description: '',
                status: 'active'
            });
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setErrorMessage(null);
        setCurrentDomain(null);
        setFormData({
            name: '',
            category: '',
            description: '',
            status: 'active'
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (currentDomain) {
                await apiClient.admin.updateDomain(currentDomain.id, formData);
            } else {
                await apiClient.admin.createDomain(formData);
            }
            handleCloseForm();
            fetchDomains();
        } catch (error) {
            console.error('Failed to save domain:', error);
            setErrorMessage('Saving Failed: Please ensure all fields are correct and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!currentDomain) return;
        setIsSubmitting(true);
        try {
            await apiClient.admin.deleteDomain(currentDomain.id);
            setIsDeleteOpen(false);
            setCurrentDomain(null);
            fetchDomains();
        } catch (error) {
            console.error('Failed to delete domain:', error);
            setErrorMessage('Deletion Blocked: This domain is currently linked to active subjects or topics and cannot be removed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {errorMessage && (
                <ErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} />
            )}

            {/* Standard Edit Form (Update Mode Only) - Restored to Executive White Full-Screen */}
            {isFormOpen && currentDomain && (
                <div className="fixed inset-0 z-[1000] bg-white animate-in slide-in-from-bottom-4 duration-500 overflow-hidden flex flex-col">
                    {/* Header Strip */}
                    <div className="px-12 py-6 border-b border-primary/5 flex items-center justify-between bg-white sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                                <Globe size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tighter italic">Edit Domain</h3>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">Global Architecture • Root Registry</p>
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
                    <div className="flex-1 overflow-y-auto bg-slate-50/30 p-12 custom-scrollbar">
                        <div className="max-w-3xl mx-auto space-y-8 bg-white border border-primary/10 rounded-[2.5rem] p-10 shadow-2xl shadow-primary/5 relative overflow-hidden">
                            {/* Inputs Section */}
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Domain Identity</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded-xl text-lg font-black text-[#1A1A1A] focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500/20 transition-all placeholder:text-slate-300"
                                            placeholder="Enter domain name..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Taxonomy Category</label>
                                            <input
                                                type="text"
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-[#1A1A1A] focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500/20 transition-all"
                                                placeholder="e.g. Technology"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Publication State</label>
                                            <div className="flex bg-slate-50 p-2 rounded-xl border border-slate-300">
                                                {['active', 'inactive'].map((status) => (
                                                    <button
                                                        key={status}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, status: status as any })}
                                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.status === status
                                                            ? 'bg-white text-[#1A1A1A] shadow-sm border border-slate-100 transform scale-[1.02]'
                                                            : 'text-slate-400 hover:text-slate-600'
                                                            }`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Structural Definition</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={5}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-300 rounded-xl text-[13px] font-medium text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500/20 transition-all placeholder:text-slate-300 resize-none leading-relaxed"
                                            placeholder="Provide technical definition for this domain..."
                                        />
                                    </div>
                                </div>

                                {/* Registry Metrics (Read-only context) */}
                                <div className="pt-8 border-t border-slate-100 p-6 bg-slate-50/50 rounded-2xl grid grid-cols-2 gap-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-blue-500 shadow-sm">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[#FF4B91]">Root Security</p>
                                            <p className="text-xs font-bold text-slate-600">Ancestral Node</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-blue-500 shadow-sm">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Creation Date</p>
                                            <p className="text-xs font-bold text-slate-600">{formatTimeAgo(currentDomain.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="pt-8 border-t border-slate-100 flex items-center justify-end gap-4 sticky bottom-0 bg-white z-10">
                                    <button
                                        type="button"
                                        onClick={handleCloseForm}
                                        className="px-8 py-4 rounded-2xl text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Discard Changes
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-12 py-4 rounded-2xl bg-[#1A1A1A] hover:bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10 transition-all flex items-center gap-3 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check size={18} />}
                                        {isSubmitting ? 'Syncing...' : 'Commit Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}


            {/* Delete Confirmation Modal */}
            {isDeleteOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white border border-primary/10 rounded-[2.5rem] p-8 max-md w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                <AlertTriangle size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#1A1A1A] italic uppercase tracking-tighter">Confirm Deletion</h3>
                                <p className="text-sm font-medium text-muted-foreground mt-2">
                                    You are about to delete the domain <strong className="text-red-600">"{currentDomain?.name}"</strong>. This action is irreversible and may impact child subjects.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button
                                    onClick={() => { setIsDeleteOpen(false); setCurrentDomain(null); }}
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
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-500 shadow-sm border border-blue-100">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div className="relative flex-1 max-w-md group">
                        <input
                            type="text"
                            placeholder="Search Domains..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-[11px] font-black tracking-widest text-[#1A1A1A] placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none border border-transparent shadow-inner"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setIsFactoryOpen(true)}
                    className="ml-4 px-6 py-3 rounded-2xl bg-[#FF4B91] hover:bg-[#ff3382] text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#FF4B91]/20 transition-all flex items-center gap-3 active:scale-95"
                >
                    <Plus size={16} />
                    Add Domain
                </button>
            </div>

            <div className="rounded-[2.5rem] border border-primary/10 bg-white/50 backdrop-blur-xl overflow-hidden shadow-xl min-h-[400px] relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <ZLoader text="Loading Domain Records_" />
                    </div>
                )}
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-primary/5 bg-primary/5">
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground w-[30%]">Domain</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Category</th>
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
                                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                                            <Globe size={16} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#1A1A1A]">{item.name}</p>
                                            <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter truncate max-w-[200px]">{item.description || 'No context provided'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 text-sm font-medium text-muted-foreground">
                                    <span className="text-[10px] font-black border border-slate-100 bg-slate-50 px-2 py-1 rounded-md uppercase text-slate-400">{item.category || 'GENERAL'}</span>
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
                                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                            title="Edit Domain"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => { setCurrentDomain(item); setIsDeleteOpen(true); }}
                                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                            title="Delete Domain"
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

            <HierarchyFactoryWizard
                isOpen={isFactoryOpen}
                onClose={() => setIsFactoryOpen(false)}
                initialData={{ target: 'domain' }}
                onSuccess={fetchDomains}
            />
        </div>
    );
}
