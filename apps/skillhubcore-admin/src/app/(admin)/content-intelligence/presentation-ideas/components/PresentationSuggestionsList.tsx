'use client';

import React, { useState } from 'react';
import { Eye, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import type { PresentationIdea, PresentationImpact } from '@quiz/types';
import { WireframeIllustrations } from './WireframeIllustrations';

interface PresentationSuggestionsListProps {
  ideas: PresentationIdea[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onPreview: (idea: PresentationIdea) => void;
}

export function PresentationSuggestionsList({
  ideas,
  onToggleSelect,
  onToggleSelectAll,
  onPreview,
}: PresentationSuggestionsListProps) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // Filter ideas
  const filteredIdeas = ideas.filter((idea) => {
    if (filter === 'high') return idea.impact === 'high';
    if (filter === 'medium') return idea.impact === 'medium';
    if (filter === 'low') return idea.impact === 'low';
    return true;
  });

  const totalPages = Math.ceil(filteredIdeas.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedIdeas = filteredIdeas.slice(startIndex, startIndex + itemsPerPage);

  const allSelected =
    displayedIdeas.length > 0 && displayedIdeas.every((idea) => idea.isSelected);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Top Control Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Smart Presentation Suggestions
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">
            AI-driven layout improvements derived from structure and quality indicators
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleSelectAll}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
              Filter by Impact:
            </span>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#f54a8d]"
              >
                <option value="all">All</option>
                <option value="high">High Impact</option>
                <option value="medium">Medium Impact</option>
                <option value="low">Low / Enhancement</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Suggestion Cards List */}
      <div className="divide-y divide-slate-100">
        {displayedIdeas.map((idea) => {
          const isHigh = idea.impact === 'high';
          const isMedium = idea.impact === 'medium';

          return (
            <div
              key={idea.id}
              className={`p-4 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/70 ${
                idea.isSelected ? 'bg-pink-50/20' : ''
              }`}
            >
              {/* Checkbox + Wireframe + Content Info */}
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                {/* 1. Selection Checkbox */}
                <div className="pt-2">
                  <input
                    type="checkbox"
                    checked={idea.isSelected}
                    onChange={() => onToggleSelect(idea.id)}
                    className="w-4 h-4 rounded border-slate-300 text-[#f54a8d] focus:ring-[#f54a8d] cursor-pointer"
                  />
                </div>

                {/* 2. Visual Wireframe Mockup */}
                <WireframeIllustrations wireframeType={idea.wireframeType} />

                {/* 3. Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-xs font-bold text-slate-900">
                      {idea.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isHigh
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : isMedium
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-purple-50 text-purple-600 border border-purple-200'
                      }`}
                    >
                      {isHigh ? 'High Impact' : isMedium ? 'Medium Impact' : 'Enhancement'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-2 leading-relaxed font-normal">
                    {idea.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="font-medium">Applies to:</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px] border border-slate-200/60 truncate max-w-xs">
                      {idea.appliesToSection || 'Document Section'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Reason Column (~25% width on desktop) */}
              <div className="md:w-48 pl-7 md:pl-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Reason
                </span>
                <p className="text-xs text-slate-600 leading-snug">
                  {idea.reason}
                </p>
              </div>

              {/* 5. Action Buttons (Select / Preview) */}
              <div className="flex items-center gap-2 shrink-0 pl-7 md:pl-0 w-full md:w-auto justify-end">
                <button
                  onClick={() => onToggleSelect(idea.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    idea.isSelected
                      ? 'bg-[#f54a8d] text-white hover:bg-[#e03a7a]'
                      : 'border border-pink-200 text-[#f54a8d] bg-white hover:bg-pink-50'
                  }`}
                >
                  {idea.isSelected ? (
                    <>
                      <Check size={13} className="stroke-[3]" />
                      <span>Selected</span>
                    </>
                  ) : (
                    <span>Select</span>
                  )}
                </button>

                <button
                  onClick={() => onPreview(idea)}
                  title="Preview layout idea"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye size={13} />
                  <span>Preview</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer matching page-14.png */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredIdeas.length)} of{' '}
          {filteredIdeas.length} suggestions
        </span>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                currentPage === pageNum
                  ? 'bg-[#f54a8d] text-white shadow-2xs'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {pageNum}
            </button>
          ))}

          {totalPages > 1 && currentPage < totalPages && (
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          )}

          {totalPages > 2 && currentPage < totalPages && (
            <button
              onClick={() => setCurrentPage(totalPages)}
              className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronsRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
