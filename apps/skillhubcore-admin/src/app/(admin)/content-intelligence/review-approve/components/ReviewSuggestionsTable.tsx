'use client';

import React, { useState } from 'react';
import { Check, Edit3, X, ChevronDown } from 'lucide-react';
import type { PresentationIdea } from '@quiz/types';
import { WireframeIllustrations } from '../../presentation-ideas/components/WireframeIllustrations';
import type { ReviewModification } from './ModifySuggestionModal';

export interface ReviewableSuggestionItem extends PresentationIdea {
  reviewNumber: number;
  reviewStatus: 'accepted' | 'modified' | 'rejected' | 'pending';
  customModification?: ReviewModification;
  isChecked?: boolean;
}

interface ReviewSuggestionsTableProps {
  items: ReviewableSuggestionItem[];
  onAccept: (id: string) => void;
  onModify: (item: ReviewableSuggestionItem) => void;
  onReject: (id: string) => void;
  onToggleCheck: (id: string) => void;
  onToggleCheckAll: () => void;
}

export function ReviewSuggestionsTable({
  items,
  onAccept,
  onModify,
  onReject,
  onToggleCheck,
  onToggleCheckAll,
}: ReviewSuggestionsTableProps) {
  const [filter, setFilter] = useState<'all' | 'accepted' | 'modified' | 'rejected' | 'pending'>('all');

  const filteredItems = items.filter((item) => {
    if (filter === 'accepted') return item.reviewStatus === 'accepted';
    if (filter === 'modified') return item.reviewStatus === 'modified';
    if (filter === 'rejected') return item.reviewStatus === 'rejected';
    if (filter === 'pending') return item.reviewStatus === 'pending';
    return true;
  });

  const allChecked = filteredItems.length > 0 && filteredItems.every((i) => i.isChecked);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900">
            Suggestions ({items.length})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Show:
          </span>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#f54a8d]"
            >
              <option value="all">All Suggestions</option>
              <option value="accepted">Accepted</option>
              <option value="modified">Modified</option>
              <option value="rejected">Rejected</option>
              <option value="pending">Pending</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Suggestion Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={onToggleCheckAll}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#f54a8d] focus:ring-[#f54a8d] cursor-pointer"
                />
              </th>
              <th className="p-3.5 w-8 text-center">#</th>
              <th className="p-3.5 min-w-[240px]">Suggestion</th>
              <th className="p-3.5 w-24">Type</th>
              <th className="p-3.5 w-24">Impact</th>
              <th className="p-3.5 min-w-[200px]">Action</th>
              <th className="p-3.5 w-32">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const isAccepted = item.reviewStatus === 'accepted';
              const isModified = item.reviewStatus === 'modified';
              const isRejected = item.reviewStatus === 'rejected';

              const isHigh = item.impact === 'high';
              const isMedium = item.impact === 'medium';

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isRejected ? 'opacity-60 bg-rose-50/10' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="p-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={item.isChecked ?? true}
                      onChange={() => onToggleCheck(item.id)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#f54a8d] focus:ring-[#f54a8d] cursor-pointer"
                    />
                  </td>

                  {/* Review Number */}
                  <td className="p-3.5 text-center font-bold text-slate-400">
                    {item.reviewNumber}
                  </td>

                  {/* Suggestion Details with Wireframe */}
                  <td className="p-3.5">
                    <div className="flex items-start gap-3">
                      <WireframeIllustrations
                        wireframeType={item.wireframeType}
                        className="scale-90 origin-top-left"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 text-xs block mb-0.5">
                          {item.customModification?.customTitle || item.title}
                        </span>
                        <p className="text-slate-500 text-[11px] leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Type Badge */}
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold capitalize border border-slate-200/60 inline-block">
                      {item.type}
                    </span>
                  </td>

                  {/* Impact with visual dots */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isHigh ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                        />
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isHigh ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-slate-200'
                          }`}
                        />
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isHigh ? 'bg-emerald-500' : isMedium ? 'bg-slate-200' : 'bg-slate-200'
                          }`}
                        />
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isHigh ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-600 capitalize">
                        {item.impact}
                      </span>
                    </div>
                  </td>

                  {/* Actions Group (Accept / Modify / Reject) */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5">
                      {/* Accept Button */}
                      <button
                        onClick={() => onAccept(item.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                          isAccepted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                        }`}
                      >
                        <Check size={12} className={isAccepted ? 'text-emerald-600' : 'text-slate-400'} />
                        <span>Accept</span>
                      </button>

                      {/* Modify Button */}
                      <button
                        onClick={() => onModify(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                          isModified
                            ? 'bg-amber-50 text-amber-700 border border-amber-300 font-bold'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                        }`}
                      >
                        <Edit3 size={12} className={isModified ? 'text-amber-600' : 'text-slate-400'} />
                        <span>Modify</span>
                      </button>

                      {/* Reject Button */}
                      <button
                        onClick={() => onReject(item.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                          isRejected
                            ? 'bg-rose-50 text-rose-700 border border-rose-300 font-bold'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                        }`}
                      >
                        <X size={12} className={isRejected ? 'text-rose-600' : 'text-slate-400'} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </td>

                  {/* Status Indicator */}
                  <td className="p-3.5">
                    {isAccepted && (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <span>Accepted</span>
                        <Check size={14} className="stroke-[3]" />
                      </div>
                    )}
                    {isModified && (
                      <div className="flex flex-col text-amber-700">
                        <div className="flex items-center gap-1 font-bold">
                          <span>Modified</span>
                          <Edit3 size={12} />
                        </div>
                        {item.customModification?.customNote && (
                          <span className="text-[10px] text-amber-600/90 truncate max-w-[120px]">
                            ({item.customModification.customNote})
                          </span>
                        )}
                      </div>
                    )}
                    {isRejected && (
                      <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                        <span>Rejected</span>
                        <X size={14} className="stroke-[3]" />
                      </div>
                    )}
                    {!isAccepted && !isModified && !isRejected && (
                      <span className="text-slate-400 text-[11px] font-medium">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
