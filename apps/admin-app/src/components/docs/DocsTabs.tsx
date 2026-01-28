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
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFiles = structure[activeTab].filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.path.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6">
            {/* Category Navigation - Top Bar */}
            <div className="flex bg-white border border-slate-200 p-2 rounded-[2rem] shadow-2xl shadow-primary/5 overflow-x-auto no-scrollbar items-center gap-2">
                <button
                    onClick={() => onFileSelect('RADAR')}
                    className={cn(
                        "whitespace-nowrap px-8 py-3.5 text-[11px] font-black tracking-[0.3em] uppercase transition-all duration-500 rounded-2xl flex-shrink-0 flex items-center gap-3",
                        activePath === 'RADAR'
                            ? "bg-[#FF4B91] text-white shadow-xl shadow-[#FF4B91]/20 scale-105"
                            : "text-slate-400 hover:text-[#FF4B91] hover:bg-slate-50"
                    )}
                >
                    <div className={cn("w-2 h-2 rounded-full", activePath === 'RADAR' ? "bg-white animate-ping" : "bg-[#FF4B91]")} />
                    Project_Radar
                </button>

                <div className="h-8 w-[1px] bg-slate-100 mx-2" />

                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => {
                            setActiveTab(cat);
                            setSearchQuery('');
                        }}
                        className={cn(
                            "whitespace-nowrap px-8 py-3.5 text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-500 rounded-2xl flex-shrink-0",
                            activeTab === cat
                                ? "bg-[#FF4B91] text-white shadow-xl shadow-[#FF4B91]/20"
                                : "text-slate-400 hover:text-[#FF4B91] hover:bg-slate-50"
                        )}
                    >
                        {cat}
                    </button>
                ))}

                {/* Search Input - Desktop View Expansion */}
                <div className="hidden lg:flex flex-1 items-center justify-end px-4">
                    <div className="relative w-full max-w-[300px]">
                        <input
                            type="text"
                            placeholder="SEARCH_LOGIC..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-xl px-5 py-2.5 text-[10px] font-black tracking-widest text-[#1A1A1A] placeholder:text-slate-300 focus:ring-2 focus:ring-[#FF4B91]/20 transition-all outline-none"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                            <div className="w-1.5 h-1.5 bg-[#FF4B91] rounded-full" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Search - Visible only if needed or persistent */}
            <div className="lg:hidden px-2">
                <input
                    type="text"
                    placeholder="SEARCH_LOGIC..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-xl px-5 py-3.5 text-[10px] font-black tracking-widest text-[#1A1A1A] placeholder:text-slate-300 shadow-sm outline-none"
                />
            </div>

            {/* File Selector - Row under categories */}
            <div className="flex gap-3 p-1 overflow-x-auto pb-4 no-scrollbar">
                {filteredFiles.map((file) => (
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
