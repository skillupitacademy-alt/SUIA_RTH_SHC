'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useDomains, useSubjects, useTopics, useSubtopics, useAllSkills, useTopicSkills } from '@/hooks/useAdminHierarchy';
import { X, Loader2, Sparkles, Binary } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SelectField, MultiSelectField } from './SelectionFields';

export interface Selection {
    domainId: string | null;
    subjectId: string | null;
    topicId: string | null;
    subtopicId: string | null;
    skillIds: string[];
    // Extended metadata for UI
    domainName?: string;
    subjectName?: string;
    topicName?: string;
    subtopicName?: string;
}

interface CascadingSelectProps {
    onChange: (selection: Selection) => void;
    value?: Selection;
    hideSkills?: boolean;
}

export function CascadingSelect({ onChange, value, hideSkills }: CascadingSelectProps) {
    // Local state only used if 'value' prop is NOT provided (uncontrolled mode)
    const [localSelection, setLocalSelection] = useState<Selection>({
        domainId: '',
        subjectId: '',
        topicId: '',
        subtopicId: '',
        skillIds: [],
    });

    // Effective selection is either the prop (controlled) or local state (uncontrolled)
    const selection = useMemo(() => value || localSelection, [value, localSelection]);

    // Hierarchy Hooks respond to the effective selection
    const domains = useDomains();
    const subjects = useSubjects(selection.domainId || undefined);
    const topics = useTopics(selection.subjectId || undefined);
    const subtopics = useSubtopics(selection.topicId || undefined);
    const allSkills = useAllSkills();
    const topicSkills = useTopicSkills(selection.topicId || undefined);

    // Effective skills: if a topic is selected, try topic-specific skills, 
    // but ALWAYS fallback to allSkills if topic has no mappings OR no topic is selected.
    const skills = useMemo(() => {
        if (selection.topicId && topicSkills.data && topicSkills.data.length > 0) {
            return topicSkills;
        }
        return allSkills;
    }, [selection.topicId, topicSkills, allSkills]);


    const handleChange = (level: keyof Selection, val: any) => {
        const next = { ...selection };
        // @ts-ignore
        next[level] = val;

        // Lookup Name Logic
        if (level === 'domainId') {
            const item = domains.data.find((d: any) => d.id === val);
            next.domainName = item?.name;
            // Reset children
            next.subjectId = null; next.subjectName = undefined;
            next.topicId = null; next.topicName = undefined;
            next.subtopicId = null; next.subtopicName = undefined;
        } else if (level === 'subjectId') {
            const item = subjects.data.find((s: any) => s.id === val);
            next.subjectName = item?.name;
            // Reset children
            next.topicId = null; next.topicName = undefined;
            next.subtopicId = null; next.subtopicName = undefined;
        } else if (level === 'topicId') {
            const item = topics.data.find((t: any) => t.id === val);
            next.topicName = item?.name;
            // Reset children
            next.subtopicId = null; next.subtopicName = undefined;
            next.skillIds = [];
        } else if (level === 'subtopicId') {
            const item = subtopics.data.find((s: any) => s.id === val);
            next.subtopicName = item?.name;
        }

        // Update local state if uncontrolled
        if (!value) {
            setLocalSelection(next);
        }

        // Notify parent of the change
        onChange(next);
    };

    const [modalConfig, setModalConfig] = useState<{
        type: 'domain' | 'subject' | 'topic' | 'subtopic' | null;
        isOpen: boolean;
    }>({ type: null, isOpen: false });

    const openCreateModal = (type: 'domain' | 'subject' | 'topic' | 'subtopic') => {
        setModalConfig({ type, isOpen: true });
    };

    const handleCreateSuccess = (newId: string) => {
        handleChange(modalConfig.type ? `${modalConfig.type}Id` as keyof Selection : 'domainId', newId);
        setModalConfig({ type: null, isOpen: false });
    };

    return (
        <div className="space-y-4 p-6 rounded-2xl border border-white/40 bg-white/60 backdrop-blur-2xl shadow-xl relative overflow-hidden group">
            {/* Ambient Background Glow (Subtle Light Mode) */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FF4B91]/5 rounded-full blur-[100px] -z-10 group-hover:bg-[#FF4B91]/10 transition-all duration-700" />

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-1 bg-[#FF4B91] rounded-full shadow-[0_0_15px_rgba(255,75,145,0.5)]" />
                    <h3 className="text-lg font-black text-[#1A1A1A] tracking-tight uppercase">Target Hierarchy</h3>
                </div>
                {/* Visual state indicator for debugging */}
                {value && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                        <Binary className="w-3 h-3 text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Active Session</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                {/* DOMAIN */}
                <SelectField
                    label="Domain"
                    value={selection.domainId}
                    options={domains.data}
                    loading={domains.loading}
                    onChange={(id) => handleChange('domainId', id)}
                    onCreate={() => openCreateModal('domain')}
                    placeholder="Select Domain"
                    active={true}
                />

                {/* SUBJECT */}
                <SelectField
                    label="Subject"
                    value={selection.subjectId}
                    options={subjects.data}
                    loading={subjects.loading}
                    disabled={!selection.domainId}
                    onChange={(id) => handleChange('subjectId', id)}
                    onCreate={() => openCreateModal('subject')}
                    placeholder="Select Subject"
                    active={!!selection.domainId}
                />

                {/* TOPIC */}
                <SelectField
                    label="Topic"
                    value={selection.topicId}
                    options={topics.data}
                    loading={topics.loading}
                    disabled={!selection.subjectId}
                    onChange={(id) => handleChange('topicId', id)}
                    onCreate={() => openCreateModal('topic')}
                    placeholder="Select Topic"
                    active={!!selection.subjectId}
                />

                {/* SUBTOPIC & SKILLS CONTAINER */}
                <div className={cn(
                    "grid gap-6 md:col-span-2",
                    hideSkills ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
                )}>
                    {/* SUBTOPIC */}
                    <SelectField
                        label="Subtopic (Component)"
                        value={selection.subtopicId}
                        options={subtopics.data}
                        loading={subtopics.loading}
                        disabled={!selection.topicId}
                        onChange={(id) => handleChange('subtopicId', id)}
                        onCreate={() => openCreateModal('subtopic')}
                        placeholder="Select Subtopic"
                        active={!!selection.topicId}
                    />

                    {/* MAPPED SKILLS (MULTI-SELECT) */}
                    {!hideSkills && (
                        <MultiSelectField
                            label="Mapped Skills (Assessment Focus)"
                            values={selection.skillIds || []}
                            options={skills.data}
                            loading={skills.loading}
                            onChange={(ids) => handleChange('skillIds', ids)}
                            placeholder="Select Skills (Global)"
                            active={true}
                            icon={<Sparkles className="w-3 h-3 text-[#FF4B91]" />}
                        />
                    )}
                </div>
            </div>

            {/* Quick Create Modal */}
            {modalConfig.isOpen && modalConfig.type && (
                <QuickCreateModal
                    type={modalConfig.type}
                    onClose={() => setModalConfig({ type: null, isOpen: false })}
                    onSuccess={handleCreateSuccess}
                    parentId={
                        modalConfig.type === 'subject' ? selection.domainId! :
                            modalConfig.type === 'topic' ? selection.subjectId! :
                                modalConfig.type === 'subtopic' ? selection.topicId! : undefined
                    }
                    hooks={{ domains, subjects, topics, subtopics }}
                />
            )}
        </div>
    );
}

// --- MODAL ---

function QuickCreateModal({ type, onClose, onSuccess, parentId, hooks }: any) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            let res;
            if (type === 'domain') res = await hooks.domains.create({ name, category: 'General', description: 'Created via Quick Add', status: 'active' });
            else if (type === 'subject') res = await hooks.subjects.create({ name, description: 'Created via Quick Add', status: 'active' });
            else if (type === 'topic') res = await hooks.topics.create({ name, complexityLevel: 1, weight: 1.0, status: 'active' });
            else if (type === 'subtopic') res = await hooks.subtopics.create({ name, description: 'Created via Quick Add', status: 'active' });

            onSuccess(res.id);
        } catch (err: any) {
            setError(err.message || 'Failed to create');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white border border-white/20 rounded-[2rem] shadow-2xl p-8 relative overflow-hidden">
                {/* Glows */}
                <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[#FF4B91]/5 rounded-full blur-[60px] -z-10" />

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF4B91]">Quick Add</span>
                        <h2 className="text-2xl font-black text-[#1A1A1A] capitalize mt-1">New {type}</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Name</label>
                        <input
                            type="text"
                            required
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[#1A1A1A] font-medium focus:border-[#FF4B91] focus:ring-2 focus:ring-[#FF4B91]/10 outline-none transition-all placeholder:text-slate-400"
                            placeholder={`Enter ${type} name...`}
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-[#1A1A1A] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="flex items-center gap-2 px-6 py-3 bg-[#FF4B91] hover:bg-[#ff3382] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#FF4B91]/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                            Create {type}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CascadingSelect;
