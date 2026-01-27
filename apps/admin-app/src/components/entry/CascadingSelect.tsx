'use client';

import { useState, useEffect } from 'react';
import { useDomains, useSubjects, useTopics, useSubtopics } from '@/hooks/useAdminHierarchy';
import { ChevronDown, Plus, X, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Selection {
    domainId: string | null;
    subjectId: string | null;
    topicId: string | null;
    subtopicId: string | null;
}

interface CascadingSelectProps {
    onChange: (selection: Selection) => void;
    value?: Selection;
}

export function CascadingSelect({ onChange, value }: CascadingSelectProps) {
    const [selection, setSelection] = useState<Selection>({
        domainId: null,
        subjectId: null,
        topicId: null,
        subtopicId: null,
    });

    const [modalConfig, setModalConfig] = useState<{
        type: 'domain' | 'subject' | 'topic' | 'subtopic' | null;
        isOpen: boolean;
    }>({ type: null, isOpen: false });

    // Hierarchy Hooks
    const domains = useDomains();
    const subjects = useSubjects(selection.domainId || undefined);
    const topics = useTopics(selection.subjectId || undefined);
    const subtopics = useSubtopics(selection.topicId || undefined);

    useEffect(() => {
        onChange(selection);
    }, [selection, onChange]);

    // Support external reset
    useEffect(() => {
        if (value && (
            value.domainId === '' ||
            value.subjectId === '' ||
            value.topicId === '' ||
            value.subtopicId === ''
        )) {
            if (!value.domainId && !value.subjectId && !value.topicId && !value.subtopicId) {
                setSelection({ domainId: null, subjectId: null, topicId: null, subtopicId: null });
            }
        }
    }, [value]);

    const handleChange = (level: keyof Selection, id: string) => {
        setSelection(prev => {
            const next = { ...prev };
            next[level] = id;

            // Reset children
            if (level === 'domainId') {
                next.subjectId = null;
                next.topicId = null;
                next.subtopicId = null;
            } else if (level === 'subjectId') {
                next.topicId = null;
                next.subtopicId = null;
            } else if (level === 'topicId') {
                next.subtopicId = null;
            }
            return next;
        });
    };

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

            <div className="flex items-center gap-3 mb-4">
                <div className="h-6 w-1 bg-[#FF4B91] rounded-full shadow-[0_0_15px_rgba(255,75,145,0.5)]" />
                <h3 className="text-lg font-black text-[#1A1A1A] tracking-tight uppercase">Target Hierarchy</h3>
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
                    active={true} // Always active
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

                {/* SUBTOPIC */}
                <SelectField
                    label="Subtopic (Skill)"
                    value={selection.subtopicId}
                    options={subtopics.data}
                    loading={subtopics.loading}
                    disabled={!selection.topicId}
                    onChange={(id) => handleChange('subtopicId', id)}
                    onCreate={() => openCreateModal('subtopic')}
                    placeholder="Select Subtopic"
                    active={!!selection.topicId}
                />
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

// --- SUB COMPONENTS ---

interface SelectFieldProps {
    label: string;
    value: string | null;
    options: any[];
    loading: boolean;
    disabled?: boolean;
    onChange: (id: string) => void;
    onCreate: () => void;
    placeholder: string;
    active?: boolean;
}

function SelectField({ label, value, options, loading, disabled, onChange, onCreate, placeholder, active }: SelectFieldProps) {
    return (
        <div className={cn("flex flex-col gap-2 transition-opacity duration-300", disabled && "opacity-50 grayscale")}>
            <label className={cn(
                "text-[9px] font-black uppercase tracking-[0.2em] transition-colors",
                active ? "text-[#FF4B91]" : "text-slate-400"
            )}>
                {label}
            </label>
            <div className="flex gap-2">
                <div className="relative flex-1 group/input">
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={cn(
                            "w-full h-10 pl-3 pr-8 bg-white/50 border rounded-xl text-[#1A1A1A] font-bold text-xs focus:outline-none transition-all appearance-none cursor-pointer backdrop-blur-md shadow-sm",
                            "hover:bg-white/80",
                            active
                                ? "border-[#FF4B91]/30 focus:border-[#FF4B91] focus:ring-2 focus:ring-[#FF4B91]/10"
                                : "border-slate-200"
                        )}
                        disabled={disabled}
                    >
                        <option value="" disabled className="text-slate-400">{loading ? 'Loading...' : placeholder}</option>
                        {options.map((opt) => (
                            <option key={opt.id} value={opt.id} className="bg-white text-slate-800 font-medium">
                                {opt.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 transition-colors group-hover/input:text-[#FF4B91]">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
                <button
                    onClick={onCreate}
                    disabled={disabled}
                    className={cn(
                        "flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all border shadow-sm",
                        active
                            ? "bg-[#FF4B91]/5 hover:bg-[#FF4B91]/10 text-[#FF4B91] border-[#FF4B91]/20"
                            : "bg-white/40 text-slate-400 border-slate-200 cursor-not-allowed"
                    )}
                    title={`Add new ${label}`}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
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
