'use client';

import React, { useState } from 'react';
import { DocCategory, DocFile } from '@/lib/docs-loader';
import { cn } from '@/lib/utils';


interface DocsTabsProps {
    structure: Record<DocCategory, DocFile[]>;
    onFileSelect: (path: string) => void;
    activePath?: string;
}

export function DocsTabs({ structure, onFileSelect, activePath }: DocsTabsProps) {
    const categories = Object.keys(structure) as DocCategory[];
    const [activeTab, setActiveTab] = useState<DocCategory>(categories[0]);

    return (
        <div className="flex flex-col gap-4">
            {/* Category Navigation - Top Bar */}
            <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-xl overflow-x-auto custom-scrollbar no-scrollbar">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={cn(
                            "whitespace-nowrap px-6 py-2.5 text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 rounded-xl flex-shrink-0",
                            activeTab === cat
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* File Selector - Grid/Row under categories */}
            <div className="flex gap-2 p-1 overflow-x-auto pb-4 no-scrollbar">
                {structure[activeTab].map((file) => (
                    <button
                        key={file.path}
                        onClick={() => onFileSelect(file.path)}
                        className={cn(
                            "flex items-center gap-3 px-5 py-3 rounded-[1.25rem] text-[11px] font-bold transition-all duration-300 border-2 whitespace-nowrap",
                            activePath === file.path
                                ? "bg-blue-500/10 border-blue-500 text-blue-400 shadow-xl shadow-blue-500/10"
                                : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                        )}
                    >
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            activePath === file.path ? "bg-blue-400 animate-pulse" : "bg-slate-800"
                        )} />
                        <span className="font-mono uppercase tracking-tighter">{file.name}</span>
                    </button>
                ))}

                {structure[activeTab].length === 0 && (
                    <p className="text-slate-600 italic text-xs py-2 px-4">
                        Zero indices detected in this mainframe category.
                    </p>
                )}
            </div>
        </div>
    );
}
