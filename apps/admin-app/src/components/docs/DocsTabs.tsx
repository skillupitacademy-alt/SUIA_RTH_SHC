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
        <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Category Tabs */}
            <div className="flex bg-slate-900 border-b border-slate-800 p-1">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={cn(
                            "flex-1 px-4 py-2.5 text-xs font-bold tracking-widest uppercase transition-all duration-200 rounded-lg",
                            activeTab === cat
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4 px-2">
                    {activeTab} Files
                </h4>
                {structure[activeTab].map((file) => (
                    <button
                        key={file.path}
                        onClick={() => onFileSelect(file.path)}
                        className={cn(
                            "w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 border group",
                            activePath === file.path
                                ? "bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-inner"
                                : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-300"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-mono">{file.name}</span>
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                activePath === file.path ? "bg-blue-400 animate-pulse" : "bg-slate-700 group-hover:bg-slate-500"
                            )} />
                        </div>
                    </button>
                ))}

                {structure[activeTab].length === 0 && (
                    <p className="text-slate-600 italic text-sm text-center py-8">
                        No files found in this category.
                    </p>
                )}
            </div>
        </div>
    );
}
