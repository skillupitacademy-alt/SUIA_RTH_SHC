'use client';

import React from 'react';

interface SourceEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export function SourceEditor({ value, onChange }: SourceEditorProps) {
    return (
        <div className="space-y-4 flex-1 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    2. Source of Truth
                </h3>
                <span className="text-[10px] text-slate-400 italic">
                    Paste Documentation / Code / Notes
                </span>
            </div>

            <div className="relative flex-1 group">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="// PASTE SOURCE CODE OR LECTURE NOTES HERE&#10;// The AI will strictly use this content to generate questions.&#10;&#10;const example = 'Like this...';"
                    className="w-full h-full min-h-[300px] bg-slate-900 rounded-2xl p-6 text-sm font-mono text-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner custom-scrollbar selection:bg-indigo-500/30"
                    spellCheck={false}
                />
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-[10px] font-bold text-white/50 pointer-events-none group-hover:opacity-0 transition-opacity">
                    SRC_EDITOR
                </div>
            </div>
        </div>
    );
}
