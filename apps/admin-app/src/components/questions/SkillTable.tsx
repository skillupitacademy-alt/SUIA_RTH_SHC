'use client';

import { apiClient } from '@quiz/api-client';
import { HierarchySearchBar, ZLoader, ZPagination, ZPortalModal } from '@quiz/ui';
import { Check, Cpu, Hash, Plus, Shield, Trash2, Zap } from 'lucide-react';
import { X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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
import { cn } from '@/lib/utils';
import type { Skill } from '@/types/domain';
import { clientLogger } from '@/utils/clientLogger';

import { SkillReviewCard } from './SkillReviewCard';

type SkillRow = Skill & {
    category?: string;
    mappingType?: 'conceptual' | 'technical' | 'practical';
    weight?: number;
};

type SkillForm = {
    name: string;
    category: string;
    mappingType: 'conceptual' | 'technical' | 'practical';
    weight: number;
    description: string;
};

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
    const [data, setData] = useState<SkillRow[]>([]);
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
    const [currentSkill, setCurrentSkill] = useState<SkillRow | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [formData, setFormData] = useState<SkillForm>({
        name: '',
        category: 'technical',
        mappingType: 'conceptual',
        weight: 1,
        description: ''
    });

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchSkills = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.admin.getSkills(page, pageSize, debouncedSearch || undefined);
            const skills: SkillRow[] = Array.isArray(response.data)
                ? (response.data as Skill[]).map((s) => ({
                    id: String(s.id),
                    name: s.name ?? '',
                    description: s.description ?? '',
                    category: (s as { category?: string }).category ?? 'technical',
                    mappingType: (s as { mappingType?: SkillRow['mappingType'] }).mappingType ?? 'conceptual',
                    weight: (s as { weight?: number }).weight ?? 1,
                    createdAt: s.createdAt,
                    updatedAt: s.updatedAt
                }) as SkillRow)
                : [];
            setData(skills);
            setTotalPages(response.totalPages);
            setTotalCount(response.total ?? skills.length);
            setSelectedIds(new Set());
        } catch (error) {
            clientLogger.error('Failed to fetch skills', { error: error instanceof Error ? error.message : 'unknown' });
            setErrorMessage('Connection Error: Unable to load skills at this time.');
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, page, pageSize]);

    useEffect(() => {
        void fetchSkills();
    }, [fetchSkills]);

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

    const handleBatchDelete = useCallback(async () => {
        if (selectedIds.size === 0) return;

        setIsBatchDeleting(true);
        try {
            await apiClient.admin.batchDeleteSkills(Array.from(selectedIds));
            setSelectedIds(new Set());
            void fetchSkills();
            setIsDeleteOpen(false);
            setCurrentSkill(null);
        } catch (error) {
            clientLogger.error('Batch delete skills failed', { error: error instanceof Error ? error.message : 'unknown' });
            setErrorMessage('Batch Deletion Failed: Some skills could not be removed.');
        } finally {
            setIsBatchDeleting(false);
        }
    }, [fetchSkills, selectedIds]);

    // --- FORM LOGIC ---
    const handleOpenForm = (skill: SkillRow | null = null) => {
        if (skill != null) {
            setCurrentSkill(skill);
            setFormData({
                name: skill.name,
                category: skill.category ?? 'technical',
                mappingType: skill.mappingType ?? 'conceptual',
                weight: (skill.weight != null && skill.weight !== 0) ? skill.weight : 1,
                description: skill.description ?? ''
            });
            setIsFormOpen(true);
        } else {
            setCurrentSkill(null);
            setFormData({
                name: '',
                category: 'technical',
                mappingType: 'conceptual',
                weight: 1,
                description: ''
            });
            setIsFormOpen(true);
        }
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setErrorMessage(null);
        setCurrentSkill(null);
        setFormData({
            name: '',
            category: 'technical',
            mappingType: 'conceptual',
            weight: 1,
            description: ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload: SkillForm = { ...formData, description: formData.description ?? '' };
            if (currentSkill !== null) {
                await apiClient.admin.updateSkill(currentSkill.id, payload);
            } else {
                await apiClient.admin.createSkill(payload);
            }
            handleCloseForm();
            void fetchSkills();
        } catch (error) {
            clientLogger.error('Failed to save skill', { error: error instanceof Error ? error.message : 'unknown' });
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
            clientLogger.error('Failed to delete skill', { error: error instanceof Error ? error.message : 'unknown' });
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
                            aria-label="Clear selected skills"
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => setIsDeleteOpen(true)}
                            disabled={isBatchDeleting}
                            className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-red-400 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all active:scale-95 flex items-center gap-2"
                            aria-label="Delete selected skills"
                        >
                            {isBatchDeleting ? <ZLoader size="xs" className="text-white" center={false} /> : <Trash2 size={14} />}
                            {isBatchDeleting ? 'Deleting...' : 'Delete Selection'}
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
                            <div className="w-full max-w-[1920px] mx-auto px-8 py-8">
                                <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6">
                                    {/* Row 1: Name and Weight */}
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Skill Name */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2" htmlFor="skill-name">Skill Name</label>
                                            <input
                                                required
                                                type="text"
                                                id="skill-name"
                                                placeholder="e.g., Problem Solving"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#FF4B91]/10"
                                            />
                                        </div>

                                        {/* Weight */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2" htmlFor="skill-weight">Weight (1-10)</label>
                                            <div className="flex items-center gap-4 px-4 py-3 bg-slate-50 rounded-2xl">
                                                <Zap size={16} className="text-amber-500" />
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    id="skill-weight"
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
                                            onChange={(val) => setFormData({ ...formData, mappingType: val as SkillForm['mappingType'] })}
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
                <HierarchySearchBar
                    value={searchQuery}
                    placeholder="Search Skills..."
                    onChange={(val: string) => { setSearchQuery(val); setPage(1); }}
                    onSelectAll={(checked: boolean) => handleSelectAll(checked)}
                    selectAllChecked={data.length > 0 && selectedIds.size === data.length}
                    leftIcon={<Shield className="w-5 h-5" />}
                    actions={(
                        <>
                            <button
                                onClick={() => setIsFactoryOpen(true)}
                                className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                                aria-label="Open skill bulk factory"
                            >
                                <Plus size={14} className="text-[#FF4B91]" />
                                Bulk Factory
                            </button>
                            <button
                                onClick={() => handleOpenForm()}
                                className="px-6 py-3 rounded-2xl bg-[#FF4B91] hover:bg-[#ff3382] text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-[#FF4B91]/20 transition-all flex items-center gap-3 active:scale-95"
                                aria-label="Add skill"
                            >
                                <Plus size={16} />
                                Add Skill
                            </button>
                        </>
                    )}
                />

                {/* SKILL CARD STACK */}
                {isLoading === true ? (
                    <div className="min-h-[400px] flex items-center justify-center">
                        <ZLoader text="Loading Skills..." />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {data.map((skill, index) => {
                            const normalized: SkillRow = {
                                ...skill,
                                category: skill.category ?? 'technical',
                                mappingType: skill.mappingType ?? 'conceptual',
                                weight: skill.weight ?? 1
                            };
                            return (
                                <SkillReviewCard
                                    key={skill.id}
                                    skill={normalized}
                                    index={index + (page - 1) * pageSize}
                                    isSelected={selectedIds.has(skill.id)}
                                    onSelect={handleSelect}
                                    onDeleteRequest={(d) => { setCurrentSkill({
                                        ...normalized,
                                        category: d.category ?? normalized.category,
                                        mappingType: d.mappingType ?? normalized.mappingType,
                                        weight: d.weight ?? normalized.weight
                                    }); setIsDeleteOpen(true); }}
                                    onEditRequest={(d) => handleOpenForm({
                                        ...normalized,
                                        category: d.category ?? normalized.category,
                                        mappingType: d.mappingType ?? normalized.mappingType,
                                        weight: d.weight ?? normalized.weight
                                    })}
                                />
                            );
                        })}
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
