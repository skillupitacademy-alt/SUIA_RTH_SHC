'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import { apiClient } from '@quiz/api-client';
import { ZLoader, ZPagination } from '@quiz/ui';
import { Check, Cpu, Hash, Plus, Shield, Trash2, Zap } from 'lucide-react';
import { X } from 'lucide-react';
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
import { cn } from '@/lib/utils';

import { SkillReviewCard } from './SkillReviewCard';

const SKILL_CATEGORIES: Record<string, string> = {
    problem_solving: 'Problem Solving',
    code_debugging: 'Code Debugging',
    api_design: 'API Design',
    data_analysis: 'Data Analysis',
    system_design: 'System Design',
    security_awareness: 'Security Awareness',
    performance_optimization: 'Performance Optimization',
    testing_qa: 'Testing & QA',
    version_control: 'Version Control',
    agile_methodology: 'Agile Methodology',
    technical: 'Technical',
    conceptual: 'Conceptual',
    practical: 'Practical'
};

export function SkillTable() {
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
    const [isFactoryOpen, setIsFactoryOpen] = useState(false);
    const [currentSkill, setCurrentSkill] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        category: 'technical',
        mappingType: 'conceptual' as 'conceptual' | 'technical' | 'practical',
        weight: 1
    });

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchSkills = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.admin.getSkills(page, pageSize, debouncedSearch || undefined);
            setData(response.data);
            setTotalPages(response.totalPages);
            setTotalCount(response.total || response.data.length);
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Failed to fetch skills:', error);
            setErrorMessage('Connection Error: Unable to load skills at this time.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchSkills();
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
            const allIds = data.map(d => d.id);
            setSelectedIds(new Set(allIds));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleBatchDelete = async () => {
        if (selectedIds.size === 0) return;

        setIsBatchDeleting(true);
        try {
            await apiClient.admin.batchDeleteSkills(Array.from(selectedIds));
            setSelectedIds(new Set());
            void fetchSkills();
            setIsDeleteOpen(false);
            setCurrentSkill(null);
        } catch (error) {
            console.error('Batch delete failed:', error);
            setErrorMessage('Batch Deletion Failed: Some skills could not be removed.');
        } finally {
            setIsBatchDeleting(false);
        }
    };

    // --- FORM LOGIC ---
    const handleOpenForm = (skill: any = null) => {
        if (skill !== null) {
            setCurrentSkill(skill);
            setFormData({
                name: skill.name,
                category: skill.category || '',
                mappingType: skill.mappingType || 'conceptual',
                weight: skill.weight || 1
            });
        } else {
            setCurrentSkill(null);
            setFormData({
                name: '',
                category: 'technical',
                mappingType: 'conceptual',
                weight: 1
            });
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setErrorMessage(null);
        setCurrentSkill(null);
        setFormData({
            name: '',
            category: 'technical',
            mappingType: 'conceptual',
            weight: 1
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (currentSkill !== null) {
                await apiClient.admin.updateSkill(currentSkill.id, formData);
            } else {
                await apiClient.admin.createSkill(formData);
            }
            handleCloseForm();
            void fetchSkills();
        } catch (error) {
            console.error('Failed to save skill:', error);
            setErrorMessage('Saving Failed: Please ensure the skill name is unique and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (selectedIds.size > 0 && (currentSkill === null || selectedIds.size > 1)) {
            await handleBatchDelete();
            return;
        }

        if (currentSkill === null) return;
        setIsSubmitting(true);
        try {
            await apiClient.admin.deleteSkill(currentSkill.id);
            setIsDeleteOpen(false);
            setCurrentSkill(null);
            void fetchSkills();
        } catch (error) {
            console.error('Failed to delete skill:', error);
            setErrorMessage('Deletion Blocked: This skill is currently assigned to questions and cannot be removed.');
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
                            <span className="text-xl font-black">{selectedIds.size} <span className="text-sm font-bold text-white/60">skills</span></span>
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

                {/* Form Modal */}
                <ZPortalModal isOpen={isFormOpen} zIndex={100}>
                    <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300">
                        <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tight">
                                        {currentSkill !== null ? 'Edit Skill' : 'New Skill'}
                                    </h3>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">
                                        {currentSkill !== null ? 'Update Skill Definition' : 'Define New Skill Node'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={handleCloseForm} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="max-w-4xl mx-auto px-8 py-8">
                                <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6">
                                    {/* Row 1: Name and Weight */}
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Skill Name */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Skill Name</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="e.g., Problem Solving"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#FF4B91]/10"
                                            />
                                        </div>

                                        {/* Weight */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Weight (1-10)</label>
                                            <div className="flex items-center gap-4 px-4 py-3 bg-slate-50 rounded-2xl">
                                                <Zap size={16} className="text-amber-500" />
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    value={formData.weight || 1}
                                                    onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                                                    className="flex-1 accent-[#FF4B91] h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <span className="text-sm font-black text-slate-700 w-6 text-center">{formData.weight || 1}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 2: Category and Mapping */}
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Category */}
                                        <SelectField
                                            label="Category Hierarchy"
                                            value={formData.category}
                                            options={[
                                                ...Object.entries(SKILL_CATEGORIES).map(([id, name]) => ({ id, name }))
                                            ]}
                                            loading={false}
                                            onChange={(val) => setFormData({ ...formData, category: val })}
                                            placeholder="Select Category"
                                            active={true}
                                            icon={<Hash size={12} />}
                                            hideCreate={true}
                                        />

                                        {/* Mapping Type */}
                                        <SelectField
                                            label="Mapping"
                                            value={formData.mappingType}
                                            options={[
                                                { id: 'conceptual', name: 'Conceptual' },
                                                { id: 'technical', name: 'Technical' },
                                                { id: 'practical', name: 'Practical' }
                                            ]}
                                            loading={false}
                                            onChange={(val) => setFormData({ ...formData, mappingType: val as any })}
                                            placeholder="Select Mapping"
                                            active={false}
                                            icon={<Cpu size={12} />}
                                            hideCreate={true}
                                        />
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={handleCloseForm}
                                            className="px-6 py-3 rounded-xl text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-8 py-3 rounded-xl bg-[#1A1A1A] text-white font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
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

                <HierarchyFactoryWizard
                    isOpen={isFactoryOpen}
                    onClose={() => setIsFactoryOpen(false)}
                    initialData={{ target: 'skill' }}
                    onSuccess={() => { void fetchSkills(); }}
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
                                        ? `You are about to permanently delete ${selectedIds.size} skills. This action cannot be undone.`
                                        : `You are about to delete "${currentSkill?.name ?? 'selected skill'}". This action cannot be undone.`
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
                        <div className="p-2 rounded-xl bg-cyan-50 text-cyan-500 shadow-sm border border-cyan-100">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div className="relative flex-1 max-w-md group">
                            <input
                                type="text"
                                placeholder="Search Skills..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-[11px] font-black tracking-widest text-[#1A1A1A] placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/10 transition-all outline-none border border-transparent shadow-inner"
                            />
                            {/* SELECT ALL CHECKBOX */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-100 cursor-pointer hover:border-cyan-200 transition-all">
                                <input
                                    type="checkbox"
                                    checked={data.length > 0 && selectedIds.size === data.length}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-offset-0 focus:ring-0 cursor-pointer"
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
                            onClick={() => handleOpenForm()}
                            className="px-6 py-3 rounded-2xl bg-[#FF4B91] hover:bg-[#ff3382] text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-[#FF4B91]/20 transition-all flex items-center gap-3 active:scale-95"
                        >
                            <Plus size={16} />
                            Add Skill
                        </button>
                    </div>
                </div>

                {/* SKILL CARD STACK */}
                {isLoading === true ? (
                    <div className="min-h-[400px] flex items-center justify-center">
                        <ZLoader text="Loading Skills..." />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {data.map((skill, index) => (
                            <SkillReviewCard
                                key={skill.id}
                                skill={skill}
                                index={index + (page - 1) * 20}
                                isSelected={selectedIds.has(skill.id)}
                                onSelect={handleSelect}
                                onDeleteRequest={(d) => { setCurrentSkill(d); setIsDeleteOpen(true); }}
                                onEditRequest={(d) => handleOpenForm(d)}
                            />
                        ))}
                        {data.length === 0 && (
                            <div className="text-center py-20 opacity-50">
                                <Shield className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                <h3 className="text-lg font-bold text-slate-500">No skills found</h3>
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
