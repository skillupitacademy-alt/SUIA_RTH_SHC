'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { Plus, Trash2, Check, Clock, List, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionFormData {
    text: string;
    type: 'single' | 'multiple';
    options: Array<{ id: string; text: string; isCorrect: boolean }>;
    explanation: string;
    difficulty: 'simple' | 'intermediate' | 'expert';
    estimatedTime: number; // seconds
    mappingType: 'conceptual' | 'technical' | 'practical';
}

interface QuestionEditorProps {
    onSubmit: (data: QuestionFormData) => Promise<void>;
    loading?: boolean;
    initialData?: Partial<QuestionFormData>;
}

export function QuestionEditor({ onSubmit, loading, initialData }: QuestionEditorProps) {
    const [data, setData] = useState<QuestionFormData>({
        text: initialData?.text || '',
        type: initialData?.type || 'single',
        options: initialData?.options?.map(o => ({
            ...o,
            id: o.id || crypto.randomUUID()
        })) || [{ id: '1', text: '', isCorrect: false }, { id: '2', text: '', isCorrect: false }],
        explanation: initialData?.explanation || '',
        difficulty: initialData?.difficulty || 'intermediate',
        estimatedTime: initialData?.estimatedTime || 60,
        mappingType: initialData?.mappingType || 'conceptual',
    });

    const addOption = () => {
        setData(prev => ({
            ...prev,
            options: [...prev.options, { id: crypto.randomUUID(), text: '', isCorrect: false }]
        }));
    };

    const removeOption = (id: string) => {
        if (data.options.length <= 2) return;
        setData(prev => ({
            ...prev,
            options: prev.options.filter(o => o.id !== id)
        }));
    };

    const updateOption = (id: string, updates: Partial<typeof data.options[0]>) => {
        setData(prev => ({
            ...prev,
            options: prev.options.map(o => {
                if (o.id !== id) return o;
                return { ...o, ...updates };
            })
        }));
    };

    const setCorrectOption = (id: string) => {
        if (data.type === 'single') {
            setData(prev => ({
                ...prev,
                options: prev.options.map(o => ({ ...o, isCorrect: o.id === id }))
            }));
        } else {
            updateOption(id, { isCorrect: !data.options.find(o => o.id === id)?.isCorrect });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 p-8 rounded-3xl border border-white/40 bg-white/60 backdrop-blur-2xl shadow-xl relative overflow-hidden group">
            {/* Decor */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF4B91] to-transparent opacity-20" />

            <div className="flex items-center gap-3 mb-2 border-b border-gray-100 pb-6">
                <FileText className="w-6 h-6 text-[#FF4B91]" />
                <h3 className="text-xl font-black text-[#1A1A1A] tracking-tight uppercase">Question Details</h3>
            </div>

            {/* Question Text */}
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Question Content (Markdown)</label>
                <textarea
                    required
                    value={data.text}
                    onChange={(e) => setData({ ...data, text: e.target.value })}
                    rows={4}
                    className="w-full p-6 bg-white border border-slate-200 rounded-2xl text-[#1A1A1A] focus:border-[#FF4B91]/50 focus:shadow-[0_0_30px_rgba(255,75,145,0.1)] outline-none resize-y transition-all placeholder:text-slate-400 font-medium"
                    placeholder="# Type your question here..."
                />
            </div>

            {/* Options */}
            <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Answer Options</label>
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setData({ ...data, type: 'single' })}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2",
                                data.type === 'single' ? "bg-[#FF4B91] text-white shadow-lg shadow-[#FF4B91]/30" : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            <Check className="w-3 h-3" /> Single
                        </button>
                        <button
                            type="button"
                            onClick={() => setData({ ...data, type: 'multiple' })}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2",
                                data.type === 'multiple' ? "bg-[#FF4B91] text-white shadow-lg shadow-[#FF4B91]/30" : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            <List className="w-3 h-3" /> Multiple
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {data.options.map((opt, idx) => (
                        <div key={opt.id} className="flex items-center gap-3 group">
                            <div className="text-slate-400 font-mono text-xs w-6 text-center">{String.fromCharCode(65 + idx)}</div>
                            <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => updateOption(opt.id, { text: e.target.value })}
                                className={cn(
                                    "flex-1 h-12 px-4 bg-white border rounded-xl text-[#1A1A1A] font-medium outline-none focus:border-[#FF4B91]/50 transition-all placeholder:text-slate-400",
                                    opt.isCorrect
                                        ? "border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)] bg-green-50"
                                        : "border-slate-200"
                                )}
                                placeholder={`Option ${idx + 1}`}
                            />
                            <button
                                type="button"
                                onClick={() => setCorrectOption(opt.id)}
                                className={cn(
                                    "w-12 h-12 flex items-center justify-center rounded-xl border transition-all",
                                    opt.isCorrect
                                        ? "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20"
                                        : "bg-white border-slate-200 text-slate-400 hover:text-green-500 hover:border-green-500/30"
                                )}
                                title="Mark as correct"
                            >
                                <Check className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => removeOption(opt.id)}
                                className="w-12 h-12 flex items-center justify-center rounded-xl border border-transparent text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addOption}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF4B91] hover:text-[#ff3382] ml-9 p-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Option
                    </button>
                </div>
            </div>

            {/* Explanation */}
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Explanation</label>
                <textarea
                    value={data.explanation}
                    onChange={(e) => setData({ ...data, explanation: e.target.value })}
                    rows={2}
                    className="w-full p-6 bg-white border border-slate-200 rounded-2xl text-[#1A1A1A] font-medium focus:border-[#FF4B91]/30 outline-none resize-y transition-all placeholder:text-slate-400"
                    placeholder="Explain why the answer is correct..."
                />
            </div>

            {/* Metadata */}
            <div className="space-y-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Mapping Type (Nature of Question)</label>
                    <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner">
                        {(['conceptual', 'technical', 'practical'] as const).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setData({ ...data, mappingType: type })}
                                className={cn(
                                    "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                    data.mappingType === type
                                        ? "bg-white text-[#FF4B91] shadow-lg border border-slate-100 scale-[1.02]"
                                        : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Difficulty</label>
                        <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-inner">
                            {(['simple', 'intermediate', 'expert'] as const).map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setData({ ...data, difficulty: level })}
                                    className={cn(
                                        "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                                        data.difficulty === level
                                            ? "bg-white text-[#1A1A1A] shadow-md border border-slate-100"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Estimated Time</label>
                        <div className="relative group/time">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover/time:text-[#FF4B91] transition-colors" />
                            <input
                                type="number"
                                value={isNaN(data.estimatedTime) ? '' : data.estimatedTime}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setData({ ...data, estimatedTime: isNaN(val) ? 0 : val });
                                }}
                                className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-[#1A1A1A] font-bold outline-none focus:border-[#FF4B91]/30 focus:shadow-[0_0_20px_rgba(255,75,145,0.1)] transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">Seconds</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="pt-8 border-t border-slate-100 flex justify-end">
                <button
                    type="submit"
                    disabled={loading || !data.text || !data.options.some(o => o.isCorrect)}
                    className="flex items-center gap-2 px-8 py-4 bg-[#FF4B91] hover:bg-[#ff3382] text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF4B91]/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(255,75,145,0.4)]"
                >
                    {loading ? 'Saving Question...' : 'Save Question'}
                </button>
            </div>
        </form>
    );
}

export default QuestionEditor;
