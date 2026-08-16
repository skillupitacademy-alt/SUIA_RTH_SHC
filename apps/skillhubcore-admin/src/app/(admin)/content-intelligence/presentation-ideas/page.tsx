'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type {
  PresentationIdea,
  PresentationIdeasResult,
  PresentationIdeasStatistics,
  ContextOutline,
  BestPractice,
} from '@quiz/types';

import { PresentationIdeasHeader } from './components/PresentationIdeasHeader';
import { PresentationSummaryCards } from './components/PresentationSummaryCards';
import { PresentationSuggestionsList } from './components/PresentationSuggestionsList';
import { ContentContextCard } from './components/ContentContextCard';
import { BestPracticesCard } from './components/BestPracticesCard';
import { PresentationIdeasTip } from './components/PresentationIdeasTip';
import { PreviewIdeaModal } from './components/PreviewIdeaModal';

const DEFAULT_STATISTICS: PresentationIdeasStatistics = {
  total: 0,
  high: 0,
  medium: 0,
  low: 0,
  byType: {
    layout: 0,
    comparison: 0,
    'card-grid': 0,
    timeline: 0,
    callout: 0,
    'code-example': 0,
    visual: 0,
    structure: 0,
  },
  enhancementTips: 0,
};

export default function PresentationIdeasPage() {
  const pathname = usePathname();
  const router = useRouter();

  const isPreviewMode = Boolean(pathname?.startsWith('/preview/'));
  const backToSuggestionsHref = isPreviewMode
    ? '/preview/block-suggestions'
    : '/content-intelligence/block-suggestions';
  const analysisHref = isPreviewMode
    ? '/preview/analysis'
    : '/content-intelligence/analysis';
  const importHref = isPreviewMode
    ? '/preview/raw-import'
    : '/content-intelligence/import';
  const reviewPlanHref = isPreviewMode
    ? '/preview/review-approve'
    : '/content-intelligence/review-approve';

  const [ideas, setIdeas] = useState<PresentationIdea[]>([]);
  const [statistics, setStatistics] = useState<PresentationIdeasStatistics>(DEFAULT_STATISTICS);
  const [contextOutline, setContextOutline] = useState<ContextOutline | undefined>(undefined);
  const [bestPractices, setBestPractices] = useState<BestPractice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewingIdea, setPreviewingIdea] = useState<PresentationIdea | null>(null);
  const [currentPayload, setCurrentPayload] = useState<any>(null);

  const fetchPresentationIdeas = useCallback(async (payload: any) => {
    setIsLoading(true);
    setError(null);
    setCurrentPayload(payload);

    try {
      const document = payload.document || (payload.blocks ? payload : null);
      if (!document || !Array.isArray(document.blocks)) {
        throw new Error('Invalid TutorialDocument: document blocks required.');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (isPreviewMode || process.env.NODE_ENV === 'development') {
        headers['x-tutorial-dev-bypass'] = 'true';
      }

      const subtopicId = payload.subtopicId || '00000000-0000-0000-0000-000000000001';
      const sectionType = payload.sectionType || 'notes';
      const brandId = payload.brandId || 'skillhubcore';

      // 1. Ensure Analysis Result is available
      let analysis = payload.analysis;
      if (!analysis) {
        const analysisRes = await fetch('/api/tutorial-composer/analysis', {
          method: 'POST',
          headers,
          body: JSON.stringify({ document, subtopicId, sectionType, brandId }),
        });

        if (!analysisRes.ok) {
          if (analysisRes.status === 401) throw new Error('Authentication required. Please log in.');
          if (analysisRes.status === 403) throw new Error('Access denied to tutorial analysis.');
          const errJson = await analysisRes.json();
          throw new Error(errJson.error?.message || 'Analysis calculation failed.');
        }

        const analysisJson = await analysisRes.json();
        analysis = analysisJson.data;
      }

      // 2. Ensure Block Suggestions Result is available
      let blockSuggestions = payload.blockSuggestions;
      if (!blockSuggestions) {
        const suggestionsRes = await fetch('/api/tutorial-composer/block-suggestions', {
          method: 'POST',
          headers,
          body: JSON.stringify({ document, analysis, subtopicId, sectionType, brandId }),
        });

        if (!suggestionsRes.ok) {
          if (suggestionsRes.status === 401) throw new Error('Authentication required. Please log in.');
          if (suggestionsRes.status === 403) throw new Error('Access denied to block suggestions.');
          const errJson = await suggestionsRes.json();
          throw new Error(errJson.error?.message || 'Block suggestions calculation failed.');
        }

        const suggestionsJson = await suggestionsRes.json();
        blockSuggestions = suggestionsJson.data?.data || suggestionsJson.data;
      }

      // 3. Call POST /api/tutorial-composer/presentation-ideas
      const response = await fetch('/api/tutorial-composer/presentation-ideas', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          document,
          analysis,
          blockSuggestions,
          subtopicId,
          sectionType,
          brandId,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        if (response.status === 401) throw new Error('Authentication required. Please log in.');
        if (response.status === 403) throw new Error('Access denied to presentation ideas.');
        throw new Error(json.error?.message || `Presentation engine failed with status ${response.status}`);
      }

      const result: PresentationIdeasResult = json.data?.data || json.data;

      if (!result || !Array.isArray(result.ideas)) {
        throw new Error('Invalid response structure received from Presentation Ideas API.');
      }

      // 4. Map result to state
      setIdeas(result.ideas);
      setStatistics(result.statistics || DEFAULT_STATISTICS);
      setContextOutline(result.contextOutline);
      setBestPractices(result.bestPractices || []);
    } catch (err: unknown) {
      console.error('[PresentationIdeasPage] API Error:', err);
      setError(err instanceof Error ? err.message : 'Unable to generate presentation ideas.');
      setIdeas([]);
    } finally {
      setIsLoading(false);
    }
  }, [isPreviewMode]);

  useEffect(() => {
    try {
      // 1. Retrieve stored document & reviewed blocks
      const storedDoc = sessionStorage.getItem('tutorial_composer_document');
      const storedReviewed = sessionStorage.getItem('tutorial_composer_reviewed_blocks');

      if (storedDoc) {
        const parsedDoc = JSON.parse(storedDoc);
        const doc = parsedDoc.document || (parsedDoc.blocks ? parsedDoc : null);

        if (doc && Array.isArray(doc.blocks) && doc.blocks.length > 0) {
          fetchPresentationIdeas({
            ...parsedDoc,
            reviewedBlocks: storedReviewed ? JSON.parse(storedReviewed) : undefined,
          });
          return;
        }
      }

      // 2. Standalone preview fallback
      if (isPreviewMode) {
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

        fetchPresentationIdeas(previewDocPayload);
        return;
      }

      setIsLoading(false);
      setIdeas([]);
    } catch {
      setIsLoading(false);
      setIdeas([]);
    }
  }, [fetchPresentationIdeas, isPreviewMode]);

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === id ? { ...idea, isSelected: !idea.isSelected } : idea
      )
    );
  };

  // Toggle select all
  const handleToggleSelectAll = () => {
    const allSelected = ideas.every((idea) => idea.isSelected);
    setIdeas((prev) =>
      prev.map((idea) => ({ ...idea, isSelected: !allSelected }))
    );
  };

  // Selected count
  const selectedCount = ideas.filter((idea) => idea.isSelected).length;

  // Apply Selected Ideas -> Page 15 handoff
  const handleApplySelected = () => {
    const selected = ideas.filter((idea) => idea.isSelected);
    if (selected.length === 0) {
      toast.error('Please select at least one presentation idea to apply');
      return;
    }

    try {
      const planPayload = {
        subtopicId: currentPayload?.subtopicId || '00000000-0000-0000-0000-000000000001',
        sectionType: currentPayload?.sectionType || 'notes',
        selectedIdeas: selected,
        totalSelected: selected.length,
        createdAt: new Date().toISOString(),
      };

      sessionStorage.setItem(
        'tutorial_composer_presentation_plan',
        JSON.stringify(planPayload)
      );

      toast.success(`Prepared ${selected.length} presentation ideas for Review & Approve`);
      router.push(reviewPlanHref);
    } catch (e) {
      console.warn('Failed to store presentation plan in sessionStorage', e);
      toast.success(`Prepared ${selected.length} presentation ideas`);
    }
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
        <Link href={backToSuggestionsHref} className="hover:text-slate-800 transition-colors">
          Block Suggestions
        </Link>
        <ChevronRight size={13} className="text-slate-400" />
        <span className="text-slate-900 font-semibold">Presentation Ideas</span>
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
          <h2 className="text-base font-bold text-slate-900 mb-2">Unable to Generate Presentation Ideas</h2>
          <p className="text-xs text-slate-500 mb-6">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => currentPayload && fetchPresentationIdeas(currentPayload)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f54a8d] hover:bg-[#e03a7a] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
            <Link
              href={backToSuggestionsHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Block Suggestions</span>
            </Link>
          </div>
        </div>
      )}

      {/* 4. Empty State */}
      {!isLoading && !error && ideas.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center max-w-lg mx-auto mt-12">
          <h2 className="text-base font-bold text-slate-900 mb-2">No Presentation Ideas Available</h2>
          <p className="text-xs text-slate-500 mb-6">
            Please complete Block Suggestions before generating presentation ideas.
          </p>
          <Link
            href={backToSuggestionsHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#f54a8d] hover:bg-[#e03a7a] text-white text-xs font-bold transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Block Suggestions</span>
          </Link>
        </div>
      )}

      {/* 5. Main Content Presentation Ideas GUI (Page 14) */}
      {!isLoading && !error && ideas.length > 0 && (
        <div>
          {/* Header */}
          <PresentationIdeasHeader
            selectedCount={selectedCount}
            onApplySelected={handleApplySelected}
            backHref={backToSuggestionsHref}
            nextHref={reviewPlanHref}
          />

          {/* Top 5 KPI Summary Cards */}
          <PresentationSummaryCards
            statistics={statistics}
            selectedCount={selectedCount}
          />

          {/* Main 2-Column Grid Matching Page 14 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Smart Presentation Suggestions (~68% / 8 cols) */}
            <div className="lg:col-span-8">
              <PresentationSuggestionsList
                ideas={ideas}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                onPreview={(idea) => setPreviewingIdea(idea)}
              />
            </div>

            {/* Right Column: Content Context + Best Practices (~32% / 4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <ContentContextCard contextOutline={contextOutline} />
              <BestPracticesCard
                bestPractices={bestPractices}
                analysisHref={analysisHref}
              />
            </div>
          </div>

          {/* Bottom Tip Banner */}
          <PresentationIdeasTip />

          {/* Preview Modal */}
          <PreviewIdeaModal
            idea={previewingIdea}
            isOpen={Boolean(previewingIdea)}
            onClose={() => setPreviewingIdea(null)}
            onToggleSelect={handleToggleSelect}
          />
        </div>
      )}
    </div>
  );
}
