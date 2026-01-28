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
        <div className="flex flex-col gap-6">
            {/* Category Navigation - Top Bar */}
            <div className="flex bg-white border border-slate-200 p-2 rounded-[2rem] shadow-2xl shadow-primary/5 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={cn(
                            "whitespace-nowrap px-8 py-3.5 text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-500 rounded-2xl flex-shrink-0",
                            activeTab === cat
                                ? "bg-[#1A1A1A] text-white shadow-xl shadow-[#1A1A1A]/20"
                                : "text-slate-400 hover:text-[#1A1A1A] hover:bg-slate-50"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* File Selector - Row under categories */}
            <div className="flex gap-3 p-1 overflow-x-auto pb-4 no-scrollbar">
                {structure[activeTab].map((file) => (
                    <button
                        key={file.path}
                        onClick={() => onFileSelect(file.path)}
                        className={cn(
                            "flex items-center gap-4 px-6 py-4 rounded-2xl text-[12px] font-bold transition-all duration-500 border-2 whitespace-nowrap",
                            activePath === file.path
                                ? "bg-[#FF4B91]/5 border-[#FF4B91] text-[#FF4B91] shadow-xl shadow-[#FF4B91]/10"
                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600 shadow-sm"
                        )}
                    >
                        <div className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            activePath === file.path ? "bg-[#FF4B91] animate-pulse shadow-[0_0_8px_#FF4B91]" : "bg-slate-200"
                        )} />
                        <span className="font-black uppercase tracking-tighter">{file.name}</span>
                    </button>
                ))}

                {structure[activeTab].length === 0 && (
                    <p className="text-slate-400 italic text-[11px] font-bold py-4 px-6 uppercase tracking-widest">
                        No Indices Detected_
                    </p>
                )}
            </div>
        </div>
    );
}
