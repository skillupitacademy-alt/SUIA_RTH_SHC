'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { Shield, Plus, Edit2, Trash2, X, AlertTriangle, BookOpen, Layers, Hash, GitBranch } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ErrorBanner } from '../layout/ErrorBanner';
import { useDomains, useSubjects, useTopics, useSubtopics } from '@/hooks/useAdminHierarchy';

export function SkillTable() {
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
    const [currentSkill, setCurrentSkill] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        subtopicId: '',
        description: '',
        status: 'active' as 'active' | 'inactive',
        domainId: '',
        subjectId: '',
        topicId: ''
    });

    // Hierarchy data
    const domainsHook = useDomains();
    const subjectsHook = useSubjects(formData.domainId || undefined);
    const topicsHook = useTopics(formData.subjectId || undefined);
    const subtopicsHook = useSubtopics(formData.topicId || undefined);
    const domains = domainsHook.data;
    const subjects = subjectsHook.data;
    const topics = topicsHook.data;
    const subtopics = subtopicsHook.data;

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchSkills = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.admin.getSkills(page, 20, debouncedSearch || undefined);
            setData(response.data);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Failed to fetch skills:', error);
            setErrorMessage('Network error: Unable to index skill matrix.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, [page, debouncedSearch]);

    const handleOpenForm = (skill: any = null) => {
        if (skill) {
            setCurrentSkill(skill);
            const subtopic = skill.subtopic;
            const topic = subtopic?.topic;
            const subject = topic?.subject;

            setFormData({
                name: skill.name,
                subtopicId: skill.subtopicId || '',
                description: skill.description || '',
                status: skill.status || 'active',
                domainId: subject?.domainId || '',
                subjectId: topic?.subjectId || '',
                topicId: subtopic?.topicId || ''
            });

            // No manual fetch needed with atomic hooks
        } else {
            setCurrentSkill(null);
            setFormData({
                name: '',
                subtopicId: '',
                description: '',
                status: 'active',
                domainId: '',
                subjectId: '',
                topicId: ''
            });
        }
        setIsFormOpen(true);
    };

    const handleDomainChange = (domainId: string) => {
        setFormData({ ...formData, domainId, subjectId: '', topicId: '', subtopicId: '' });
    };

    const handleSubjectChange = (subjectId: string) => {
        setFormData({ ...formData, subjectId, topicId: '', subtopicId: '' });
    };

    const handleTopicChange = (topicId: string) => {
        setFormData({ ...formData, topicId, subtopicId: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subtopicId) {
            setErrorMessage('Constraint violation: Parent subtopic selection required.');
            return;
        }
        setIsSubmitting(true);
        try {
            if (currentSkill) {
                await apiClient.admin.updateSkill(currentSkill.id, formData);
            } else {
                await apiClient.admin.createSkill(formData);
            }
            setIsFormOpen(false);
            fetchSkills();
        } catch (error) {
            console.error('Failed to save skill:', error);
            setErrorMessage('Security constraint or validation failure: Operation rejected.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!currentSkill) return;
        setIsSubmitting(true);
        try {
            await apiClient.admin.deleteSkill(currentSkill.id);
            setIsDeleteOpen(false);
            fetchSkills();
        } catch (error) {
            console.error('Failed to delete skill:', error);
            setErrorMessage('Dependency violation: Skill is mapped to active questions.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {errorMessage && (
                <ErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} />
            )}

            {/* Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white border border-primary/10 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-[#FF4B91]" />
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-[#1A1A1A] italic uppercase tracking-tighter">
                                    {currentSkill ? 'Update_Skill' : 'Initialize_Skill'}
                                </h3>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Authority Management Layer</p>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Skill Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Enter skill name..."
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-xl px-5 py-2.5 text-sm font-bold text-[#1A1A1A] outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Domain</label>
                                    <select
                                        required
                                        value={formData.domainId}
                                        onChange={(e) => handleDomainChange(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none appearance-none"
                                    >
                                        <option value="">Select Domain...</option>
                                        {domains.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Subject</label>
                                    <select
                                        required
                                        disabled={!formData.domainId}
                                        value={formData.subjectId}
                                        onChange={(e) => handleSubjectChange(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none appearance-none disabled:opacity-50"
                                    >
                                        <option value="">Select Subject...</option>
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Topic</label>
                                    <select
                                        required
                                        disabled={!formData.subjectId}
                                        value={formData.topicId}
                                        onChange={(e) => handleTopicChange(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none appearance-none disabled:opacity-50"
                                    >
                                        <option value="">Select Topic...</option>
                                        {topics.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Subtopic</label>
                                    <select
                                        required
                                        disabled={!formData.topicId}
                                        value={formData.subtopicId}
                                        onChange={(e) => setFormData({ ...formData, subtopicId: e.target.value })}
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none appearance-none disabled:opacity-50"
                                    >
                                        <option value="">Select Subtopic...</option>
                                        {subtopics.map(st => (
                                            <option key={st.id} value={st.id}>{st.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    className="w-full bg-slate-50 border-none rounded-xl px-5 py-2.5 text-sm font-bold outline-none appearance-none"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Description</label>
                                <textarea
                                    rows={2}
                                    placeholder="Provide skill context..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-xl px-5 py-2.5 text-sm font-bold outline-none resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 mt-2 rounded-2xl bg-[#1A1A1A] text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'Syncing_Data...' : currentSkill ? 'Execute_Update' : 'Initialize_Vector'}
                            </button>
                        </form>
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
                                <h3 className="text-2xl font-black text-[#1A1A1A] italic uppercase tracking-tighter">Confirm_Purge</h3>
                                <p className="text-sm font-medium text-muted-foreground mt-2">
                                    You are about to delete the skill <strong className="text-red-600">"{currentSkill?.name}"</strong>. This action is irreversible.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button
                                    onClick={() => setIsDeleteOpen(false)}
                                    className="px-6 py-4 rounded-2xl border-2 border-slate-100 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
                                >
                                    Abort
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isSubmitting}
                                    className="px-6 py-4 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Purging...' : 'Delete_ID'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Bar & Add Button */}
            <div className="bg-white/50 backdrop-blur-xl border border-primary/10 p-6 rounded-[2rem] shadow-xl relative overflow-hidden flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 rounded-xl bg-cyan-50 text-cyan-500 shadow-sm border border-cyan-100">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div className="relative flex-1 max-w-md group">
                        <input
                            type="text"
                            placeholder="SEARCH_SKILLS..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-[11px] font-black tracking-widest text-[#1A1A1A] placeholder:text-slate-300 focus:ring-2 focus:ring-cyan-500/10 transition-all outline-none border border-transparent shadow-inner"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenForm()}
                    className="ml-4 px-6 py-3 rounded-2xl bg-[#FF4B91] hover:bg-[#ff3382] text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#FF4B91]/20 transition-all flex items-center gap-3 active:scale-95"
                >
                    <Plus size={16} />
                    Add_Skill
                </button>
            </div>

            <div className="rounded-[2.5rem] border border-primary/10 bg-white/50 backdrop-blur-xl overflow-hidden shadow-xl min-h-[400px] relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-cyan-50 border-t-cyan-500 rounded-full animate-spin" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Indexing_Matrix...</p>
                        </div>
                    </div>
                )}
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-primary/5 bg-primary/5">
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground w-[30%]">Skill</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Context_Mapping</th>
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
                                        <div className="h-8 w-8 rounded-lg bg-cyan-50 text-cyan-500 flex items-center justify-center">
                                            <Shield size={16} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#1A1A1A]">{item.name}</p>
                                            <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter truncate max-w-[200px]">{item.description || 'No context provided'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                        <div className="flex items-center gap-2">
                                            <Layers size={10} className="text-slate-300" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase truncate max-w-[80px]">{item.subtopic?.topic?.subject?.domain?.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BookOpen size={10} className="text-slate-300" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase truncate max-w-[80px]">{item.subtopic?.topic?.subject?.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Hash size={10} className="text-slate-300" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase truncate max-w-[80px]">{item.subtopic?.topic?.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <GitBranch size={10} className="text-[#FF4B91]/40" />
                                            <span className="text-[10px] font-bold text-[#1A1A1A] truncate max-w-[80px]">{item.subtopic?.name}</span>
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
                                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleOpenForm(item)}
                                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 transition-all"
                                            title="Edit Skill"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => { setCurrentSkill(item); setIsDeleteOpen(true); }}
                                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                            title="Delete Skill"
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
