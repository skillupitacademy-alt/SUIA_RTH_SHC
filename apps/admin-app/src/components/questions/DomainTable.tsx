'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { Globe, Plus, AlertTriangle, Check, Trash2 } from 'lucide-react';
import { ErrorBanner } from '@/components/layout/ErrorBanner';
import { ZLoader, ZPagination } from '@quiz/ui';
import { HierarchyFactoryWizard } from '@/components/content/HierarchyFactoryWizard';
import { DomainReviewCard } from './DomainReviewCard';
import { cn } from '@/lib/utils';
import { ZPortalModal } from '@/components/ui/ZPortalModal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X } from 'lucide-react';

export function DomainTable() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Batch Operation State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBatchDeleting, setIsBatchDeleting] = useState(false);

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
            const response = await apiClient.admin.getDomains(page, pageSize, debouncedSearch || undefined);
            setData(response.data);
            setTotalPages(response.totalPages);
            setTotalCount(response.total || response.data.length);
            setSelectedIds(new Set()); // Reset selection on refresh
        } catch (error) {
            console.error('Failed to fetch domains:', error);
            setErrorMessage('Connection Error: Unable to load the domain catalog at this time.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDomains();
    }, [page, pageSize, debouncedSearch]);

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
            // Select all currently visible
            const allIds = data.map(d => d.id);
            setSelectedIds(new Set(allIds));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleBatchDelete = async () => {
        if (selectedIds.size === 0) return;

        // If single item selected, use standard delete flow for better UX (optional, but consistent)
        if (selectedIds.size === 1) {
            const id = Array.from(selectedIds)[0];
            const item = data.find(d => d.id === id);
            if (item) {
                setCurrentDomain(item);
                setIsDeleteOpen(true);
                return;
            }
        }

        setIsBatchDeleting(true);
        try {
            await apiClient.admin.batchDeleteDomains(Array.from(selectedIds));
            setSelectedIds(new Set());
            fetchDomains();
        } catch (error) {
            console.error('Batch delete failed:', error);
            setErrorMessage('Batch Deletion Failed: Some domains could not be removed (they may have dependencies).');
        } finally {
            setIsBatchDeleting(false);
        }
    };

    // --- FORM LOGIC ---
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
        if (!currentDomain && selectedIds.size === 0) return;

        setIsSubmitting(true);
        try {
            if (selectedIds.size > 0 && !currentDomain) {
                // Should be handled by batch delete specific modal if we want one, 
                // but for now we reuse logic or just divert to batch function
                await apiClient.admin.batchDeleteDomains(Array.from(selectedIds));
                setSelectedIds(new Set());
            } else if (currentDomain) {
                await apiClient.admin.deleteDomain(currentDomain.id);
            }

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
        <div className="space-y-6 relative min-h-[750px] flex flex-col">
            <div className="flex-1">
                {errorMessage && (
                    <ErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} />
                )}

                {/* FLOATING COMMAND BAR */}
                <div className={cn(
                    "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 transition-all duration-300 border border-white/10",
                    selectedIds.size > 0 ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
                )}>
                    <div className="flex items-center gap-4 border-r border-white/10 pr-6">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Selection</span>
                            <span className="text-xl font-black">{selectedIds.size} <span className="text-sm font-bold text-white/60">domains</span></span>
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
                            className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Trash2 size={14} />
                            Delete Selection
                        </button>
                    </div>
                </div>

                {/* Standard Edit Form (Update Mode Only) */}
                <ZPortalModal isOpen={isFormOpen} zIndex={100}>
                    <div className="h-full flex flex-col">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tight">
                                        {currentDomain ? 'Edit Domain' : 'New Domain'}
                                    </h3>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">
                                        {currentDomain ? 'Modify Domain Details' : 'Create New Hierarchy Root'}
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

                        {/* Content - Landscape Grid */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="max-w-5xl mx-auto px-8 py-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Domain Name */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Domain Name</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Enter domain name..."
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                            />
                                        </div>

                                        {/* Category */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Category (Reporting Dimension)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., DevOps, Security, Frontend..."
                                                value={formData.category || ''}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Description</label>
                                        <textarea
                                            rows={4}
                                            placeholder="Brief summary of this domain..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none"
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
                                            disabled={isSubmitting}
                                            className="px-10 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
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

                {/* Factory Wizard Integration */}
                <HierarchyFactoryWizard
                    isOpen={isFactoryOpen}
                    onClose={() => setIsFactoryOpen(false)}
                    initialData={{ target: 'domain' }}
                    onSuccess={fetchDomains}
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
                                        ? `You are about to permanently delete ${selectedIds.size} domains. This action cannot be undone.`
                                        : `You are about to delete "${currentDomain?.name}". This action cannot be undone.`
                                    }
                                </AlertDialogDescription>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full pt-4">
                                <AlertDialogCancel className="rounded-xl border-2 border-slate-100 py-6 font-bold uppercase tracking-wider text-xs hover:bg-slate-50 hover:text-slate-800">
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
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
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-500 shadow-sm border border-blue-100">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div className="relative flex-1 max-w-md group">
                            <input
                                type="text"
                                placeholder="Search Domains..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-[11px] font-black tracking-widest text-[#1A1A1A] placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none border border-transparent shadow-inner"
                            />
                            {/* SELECT ALL CHECKBOX */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-100 cursor-pointer hover:border-blue-200 transition-all">
                                <input
                                    type="checkbox"
                                    checked={data.length > 0 && selectedIds.size === data.length}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-offset-0 focus:ring-0 cursor-pointer"
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
                            Add Domain
                        </button>
                    </div>
                </div>

                {/* DOMAIN CARD STACK */}
                {isLoading ? (
                    <div className="min-h-[400px] flex items-center justify-center">
                        <ZLoader text="Loading Domains..." />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {data.map((domain, index) => (
                            <DomainReviewCard
                                key={domain.id}
                                domain={domain}
                                index={index + (page - 1) * 20}
                                isSelected={selectedIds.has(domain.id)}
                                onSelect={handleSelect}
                                onDeleteRequest={(d) => { setCurrentDomain(d); setIsDeleteOpen(true); }}
                                onEditRequest={(d) => handleOpenForm(d)}
                            />
                        ))}
                        {data.length === 0 && (
                            <div className="text-center py-20 opacity-50">
                                <Globe className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                <h3 className="text-lg font-bold text-slate-500">No domains found</h3>
                            </div>
                        )}
                    </div>
                )}
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
