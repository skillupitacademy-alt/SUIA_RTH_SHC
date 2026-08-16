'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { BlockSuggestion, BlockSuggestionResult } from '@quiz/types';

import { BlockSuggestionsHeader } from './components/BlockSuggestionsHeader';
import { SuggestionSummaryCards } from './components/SuggestionSummaryCards';
import { SuggestedBlocksTable } from './components/SuggestedBlocksTable';
import { ContentPreviewSidebarCard } from './components/ContentPreviewSidebarCard';
import { DetectionLegendCard } from './components/DetectionLegendCard';
import { QuickActionsCard } from './components/QuickActionsCard';
import { BlockSuggestionsTip } from './components/BlockSuggestionsTip';
import { EditSuggestionModal } from './components/EditSuggestionModal';
import type {
  SuggestedBlockItem,
  BlockSuggestionsSummaryData,
} from './components/mockBlockSuggestionsData';

const DEFAULT_SUMMARY: BlockSuggestionsSummaryData = {
  totalSuggested: 0,
  highConfidenceCount: 0,
  mediumConfidenceCount: 0,
  lowConfidenceCount: 0,
  sectionsCount: 0,
};

function mapBlockSuggestionToItem(b: BlockSuggestion, index: number): SuggestedBlockItem {
  let badge = 'T';
  let badgeColor: SuggestedBlockItem['blockType']['badgeColor'] = 'blue';
  let category: SuggestedBlockItem['category'] = 'paragraph';

  const type = b.blockType.toLowerCase();

  if (type.includes('heading')) {
    if (b.title.toLowerCase().includes('1') || b.preview.toLowerCase().includes('h1')) {
      badge = 'H1';
      badgeColor = 'navy';
    } else {
      badge = 'H2';
      badgeColor = 'pink';
    }
    category = 'heading';
  } else if (
    type.includes('two-column') ||
    type.includes('comparison') ||
    type.includes('card') ||
    type.includes('diagram') ||
    type.includes('timeline')
  ) {
    badge = type.includes('two-column')
      ? 'Two Column'
      : type.includes('comparison')
      ? 'Comparison'
      : 'Component';
    badgeColor = 'purple';
    category = 'component';
  } else if (type.includes('callout') || type.includes('definition')) {
    badge = type.includes('callout') ? 'Callout' : 'Def';
    badgeColor = 'amber';
    category = 'component';
  } else if (type.includes('code')) {
    badge = 'Code';
    badgeColor = 'slate';
    category = 'code';
  } else if (type.includes('list')) {
    badge = 'List';
    badgeColor = 'blue';
    category = 'list';
  }

  let pills: string[] | undefined;
  let bullets: string[] | undefined;

  if (type.includes('two-column') && b.preview.includes('vs')) {
    pills = b.preview
      .split(/\s*vs\s*/i)
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (type.includes('list') && b.preview.includes('\n')) {
    bullets = b.preview
      .split('\n')
      .map((s) => s.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);
  }

  return {
    id: b.id,
    index: index + 1,
    origin: b.kind,
    category,
    blockType: {
      name: b.title,
      badge,
      badgeColor,
      isSuggested: b.kind === 'suggested',
    },
    contentPreview: b.preview,
    pills,
    bullets,
    confidence: b.confidence,
    reason: b.reason,
    status: b.status || (b.kind === 'existing' ? 'accepted' : 'pending'),
    isSelected: b.kind === 'existing' || b.confidence >= 80,
  };
}

export default function BlockSuggestionsPage() {
  const [summary, setSummary] = useState<BlockSuggestionsSummaryData>(DEFAULT_SUMMARY);
  const [blocks, setBlocks] = useState<SuggestedBlockItem[]>([]);
  const [rawText, setRawText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<SuggestedBlockItem | null>(null);
  const [currentPayload, setCurrentPayload] = useState<any>(null);

  const fetchBlockSuggestions = useCallback(async (payload: any) => {
    setIsLoading(true);
    setError(null);
    setCurrentPayload(payload);

    try {
      const document = payload.document || (payload.blocks ? payload : null);
      if (!document || !Array.isArray(document.blocks)) {
        throw new Error('Invalid TutorialDocument: document blocks required.');
      }

      let analysis = payload.analysis;

      const isPreview =
        typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/preview/') ||
          process.env.NODE_ENV === 'development');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (isPreview) {
        headers['x-tutorial-dev-bypass'] = 'true';
      }

      // 1. If analysis is not yet present in payload, fetch it first
      if (!analysis) {
        const analysisRes = await fetch('/api/tutorial-composer/analysis', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            document,
            subtopicId: payload.subtopicId || '00000000-0000-0000-0000-000000000001',
            sectionType: payload.sectionType || 'notes',
            brandId: payload.brandId || 'skillhubcore',
          }),
        });

        if (!analysisRes.ok) {
          if (analysisRes.status === 401) {
            throw new Error('Authentication required. Please log in.');
          }
          if (analysisRes.status === 403) {
            throw new Error('Access denied to tutorial analysis.');
          }
          const errJson = await analysisRes.json();
          throw new Error(errJson.error?.message || 'Analysis calculation failed.');
        }

        const analysisJson = await analysisRes.json();
        analysis = analysisJson.data;
      }

      // 2. Call POST /api/tutorial-composer/block-suggestions
      const response = await fetch('/api/tutorial-composer/block-suggestions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          document,
          analysis,
          subtopicId: payload.subtopicId || '00000000-0000-0000-0000-000000000001',
          sectionType: payload.sectionType || 'notes',
          brandId: payload.brandId || 'skillhubcore',
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to view suggestions.');
        }
        throw new Error(json.error?.message || `Suggestion engine failed with status ${response.status}`);
      }

      const result: BlockSuggestionResult = json.data?.data || json.data;

      if (!result || !result.blocks) {
        throw new Error('Invalid response structure received from Block Suggestion API.');
      }

      // 3. Map result to state
      setSummary({
        totalSuggested: result.statistics.totalBlocks,
        highConfidenceCount: result.statistics.highConfidence,
        mediumConfidenceCount: result.statistics.mediumConfidence,
        lowConfidenceCount: result.statistics.lowConfidence,
        sectionsCount: result.statistics.sectionsDetected,
      });

      setBlocks(result.blocks.map(mapBlockSuggestionToItem));
      if (result.sourcePreview?.raw) {
        setRawText(result.sourcePreview.raw);
      }
    } catch (err: unknown) {
      console.error('[BlockSuggestionsPage] API Error:', err);
      setError(err instanceof Error ? err.message : 'Unable to generate block suggestions.');
      setBlocks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      // 1. Retrieve stored document
      const stored = sessionStorage.getItem('tutorial_composer_document');
      if (stored) {
        const parsed = JSON.parse(stored);
        const doc = parsed.document || (parsed.blocks ? parsed : null);
        if (doc && Array.isArray(doc.blocks) && doc.blocks.length > 0) {
          fetchBlockSuggestions(parsed);
          return;
        }
      }

      // 2. Standalone preview fallback
      const isPreview =
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/preview/');

      if (isPreview) {
        const previewDocPayload = {
          subtopicId: '00000000-0000-0000-0000-000000000001',
          sectionType: 'notes',
          brandId: 'skillhubcore',
          document: {
            schemaVersion: 1,
            blocks: [
              {
                id: 'heading-1',
                type: 'heading',
                content: { text: 'JavaScript', level: 1 },
              },
              {
                id: 'paragraph-1',
                type: 'paragraph',
                content: {
                  text: 'JavaScript is a programming language that makes websites interactive. While HTML gives a webpage structure and CSS gives it style, JavaScript is the engine that makes it come alive.',
                },
              },
              {
                id: 'heading-2',
                type: 'heading',
                content: { text: '1. What does it actually do? (The "Interactive" Part)', level: 2 },
              },
              {
                id: 'paragraph-2',
                type: 'paragraph',
                content: {
                  text: 'When you click a button and a menu drops down, when you see live stock tickers update, when a form validates—that is JavaScript.',
                },
              },
              {
                id: 'heading-3',
                type: 'heading',
                content: { text: '2. Where does it run? (The Two Sides)', level: 2 },
              },
              {
                id: 'paragraph-3a',
                type: 'paragraph',
                content: {
                  text: 'Client-Side JavaScript executes in web browsers like Chrome and Safari directly on the user device.',
                },
              },
              {
                id: 'paragraph-3b',
                type: 'paragraph',
                content: {
                  text: 'Server-Side JavaScript runs on backend environments like Node.js handling databases and APIs.',
                },
              },
              {
                id: 'heading-4',
                type: 'heading',
                content: { text: '3. Key Technical Characteristics (The "Nerdy" Bits)', level: 2 },
              },
              {
                id: 'list-1',
                type: 'list',
                content: {
                  style: 'unordered',
                  items: [
                    { text: 'Single-threaded event-loop architecture' },
                    { text: 'Dynamic and weak typing system' },
                    { text: 'First-class functions supporting functional programming' },
                  ],
                },
              },
              {
                id: 'heading-5',
                type: 'heading',
                content: { text: '4. The JavaScript Ecosystem (Frameworks)', level: 2 },
              },
              {
                id: 'paragraph-5',
                type: 'paragraph',
                content: {
                  text: 'Very rarely do developers write plain, raw JavaScript anymore. Modern ecosystems rely on React, Next.js, and TypeScript.',
                },
              },
              {
                id: 'heading-6',
                type: 'heading',
                content: { text: '5. The Crucial Clarification: JavaScript is NOT Java', level: 2 },
              },
              {
                id: 'callout-1',
                type: 'callout',
                content: {
                  text: 'Important: Despite the similar name, JavaScript and Java are completely different languages created by different teams for different purposes.',
                  variant: 'warning',
                },
              },
            ],
            metadata: {
              estimatedReadTime: 2,
              tags: ['javascript', 'web-development'],
              complexityScore: 5,
            },
          },
        };

        fetchBlockSuggestions(previewDocPayload);
        return;
      }

      // Production path without document
      setIsLoading(false);
      setBlocks([]);
    } catch {
      setIsLoading(false);
      setBlocks([]);
    }
  }, [fetchBlockSuggestions]);

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
    if (currentPayload) {
      toast.info('Regenerating suggestions from API...');
      fetchBlockSuggestions(currentPayload);
    } else {
      toast.error('No document available to regenerate');
    }
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

    try {
      sessionStorage.setItem(
        'tutorial_composer_reviewed_blocks',
        JSON.stringify({
          selectedBlocks: selected,
          totalCount: selected.length,
          savedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.warn('Failed to store reviewed blocks in sessionStorage', e);
    }

    toast.success(`Prepared ${selected.length} blocks for Composer working state`);
  };

  const pathname = usePathname();
  const isPreviewMode = Boolean(pathname?.startsWith('/preview/'));
  const backToAnalysisHref = isPreviewMode
    ? '/preview/analysis'
    : '/content-intelligence/analysis';
  const presentationIdeasHref = isPreviewMode
    ? '/preview/presentation-ideas'
    : '/content-intelligence/presentation-ideas';
  const importHref = isPreviewMode
    ? '/preview/raw-import'
    : '/content-intelligence/import';

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
          href={backToAnalysisHref}
          className="hover:text-slate-800 transition-colors"
        >
          Content Analysis
        </Link>
        <ChevronRight size={13} className="text-slate-400" />
        <span className="text-slate-900 font-semibold">Block Suggestions</span>
      </nav>

      {/* 2. Loading State */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-10 bg-slate-200 rounded-lg w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-slate-200 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 h-96 bg-slate-200 rounded-xl" />
            <div className="lg:col-span-4 h-96 bg-slate-200 rounded-xl" />
          </div>
        </div>
      )}

      {/* 3. Error State */}
      {!isLoading && error && (
        <div className="bg-white rounded-xl border border-rose-200 p-8 shadow-sm text-center max-w-lg mx-auto mt-12">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-2">Unable to Generate Suggestions</h2>
          <p className="text-xs text-slate-500 mb-6">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => currentPayload && fetchBlockSuggestions(currentPayload)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f54a8d] hover:bg-[#e03a7a] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
            <Link
              href={backToAnalysisHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Analysis</span>
            </Link>
          </div>
        </div>
      )}

      {/* 4. Empty State */}
      {!isLoading && !error && blocks.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center max-w-lg mx-auto mt-12">
          <h2 className="text-base font-bold text-slate-900 mb-2">No Suggestions Available</h2>
          <p className="text-xs text-slate-500 mb-6">
            Please import and analyze content first to generate intelligent block suggestions.
          </p>
          <Link
            href={importHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#f54a8d] hover:bg-[#e03a7a] text-white text-xs font-bold transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Go to Import Content</span>
          </Link>
        </div>
      )}

      {/* 5. Main Content Block Suggestions GUI */}
      {!isLoading && !error && blocks.length > 0 && (
        <div>
          {/* Header */}
          <BlockSuggestionsHeader
            selectedCount={selectedCount}
            onAddToComposer={handleAddToComposer}
            backHref={backToAnalysisHref}
            nextHref={presentationIdeasHref}
          />

          {/* Top 5 KPI Summary Cards */}
          <SuggestionSummaryCards summary={summary} />

          {/* Main 2-Column Grid Matching Page 13 */}
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
              <ContentPreviewSidebarCard rawText={rawText} />
              <DetectionLegendCard />
              <QuickActionsCard
                onRegenerate={handleRegenerate}
                onRejectAll={handleRejectAll}
              />
            </div>
          </div>

          {/* Bottom Tip Banner */}
          <BlockSuggestionsTip />

          {/* Edit Modal */}
          <EditSuggestionModal
            block={editingBlock}
            isOpen={Boolean(editingBlock)}
            onClose={() => setEditingBlock(null)}
            onSave={handleSaveEdit}
          />
        </div>
      )}
    </div>
  );
}
