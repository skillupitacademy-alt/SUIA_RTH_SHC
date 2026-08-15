'use client';

import React, { useState } from 'react';
import {
  Check,
  Edit2,
  Trash2,
  ChevronDown,
  Columns,
  List,
  Type,
  Heading1,
  Heading2,
  Code,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { SuggestedBlockItem } from './mockBlockSuggestionsData';

interface SuggestedBlocksTableProps {
  blocks: SuggestedBlockItem[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (block: SuggestedBlockItem) => void;
}

export function SuggestedBlocksTable({
  blocks,
  onToggleSelect,
  onToggleSelectAll,
  onAccept,
  onReject,
  onEdit,
}: SuggestedBlocksTableProps) {
  const [filter, setFilter] = useState<
    | 'all'
    | 'suggested_only'
    | 'existing_only'
    | 'high'
    | 'medium'
    | 'low'
    | 'component'
    | 'heading'
    | 'paragraph'
    | 'list'
  >('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Filter blocks
  const filteredBlocks = blocks.filter((b) => {
    if (filter === 'suggested_only') return b.origin === 'suggested';
    if (filter === 'existing_only') return b.origin === 'existing';
    if (filter === 'high') return b.confidence >= 80;
    if (filter === 'medium') return b.confidence >= 50 && b.confidence < 80;
    if (filter === 'low') return b.confidence < 50;
    if (filter === 'component') return b.category === 'component';
    if (filter === 'heading') return b.category === 'heading';
    if (filter === 'paragraph') return b.category === 'paragraph';
    if (filter === 'list') return b.category === 'list';
    return true;
  });

  const totalPages = Math.ceil(filteredBlocks.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedBlocks = filteredBlocks.slice(startIndex, startIndex + itemsPerPage);

  const allSelected = displayedBlocks.length > 0 && displayedBlocks.every((b) => b.isSelected);

  const getBadgeIcon = (block: SuggestedBlockItem) => {
    switch (block.blockType.badgeColor) {
      case 'navy':
        return (
          <span className="w-6 h-6 rounded bg-[#0B1B3D] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            H1
          </span>
        );
      case 'pink':
        return (
          <span className="w-6 h-6 rounded bg-[#f54a8d] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            H2
          </span>
        );
      case 'purple':
        return (
          <span className="w-6 h-6 rounded bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            <Columns size={12} />
          </span>
        );
      case 'amber':
        return (
          <span className="w-6 h-6 rounded bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            <AlertCircle size={12} />
          </span>
        );
      case 'slate':
        return (
          <span className="w-6 h-6 rounded bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            <Code size={12} />
          </span>
        );
      case 'blue':
      default:
        if (block.blockType.name.toLowerCase().includes('list')) {
          return (
            <span className="w-6 h-6 rounded bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold flex items-center justify-center shrink-0">
              <List size={12} />
            </span>
          );
        }
        return (
          <span className="w-6 h-6 rounded bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold flex items-center justify-center shrink-0">
            <Type size={12} />
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Table Control Bar */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Proposed Content Blocks ({blocks.length})
          </h2>
          <span className="text-[11px] text-slate-400">
            Existing detected blocks & intelligent block suggestions
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleSelectAll}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>

          <div className="relative">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-pink-500"
            >
              <option value="all">Filter: All Blocks</option>
              <option value="suggested_only">Suggested Transformations Only</option>
              <option value="existing_only">Existing Detected Only</option>
              <option value="high">High Confidence (≥80%)</option>
              <option value="medium">Medium Confidence (50-79%)</option>
              <option value="low">Low Confidence (&lt;50%)</option>
              <option value="component">Components (Two Column, Callout, etc.)</option>
              <option value="heading">Headings (H1, H2)</option>
              <option value="paragraph">Paragraphs</option>
              <option value="list">Lists</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-300 text-[#f54a8d] focus:ring-[#f54a8d] cursor-pointer"
                />
              </th>
              <th className="py-3 px-2 w-10 text-center">#</th>
              <th className="py-3 px-3 w-40">Block Type</th>
              <th className="py-3 px-4 min-w-[240px]">Content / Preview</th>
              <th className="py-3 px-3 w-28">Confidence</th>
              <th className="py-3 px-3 min-w-[180px]">Reason</th>
              <th className="py-3 px-3 w-24 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedBlocks.map((block) => {
              const isHigh = block.confidence >= 80;
              const isMedium = block.confidence >= 50 && block.confidence < 80;

              return (
                <tr
                  key={block.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    block.isSelected ? 'bg-pink-50/20' : ''
                  }`}
                >
                  {/* 1. Checkbox */}
                  <td className="py-3 px-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={block.isSelected}
                      onChange={() => onToggleSelect(block.id)}
                      className="rounded border-slate-300 text-[#f54a8d] focus:ring-[#f54a8d] cursor-pointer"
                    />
                  </td>

                  {/* 2. Number */}
                  <td className="py-3 px-2 text-center text-slate-400 font-medium">
                    {block.index}
                  </td>

                  {/* 3. Block Type */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {getBadgeIcon(block)}
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        {block.blockType.name}
                        {block.blockType.isSuggested && (
                          <span className="text-[10px] text-purple-600 font-normal">
                            (Suggested)
                          </span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* 4. Content / Preview */}
                  <td className="py-3 px-4">
                    {/* Text Preview */}
                    {block.contentPreview && (
                      <p className="text-slate-700 line-clamp-2 leading-relaxed font-normal">
                        {block.contentPreview}
                      </p>
                    )}

                    {/* Pills Preview (e.g. Two Column) */}
                    {block.pills && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {block.pills.map((pill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold"
                          >
                            {pill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bullet List Preview */}
                    {block.bullets && (
                      <ul className="space-y-0.5 text-slate-600">
                        {block.bullets.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                            <span className="truncate">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>

                  {/* 5. Confidence */}
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      <span
                        className={`font-bold ${
                          isHigh
                            ? 'text-emerald-600'
                            : isMedium
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {block.confidence}%
                      </span>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isHigh
                              ? 'bg-emerald-500'
                              : isMedium
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${block.confidence}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* 6. Reason */}
                  <td className="py-3 px-3">
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      {block.reason}
                    </p>
                  </td>

                  {/* 7. Action */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center gap-1">
                      {/* Accept toggle */}
                      <button
                        onClick={() => onAccept(block.id)}
                        title={block.status === 'accepted' ? 'Accepted' : 'Accept'}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                          block.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        <Check size={14} />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(block)}
                        title="Edit Block Suggestion"
                        className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Edit2 size={13} />
                      </button>

                      {/* Reject / Delete */}
                      <button
                        onClick={() => onReject(block.id)}
                        title="Reject Suggestion"
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                          block.status === 'rejected'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredBlocks.length)} of{' '}
          {filteredBlocks.length} blocks
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="w-7 h-7 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            1
          </button>
          {totalPages > 1 && (
            <button
              onClick={() => setCurrentPage(2)}
              className={`w-7 h-7 rounded flex items-center justify-center font-semibold cursor-pointer ${
                currentPage === 2
                  ? 'bg-[#f54a8d] text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              2
            </button>
          )}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-7 h-7 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            &gt;
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="w-7 h-7 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            &gt;&gt;
          </button>
        </div>
      </div>
    </div>
  );
}
