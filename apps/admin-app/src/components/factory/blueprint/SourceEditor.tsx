'use client';

import React from 'react';
import { Code2, ArrowUp, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export function SourceEditor({ value, onChange }: SourceEditorProps) {
    return (
        <div className="space-y-6 flex-1 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-1 bg-[#FF4B91] rounded-full" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        3. Source of Truth (Technical Context)
                    </h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <FileText size={12} /> Pure Data Mode
                </div>
            </div>

            <div className="flex-1 relative group animate-in fade-in slide-in-from-bottom-4 flex flex-col bg-white border-2 border-dashed border-primary/20 rounded-[2.5rem] overflow-hidden shadow-sm hover:border-primary/20 transition-all duration-500">
                {/* Editor Header */}
                <div className="px-10 py-5 border-b border-primary/5 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-[#FF4B91]/10 rounded-xl text-[#FF4B91]">
                            <Code2 size={20} />
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-widest text-[#1A1A1A]">Surgical Source Editor</h4>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        Markdown / Plain Text Supported
                    </div>
                </div>

                {/* Editor Content */}
                <div className="relative flex-1 bg-slate-50/30">
                    {!value && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 p-12 opacity-60">
                            <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-6">
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                                    <ArrowUp size={24} />
                                </div>
                                <div className="text-center space-y-2">
                                    <h5 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                                        Paste Source Material Payload
                                    </h5>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                                        Ctrl + V to Inject Contextual Data
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder=""
                        className="absolute inset-0 w-full h-full p-10 bg-transparent text-sm font-sans text-slate-700 resize-none focus:outline-none z-10 custom-scrollbar selection:bg-[#FF4B91]/10 leading-relaxed"
                        spellCheck={false}
                    />
                </div>
            </div>
        </div>
    );
}
