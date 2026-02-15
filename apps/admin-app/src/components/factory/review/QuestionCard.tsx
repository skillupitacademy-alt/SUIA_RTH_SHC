'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
Activity, AlertCircle, CheckCircle2, ChevronDown, ChevronUp,
Code2,     Edit3, Info,     Layers, Sparkles,
Target, Trash2} from 'lucide-react';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';
import { GeneratedQuestion } from '@/types/factory';

interface QuestionCardProps {
    question: GeneratedQuestion;
    index: number;
    officialSkills?: any[]; // Array of skill objects { id, name }
    isDuplicate?: boolean;
    onUpdate: (updates: Partial<GeneratedQuestion>) => void;
    onDelete: () => void;
    isSelected?: boolean;
    onSelect?: (selected: boolean) => void;
}

export function QuestionCard({
    question,
    index,
    officialSkills,
    isDuplicate,
    onUpdate,
    onDelete,
    isSelected = false,
    onSelect
}: QuestionCardProps) {
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
            isEditing && "ring-2 ring-[#FF4B91] border-transparent shadow-2xl",
            isDuplicate && "ring-2 ring-rose-500 border-rose-200 bg-rose-50"
        )}>
            {/* SELECTION OVERLAY GLOW */}
            {isSelected ? <div className="absolute inset-0 bg-[#FF4B91]/[0.02] pointer-events-none animate-in fade-in duration-500" /> : null}

            {/* Duplicate Warning Banner */}
            {isDuplicate ? <div className="w-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest py-1 text-center animate-pulse">
                    ⚠️ Duplicate Detected - This question already exists in this topic
                </div> : null}
            {/* 1. Header Area: Identity & Metadata */}
            <div className="px-10 py-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
                <div className="flex items-center gap-6">
                    {/* CHECKBOX SECTOR */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => onSelect?.(e.target.checked)}
                            className="w-5 h-5 rounded-lg border-2 border-slate-200 text-[#FF4B91] focus:ring-[#FF4B91]/20 cursor-pointer transition-all checked:border-[#FF4B91]"
                        />
                    </div>

                    <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-lg transition-all duration-500",
                        isSelected ? "bg-[#FF4B91] text-white rotate-3 scale-110" : "bg-slate-900 text-[#FF4B91]"
                    )}>
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
                    <label className="text-[10px] font-black uppercase text-[#FF4B91] tracking-widest flex items-center gap-2">
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

                {/* Surgical AI Prompt Style Code Snippet (Light Mode) */}
                {question.codeSnippet && !isEditing ? <div className="p-8 bg-slate-50 border border-slate-200/60 rounded-3xl text-sm font-medium text-blue-600 leading-relaxed whitespace-pre-wrap selection:bg-[#FF4B91]/10 shadow-sm relative overflow-hidden group/code">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover/code:opacity-100 transition-opacity pointer-events-none">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Read-Only Preview</span>
                        </div>
                        {question.codeSnippet}
                    </div> : null}

                {isEditing ? <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                            <Code2 size={12} /> Source Code Context
                        </label>
                        <textarea
                            value={question.codeSnippet}
                            onChange={(e) => onUpdate({ codeSnippet: e.target.value })}
                            className="w-full min-h-[150px] p-6 rounded-3xl bg-slate-50 border border-slate-200/60 text-blue-600 text-sm font-medium focus:ring-2 focus:ring-[#FF4B91]/10 outline-none transition-all placeholder:text-slate-400"
                            placeholder="Paste code snippet here..."
                        />
                    </div> : null}

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
                {isEditing ? <div className="space-y-3">
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
                    </div> : null}
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

                {isRationaleOpen ? <div className="px-10 pb-10 animate-in slide-in-from-top-2 duration-300">
                        {isEditing ? (
                            <textarea
                                value={question.explanation}
                                onChange={(e) => onUpdate({ explanation: e.target.value })}
                                className="w-full min-h-[100px] p-6 rounded-2xl bg-white border border-slate-200 text-slate-600 text-xs font-medium focus:ring-2 focus:ring-[#FF4B91]/10 outline-none transition-all leading-relaxed"
                            />
                        ) : (
                            <p className="text-xs text-slate-600 font-medium leading-relaxed border-l-2 border-[#FF4B91]/20 pl-6">
                                {question.explanation}
                            </p>
                        )}

                        <div className="mt-8 flex flex-wrap gap-4">
                            {question.skillNames.map((skill, sIdx) => {
                                const isNew = officialSkills && officialSkills.length > 0 &&
                                    !officialSkills.some(s => s.name?.toLowerCase() === skill.toLowerCase());

                                return (
                                    <div key={sIdx} className="flex flex-col gap-2">
                                        <div className={cn(
                                            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm border transition-all flex items-center gap-3",
                                            isNew
                                                ? "bg-orange-50 border-orange-200 text-orange-600 ring-2 ring-orange-500/10"
                                                : "bg-white border-slate-200 text-[#FF4B91]"
                                        )}>
                                            <Sparkles size={10} className={isNew ? "text-orange-400" : "text-[#FF4B91] opacity-40"} />
                                            <span>{skill}</span>
                                            {isNew ? <span className="text-[8px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-bold">SUGGESTED</span> : null}
                                        </div>

                                        {/* REMAP DROPDOWN */}
                                        <div className="relative group/remap">
                                            <select
                                                value={officialSkills?.find(s => s.name?.toLowerCase() === skill.toLowerCase())?.name || "new"}
                                                onChange={(e) => {
                                                    const nextSkills = [...question.skillNames];
                                                    if (e.target.value === "new") {
                                                        // Keep current, but it will be flagged as new
                                                    } else {
                                                        nextSkills[sIdx] = e.target.value;
                                                        onUpdate({ skillNames: nextSkills });
                                                    }
                                                }}
                                                className="w-full bg-slate-100/50 hover:bg-slate-100 border border-slate-200/60 rounded-lg px-3 py-1.5 text-[9px] font-bold text-slate-500 appearance-none outline-none transition-all cursor-pointer"
                                            >
                                                <option value="new">✧ Create as New Skill</option>
                                                <optgroup label="Official Taxonomy">
                                                    {officialSkills?.map(s => (
                                                        <option key={s.id} value={s.name}>{s.name}</option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div> : null}
            </div>
        </div>
    );
}
