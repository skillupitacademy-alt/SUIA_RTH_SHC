'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { BlockSuggestionsHeader } from './components/BlockSuggestionsHeader';
import { SuggestionSummaryCards } from './components/SuggestionSummaryCards';
import { SuggestedBlocksTable } from './components/SuggestedBlocksTable';
import { ContentPreviewSidebarCard } from './components/ContentPreviewSidebarCard';
import { DetectionLegendCard } from './components/DetectionLegendCard';
import { QuickActionsCard } from './components/QuickActionsCard';
import { BlockSuggestionsTip } from './components/BlockSuggestionsTip';
import { EditSuggestionModal } from './components/EditSuggestionModal';
import {
  mockSummaryData,
  mockSuggestedBlocks,
  type SuggestedBlockItem,
  type BlockSuggestionsSummaryData,
} from './components/mockBlockSuggestionsData';

export default function BlockSuggestionsPage() {
  const [summary] = useState<BlockSuggestionsSummaryData>(mockSummaryData);
  const [blocks, setBlocks] = useState<SuggestedBlockItem[]>(mockSuggestedBlocks);
  const [editingBlock, setEditingBlock] = useState<SuggestedBlockItem | null>(null);

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isSelected: !b.isSelected } : b))
    );
  };

  // Toggle select all
  const handleToggleSelectAll = () => {
    const allSelected = blocks.every((b) => b.isSelected);
    setBlocks((prev) => prev.map((b) => ({ ...b, isSelected: !allSelected })));
  };

  // Accept suggestion
  const handleAccept = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: b.status === 'accepted' ? 'pending' : 'accepted',
              isSelected: b.status !== 'accepted',
            }
          : b
      )
    );
    toast.success('Suggestion review status updated');
  };

  // Reject suggestion
  const handleReject = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: b.status === 'rejected' ? 'pending' : 'rejected',
              isSelected: false,
            }
          : b
      )
    );
    toast.info('Suggestion rejected');
  };

  // Save edited block
  const handleSaveEdit = (updatedBlock: SuggestedBlockItem) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b))
    );
    toast.success(`Updated block #${updatedBlock.index}`);
  };

  // Quick actions
  const handleRegenerate = () => {
    setBlocks(mockSuggestedBlocks);
    toast.success('Regenerated suggestions from latest analysis');
  };

  const handleRejectAll = () => {
    setBlocks((prev) =>
      prev.map((b) => ({ ...b, isSelected: false, status: 'rejected' }))
    );
    toast.info('Rejected all suggestions');
  };

  // Selected count
  const selectedCount = blocks.filter((b) => b.isSelected).length;

  const handleAddToComposer = () => {
    const selected = blocks.filter((b) => b.isSelected);
    if (selected.length === 0) {
      toast.error('Please select at least one block to add to composer');
      return;
    }
    toast.success(`Prepared ${selected.length} blocks for Composer working state`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-8">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
        <Link href="/dashboard" className="hover:text-slate-800 transition-colors">
          Dashboard
        </Link>
        <ChevronRight size={13} className="text-slate-400" />
        <span className="text-slate-500">Content Intelligence</span>
        <ChevronRight size={13} className="text-slate-400" />
        <Link
          href="/content-intelligence/analysis"
          className="hover:text-slate-800 transition-colors"
        >
          Content Analysis
        </Link>
        <ChevronRight size={13} className="text-slate-400" />
        <span className="text-slate-900 font-semibold">Block Suggestions</span>
      </nav>

      {/* 2. Page Header */}
      <BlockSuggestionsHeader
        selectedCount={selectedCount}
        onAddToComposer={handleAddToComposer}
      />

      {/* 3. Top 5 Summary Cards */}
      <SuggestionSummaryCards summary={summary} />

      {/* 4. Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Table (~68% / 8 cols) */}
        <div className="lg:col-span-8">
          <SuggestedBlocksTable
            blocks={blocks}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onAccept={handleAccept}
            onReject={handleReject}
            onEdit={(block) => setEditingBlock(block)}
          />
        </div>

        {/* Right Sidebar (~32% / 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <ContentPreviewSidebarCard />
          <DetectionLegendCard />
          <QuickActionsCard
            onRegenerate={handleRegenerate}
            onRejectAll={handleRejectAll}
          />
        </div>
      </div>

      {/* 5. Bottom Tip Banner */}
      <BlockSuggestionsTip />

      {/* Edit Modal */}
      <EditSuggestionModal
        block={editingBlock}
        isOpen={Boolean(editingBlock)}
        onClose={() => setEditingBlock(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
