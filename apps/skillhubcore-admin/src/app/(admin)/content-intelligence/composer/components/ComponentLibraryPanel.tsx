'use client';

import React, { useState } from 'react';
import {
  Search,
  Type,
  AlignLeft,
  Quote,
  List,
  ListOrdered,
  CheckSquare,
  Image,
  GitGraph,
  Table,
  Columns,
  Grid,
  AlertCircle,
  Code,
  Sparkles,
  GitCommit,
  BookOpen,
  Check,
} from 'lucide-react';
import type { ReviewableSuggestionItem } from '../../review-approve/components/ReviewSuggestionsTable';

interface ComponentLibraryPanelProps {
  onAddComponent: (blockType: string, initialContent?: any) => void;
  approvedSuggestions?: ReviewableSuggestionItem[];
  onApplySuggestion?: (suggestion: ReviewableSuggestionItem) => void;
}

export function ComponentLibraryPanel({
  onAddComponent,
  approvedSuggestions = [],
  onApplySuggestion,
}: ComponentLibraryPanelProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'components' | 'suggestions'>('components');

  const categories = [
    {
      name: 'TEXT',
      items: [
        { type: 'heading', label: 'Heading', icon: Type, desc: 'Section headings (H1-H6)' },
        { type: 'paragraph', label: 'Paragraph', icon: AlignLeft, desc: 'Body text and rich markdown' },
        { type: 'quote', label: 'Quote', icon: Quote, desc: 'Highlighted quotations' },
        { type: 'definition', label: 'Definition', icon: BookOpen, desc: 'Glossary term definitions' },
      ],
    },
    {
      name: 'LISTS',
      items: [
        { type: 'list', label: 'Bullet List', icon: List, desc: 'Unordered bullet items', style: 'unordered' },
        { type: 'list', label: 'Numbered List', icon: ListOrdered, desc: 'Sequential ordered steps', style: 'ordered' },
        { type: 'list', label: 'Checklist', icon: CheckSquare, desc: 'Interactive task checklist', style: 'checklist' },
      ],
    },
    {
      name: 'MEDIA & CODE',
      items: [
        { type: 'code', label: 'Code Block', icon: Code, desc: 'Syntax highlighted code' },
        { type: 'image', label: 'Image', icon: Image, desc: 'Media image with caption' },
        { type: 'diagram', label: 'Diagram', icon: GitGraph, desc: 'Flowchart or architecture diagram' },
        { type: 'example', label: 'Example Block', icon: Sparkles, desc: 'Structured code + explanation' },
      ],
    },
    {
      name: 'DATA & LAYOUTS',
      items: [
        { type: 'table', label: 'Table', icon: Table, desc: 'Structured data table' },
        { type: 'comparison', label: 'Comparison Table', icon: Table, desc: 'Side-by-side comparison' },
        { type: 'callout', label: 'Callout Box', icon: AlertCircle, desc: 'Important tips, warnings or info' },
        { type: 'two-column', label: 'Two-Column Layout', icon: Columns, desc: 'Parallel side-by-side layout' },
        { type: 'card-grid', label: 'Card Grid', icon: Grid, desc: 'Concept cards or icon grid' },
        { type: 'timeline', label: 'Timeline', icon: GitCommit, desc: 'Chronological roadmap or flow' },
      ],
    },
  ];

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.desc.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Components
          </span>
          {approvedSuggestions.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-[#f54a8d] border border-pink-200">
              {approvedSuggestions.length} Approved Ideas
            </span>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold mb-3">
          <button
            onClick={() => setActiveTab('components')}
            className={`flex-1 py-1 rounded-md transition-colors text-center cursor-pointer ${
              activeTab === 'components'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Library
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 py-1 rounded-md transition-colors text-center cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'suggestions'
                ? 'bg-white text-[#f54a8d] shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles size={12} />
            <span>Approved ({approvedSuggestions.length})</span>
          </button>
        </div>

        {/* Search */}
        {activeTab === 'components' && (
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search components..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#f54a8d] outline-none"
            />
          </div>
        )}
      </div>

      {/* Panel Body */}
      <div className="p-3.5 space-y-4 overflow-y-auto flex-1 max-h-[calc(100vh-280px)]">
        {activeTab === 'components' ? (
          filteredCategories.map((cat, idx) => (
            <div key={idx} className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                {cat.name}
              </span>
              <div className="space-y-1">
                {cat.items.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={i}
                      onClick={() =>
                        onAddComponent(item.type, (item as any).style ? { style: (item as any).style } : undefined)
                      }
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg border border-slate-100 hover:border-pink-200 hover:bg-pink-50/40 text-left transition-all group cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-md bg-slate-100 group-hover:bg-[#f54a8d] text-slate-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                        <Icon size={13} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-900 block truncate">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {item.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-2.5">
            {approvedSuggestions.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No approved suggestions from Page 15.
              </div>
            ) : (
              approvedSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-pink-300 bg-slate-50/50 hover:bg-pink-50/30 transition-all text-xs"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-900 text-[11px] truncate">
                      {suggestion.customModification?.customTitle || suggestion.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700">
                      {suggestion.reviewStatus}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mb-2 leading-tight">
                    {suggestion.description}
                  </p>
                  <button
                    onClick={() => onApplySuggestion?.(suggestion)}
                    className="w-full flex items-center justify-center gap-1 py-1 rounded bg-[#f54a8d] hover:bg-[#e03a7a] text-white text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    <Sparkles size={11} />
                    <span>Apply to Canvas</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
