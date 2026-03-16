
'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Hash, Layers } from 'lucide-react';

interface ZPaginationProps {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    mode?: 'page' | 'cursor';
    canGoPrevious?: boolean;
    hasNextPage?: boolean;
    onPrevious?: () => void;
    onNext?: () => void;
    pageSizeOptions?: number[];
    className?: string;
    accentColor?: string;
}

export const ZPagination: React.FC<ZPaginationProps> = ({
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    onPageChange,
    onPageSizeChange,
    mode = 'page',
    canGoPrevious,
    hasNextPage,
    onPrevious,
    onNext,
    pageSizeOptions = [10, 25, 50],
    className = '',
    accentColor = '#FF2D55'
}) => {
    if (totalCount === 0) return null;

    const safeCurrentPage = Math.max(currentPage, 1);
    const safeTotalPages = Math.max(totalPages, 1);
    const startRange = (safeCurrentPage - 1) * pageSize + 1;
    const endRange = Math.min(safeCurrentPage * pageSize, totalCount);
    const previousDisabled = mode === 'cursor' ? !(canGoPrevious ?? safeCurrentPage > 1) : safeCurrentPage === 1;
    const nextDisabled = mode === 'cursor' ? !(hasNextPage ?? safeCurrentPage < safeTotalPages) : safeCurrentPage === safeTotalPages;

    const handlePrevious = () => {
        if (previousDisabled) return;
        if (mode === 'cursor') {
            onPrevious?.();
            return;
        }
        onPageChange(safeCurrentPage - 1);
    };

    const handleNext = () => {
        if (nextDisabled) return;
        if (mode === 'cursor') {
            onNext?.();
            return;
        }
        onPageChange(safeCurrentPage + 1);
    };

    return (
        <div className={`flex flex-col md:flex-row items-center justify-between gap-6 py-6 px-2 border-t border-slate-100/60 ${className}`}>
            {/* Left: Summary Stats */}
            <div className="flex items-center gap-6">
                <div className="flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Records Displayed</p>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 font-inter">
                            {startRange}-{endRange}
                        </span>
                        <span className="text-xs font-bold text-slate-400">of</span>
                        <span className="text-sm font-black text-slate-900 font-inter">
                            {totalCount.toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="h-8 w-px bg-slate-100 hidden md:block" />

                <div className="flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Page Progress</p>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 font-inter">{safeCurrentPage}</span>
                        <span className="text-xs font-bold text-slate-400">/</span>
                        <span className="text-sm font-black text-slate-400 font-inter">{safeTotalPages}</span>
                    </div>
                </div>
            </div>

            {/* Right: Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4">
                {/* Page Size Selector */}
                <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
                    {pageSizeOptions.map(option => (
                        <button
                            key={option}
                            onClick={() => onPageSizeChange(option)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${pageSize === option
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevious}
                        disabled={previousDisabled}
                        className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-slate-200 disabled:opacity-30 disabled:grayscale transition-all active:scale-95 group"
                        aria-label="Previous Page"
                    >
                        <ChevronLeft size={18} className="text-slate-600 group-hover:text-slate-900 transition-colors" />
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={nextDisabled}
                        className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-slate-200 disabled:opacity-30 disabled:grayscale transition-all active:scale-95 group"
                        aria-label="Next Page"
                    >
                        <ChevronRight size={18} className="text-slate-600 group-hover:text-slate-900 transition-colors" />
                    </button>
                </div>

                <div className="md:hidden w-full text-center pt-2">
                    <p className="text-[9px] font-black text-[#FF2D55] uppercase tracking-[0.2em]">Secure Data Stream • Encrypted</p>
                </div>
            </div>
        </div>
    );
};
