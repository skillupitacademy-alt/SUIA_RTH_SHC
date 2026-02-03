'use client';

import React, { useState } from 'react';
import { GeneratedQuestion } from '@/types/factory';
import {
    Edit3, Trash2, CheckCircle2, ChevronDown, ChevronUp,
    Layers, Target, Activity, Code2, AlertCircle, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface QuestionCardProps {
    question: GeneratedQuestion;
    index: number;
    onUpdate: (updates: Partial<GeneratedQuestion>) => void;
    onDelete: () => void;
}

export function QuestionCard({ question, index, onUpdate, onDelete }: QuestionCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isRationaleOpen, setIsRationaleOpen] = useState(false);

    // Color mapping for Difficulty
    const difficultyColors = {
        simple: 'bg-blue-50 text-blue-600 border-blue-100',
        intermediate: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        expert: 'bg-rose-50 text-rose-600 border-rose-100'
    };

    const handleSave = () => {
        setIsEditing(false);
    };

    return (
        <div className={cn(
            "w-full bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-500 overflow-hidden flex flex-col group",
            isEditing && "ring-2 ring-[#FF4B91] border-transparent shadow-2xl"
        )}>
            {/* 1. Header Area: Identity & Metadata */}
            <div className="px-10 py-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 text-[#FF4B91] flex items-center justify-center font-black italic shadow-lg">
                        #{index + 1}
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generated Asset</h4>
                        <p className="text-xs font-bold text-slate-800 tracking-tight">QID-{question.id?.split('-').pop() || 'NEW'}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Difficulty Pill */}
                    <div className={cn(
                        "px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2",
                        difficultyColors[question.difficulty as keyof typeof difficultyColors]
                    )}>
                        <Activity size={10} /> {question.difficulty}
                    </div>

                    {/* Depth Pill */}
                    <div className="px-4 py-1.5 rounded-full border border-slate-200 bg-white text-slate-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Layers size={10} className="text-[#FF4B91]" /> Depth {question.depthLevel}
                    </div>

                    {/* Mapping Pill */}
                    <div className="px-4 py-1.5 rounded-full border border-slate-200 bg-white text-slate-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Target size={10} className="text-[#FF4B91]" /> {question.mappingType}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className={cn(
                            "p-3 rounded-xl transition-all active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                            isEditing
                                ? "bg-[#FF4B91] text-white shadow-lg"
                                : "bg-white border border-slate-200 text-slate-400 hover:text-[#FF4B91] hover:border-[#FF4B91]/20 shadow-sm"
                        )}
                    >
                        {isEditing ? <CheckCircle2 size={14} /> : <Edit3 size={14} />}
                        {isEditing ? 'Save Changes' : 'Edit content'}
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95 shadow-sm"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* 2. Content Area: Question & Code */}
            <div className="p-10 space-y-8 flex-1">
                {/* Question Text */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-[#FF4B91] tracking-widest italic flex items-center gap-2">
                        <AlertCircle size={12} /> Question Statement
                    </label>
                    {isEditing ? (
                        <textarea
                            value={question.questionText}
                            onChange={(e) => onUpdate({ questionText: e.target.value })}
                            className="w-full min-h-[120px] p-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium focus:ring-2 focus:ring-[#FF4B91]/10 focus:border-[#FF4B91]/20 outline-none transition-all"
                        />
                    ) : (
                        <div className="text-xl font-bold text-slate-800 leading-snug tracking-tight prose prose-slate max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {question.questionText}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                {/* Optional Code Snippet */}
                {question.codeSnippet && !isEditing && (
                    <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-3 bg-slate-800/50 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Code2 size={14} className="text-[#FF4B91]" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Code Context</span>
                            </div>
                        </div>
                        <pre className="p-8 text-sm font-mono text-emerald-400 overflow-x-auto custom-scrollbar leading-relaxed">
                            <code>{question.codeSnippet}</code>
                        </pre>
                    </div>
                )}

                {isEditing && (
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                            <Code2 size={12} /> Code Snippet (Optional)
                        </label>
                        <textarea
                            value={question.codeSnippet}
                            onChange={(e) => onUpdate({ codeSnippet: e.target.value })}
                            className="w-full min-h-[150px] p-6 rounded-2xl bg-slate-900 text-emerald-400 text-sm font-mono focus:ring-2 focus:ring-[#FF4B91]/10 outline-none transition-all"
                            placeholder="Paste code snippet here..."
                        />
                    </div>
                )}

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.options.map((option, oIdx) => (
                        <div
                            key={oIdx}
                            className={cn(
                                "relative p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 group/opt",
                                option === question.correctAnswer
                                    ? "bg-emerald-50 border-emerald-100 shadow-sm"
                                    : "bg-slate-50/50 border-slate-200 hover:border-[#FF4B91]/20"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black",
                                option === question.correctAnswer
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                                    : "bg-white border border-slate-200 text-slate-400 group-hover/opt:border-[#FF4B91]/30 group-hover/opt:text-[#FF4B91]"
                            )}>
                                {String.fromCharCode(65 + oIdx)}
                            </div>

                            {isEditing ? (
                                <input
                                    value={option}
                                    onChange={(e) => {
                                        const next = [...question.options];
                                        next[oIdx] = e.target.value;
                                        onUpdate({ options: next });
                                    }}
                                    className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold text-slate-700"
                                />
                            ) : (
                                <span className="text-sm font-bold text-slate-700">{option}</span>
                            )}

                            {option === question.correctAnswer && !isEditing && (
                                <div className="absolute top-1/2 -translate-y-1/2 right-5 text-emerald-500 animate-in fade-in zoom-in duration-300" title="Correct Answer">
                                    <CheckCircle2 size={16} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Correct Answer Selector (Editing Only) */}
                {isEditing && (
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mark Correct Answer</label>
                        <div className="flex gap-2">
                            {question.options.map((option, oIdx) => (
                                <button
                                    key={oIdx}
                                    onClick={() => onUpdate({ correctAnswer: option })}
                                    className={cn(
                                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        option === question.correctAnswer
                                            ? "bg-emerald-500 text-white shadow-lg"
                                            : "bg-slate-50 text-slate-400 border border-slate-200"
                                    )}
                                >
                                    {String.fromCharCode(65 + oIdx)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Footer Area: Rationale & Skills */}
            <div className="border-t border-slate-100 bg-slate-50/30">
                <button
                    onClick={() => setIsRationaleOpen(!isRationaleOpen)}
                    className="w-full px-10 py-5 flex items-center justify-between group/rat hover:bg-white transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-200 rounded-lg text-slate-500 group-hover/rat:text-[#FF4B91] group-hover/rat:bg-[#FF4B91]/5 transition-colors">
                            <Info size={14} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rationale & Technical Explanation</span>
                    </div>
                    {isRationaleOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isRationaleOpen && (
                    <div className="px-10 pb-10 animate-in slide-in-from-top-2 duration-300">
                        {isEditing ? (
                            <textarea
                                value={question.explanation}
                                onChange={(e) => onUpdate({ explanation: e.target.value })}
                                className="w-full min-h-[100px] p-6 rounded-2xl bg-white border border-slate-200 text-slate-600 text-xs font-medium focus:ring-2 focus:ring-[#FF4B91]/10 outline-none transition-all leading-relaxed"
                            />
                        ) : (
                            <p className="text-xs text-slate-600 font-medium italic leading-relaxed border-l-2 border-[#FF4B91]/20 pl-6">
                                {question.explanation}
                            </p>
                        )}

                        {/* Skill Badges */}
                        <div className="mt-8 flex flex-wrap gap-2">
                            {question.skillNames.map((skill, sIdx) => (
                                <span key={sIdx} className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-[#FF4B91] text-[9px] font-black uppercase tracking-widest shadow-sm">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
