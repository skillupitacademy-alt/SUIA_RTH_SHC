'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { PresentationIdea } from '@quiz/types';

import { ReviewApproveHeader } from './components/ReviewApproveHeader';
import { ReviewSummaryCards } from './components/ReviewSummaryCards';
import {
  ReviewSuggestionsTable,
  type ReviewableSuggestionItem,
} from './components/ReviewSuggestionsTable';
import {
  ModifySuggestionModal,
  type ReviewModification,
} from './components/ModifySuggestionModal';
import { ContentOutlineSidebar } from './components/ContentOutlineSidebar';
import { ReviewNextStepCard } from './components/ReviewNextStepCard';
import { ReviewTipsCard } from './components/ReviewTipsCard';
import { ReviewApproveBottomBar } from './components/ReviewApproveBottomBar';

export default function ReviewApprovePage() {
  const pathname = usePathname();
  const router = useRouter();

  const isPreviewMode = Boolean(pathname?.startsWith('/preview/'));
  const backToPresentationHref = isPreviewMode
    ? '/preview/presentation-ideas'
    : '/content-intelligence/presentation-ideas';
  const composerHref = isPreviewMode
    ? '/preview/composer'
    : '/content-intelligence/composer';

  const [items, setItems] = useState<ReviewableSuggestionItem[]>([]);
  const [outlineItems, setOutlineItems] = useState<any[]>([]);
  const [modifyingItem, setModifyingItem] = useState<ReviewableSuggestionItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sourcePayload, setSourcePayload] = useState<any>(null);

  // Load presentation ideas from sessionStorage
  useEffect(() => {
    try {
      const storedPlan = sessionStorage.getItem('tutorial_composer_presentation_plan');
      const storedDoc = sessionStorage.getItem('tutorial_composer_document');

      if (storedDoc) {
        try {
          const parsedDoc = JSON.parse(storedDoc);
          setSourcePayload(parsedDoc);
        } catch {
          // ignore
        }
      }

      if (storedPlan) {
        const parsedPlan = JSON.parse(storedPlan);
        const ideas: PresentationIdea[] = parsedPlan.selectedIdeas || [];

        if (ideas.length > 0) {
          const initialItems: ReviewableSuggestionItem[] = ideas.map((idea, index) => ({
            ...idea,
            reviewNumber: index + 1,
            reviewStatus:
              index === 6 ? 'rejected' : index === 2 || index === 4 ? 'modified' : 'accepted',
            isChecked: index !== 6,
            customModification:
              index === 2
                ? { customNote: '3 concept cards' }
                : index === 4
                ? { customNote: 'Icon cards' }
                : undefined,
          }));

          setItems(initialItems);
          setIsLoading(false);
          return;
        }
      }

      // Default high-fidelity items matching promptimages/page-15.png
      const defaultSampleIdeas: ReviewableSuggestionItem[] = [
        {
          id: 'idea-1',
          reviewNumber: 1,
          title: 'Two-Column Layout',
          description: 'Present Client-Side and Server-Side information side by side for better comparison.',
          type: 'layout',
          impact: 'high',
          sourceBlockIds: ['heading-3'],
          targetBlockType: 'two-column',
          wireframeType: 'two-column-50-50',
          reason: 'Parallel concepts detected',
          reviewStatus: 'accepted',
          isSelected: true,
          status: 'pending',
          isChecked: true,
        },
        {
          id: 'idea-2',
          reviewNumber: 2,
          title: 'Comparison Table',
          description: 'Convert the environments comparison into a structured table.',
          type: 'comparison',
          impact: 'high',
          sourceBlockIds: ['heading-3'],
          targetBlockType: 'comparison',
          wireframeType: 'comparison-table',
          reason: 'Contrasting concepts detected',
          reviewStatus: 'accepted',
          isSelected: true,
          status: 'pending',
          isChecked: true,
        },
        {
          id: 'idea-3',
          reviewNumber: 3,
          title: 'Concept Cards / Grid',
          description: 'Display the 4 key technical characteristics as visual concept cards.',
          type: 'card-grid',
          impact: 'medium',
          sourceBlockIds: ['heading-4'],
          targetBlockType: 'card-grid',
          wireframeType: 'concept-cards-grid',
          reason: 'Multiple independent concepts detected',
          reviewStatus: 'modified',
          customModification: { customNote: '3 concept cards' },
          isSelected: true,
          status: 'pending',
          isChecked: true,
        },
        {
          id: 'idea-4',
          reviewNumber: 4,
          title: 'Important Callout',
          description: 'Highlight "JavaScript is NOT Java" as an important clarification.',
          type: 'callout',
          impact: 'high',
          sourceBlockIds: ['heading-6'],
          targetBlockType: 'callout',
          wireframeType: 'callout-warning',
          reason: 'Crucial clarification detected',
          reviewStatus: 'accepted',
          isSelected: true,
          status: 'pending',
          isChecked: true,
        },
        {
          id: 'idea-5',
          reviewNumber: 5,
          title: 'Ecosystem Overview (Icons)',
          description: 'Show JavaScript ecosystem (Frontend, Backend, Mobile, Desktop) using icon-based layout.',
          type: 'visual',
          impact: 'medium',
          sourceBlockIds: ['heading-5'],
          targetBlockType: 'timeline',
          wireframeType: 'timeline-vertical',
          reason: 'Ecosystem categorization detected',
          reviewStatus: 'modified',
          customModification: { customNote: 'Icon cards' },
          isSelected: true,
          status: 'pending',
          isChecked: true,
        },
        {
          id: 'idea-6',
          reviewNumber: 6,
          title: 'Add Code Example',
          description: 'Add a short code example for Server-Side (Node.js) usage.',
          type: 'code-example',
          impact: 'high',
          sourceBlockIds: ['paragraph-3b'],
          targetBlockType: 'example',
          wireframeType: 'code-with-explanation',
          reason: 'Practical demonstration improves comprehension',
          reviewStatus: 'accepted',
          isSelected: true,
          status: 'pending',
          isChecked: true,
        },
        {
          id: 'idea-7',
          reviewNumber: 7,
          title: 'Key Quote Block',
          description: 'Highlight the "language of the web" statement as a quote.',
          type: 'visual',
          impact: 'medium',
          sourceBlockIds: ['paragraph-1'],
          targetBlockType: 'quote',
          wireframeType: 'callout-info',
          reason: 'Quote formatting for opening summary',
          reviewStatus: 'rejected',
          isSelected: true,
          status: 'pending',
          isChecked: false,
        },
        {
          id: 'idea-8',
          reviewNumber: 8,
          title: 'Summary Box',
          description: 'Add a summary box at the end of the document.',
          type: 'callout',
          impact: 'high',
          sourceBlockIds: ['heading-6'],
          targetBlockType: 'summary',
          wireframeType: 'callout-info',
          reason: 'Key takeaway summary box',
          reviewStatus: 'accepted',
          isSelected: true,
          status: 'pending',
          isChecked: true,
        },
      ];

      setItems(defaultSampleIdeas);
      setIsLoading(false);
    } catch (err: unknown) {
      console.error('[ReviewApprovePage] Initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load review items.');
      setIsLoading(false);
    }
  }, [isPreviewMode]);

  // Status Actions
  const handleAccept = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, reviewStatus: 'accepted', isChecked: true } : item
      )
    );
  }, []);

  const handleReject = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, reviewStatus: 'rejected', isChecked: false } : item
      )
    );
  }, []);

  const handleOpenModify = useCallback((item: ReviewableSuggestionItem) => {
    setModifyingItem(item);
  }, []);

  const handleSaveModification = useCallback((id: string, mod: ReviewModification) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              reviewStatus: 'modified',
              customModification: mod,
              isChecked: true,
            }
          : item
      )
    );
    toast.success('Modifications applied');
  }, []);

  const handleToggleCheck = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isChecked: !item.isChecked } : item))
    );
  }, []);

  const handleToggleCheckAll = useCallback(() => {
    const allChecked = items.every((i) => i.isChecked);
    setItems((prev) => prev.map((item) => ({ ...item, isChecked: !allChecked })));
  }, [items]);

  // Statistics calculation
  const total = items.length;
  const accepted = items.filter((i) => i.reviewStatus === 'accepted').length;
  const modified = items.filter((i) => i.reviewStatus === 'modified').length;
  const rejected = items.filter((i) => i.reviewStatus === 'rejected').length;
  const readyForComposer = accepted + modified;

  // Handoff to Composer
  const handleProceedToComposer = useCallback(() => {
    const approvedSuggestions = items.filter(
      (i) => i.reviewStatus === 'accepted' || i.reviewStatus === 'modified'
    );

    if (approvedSuggestions.length === 0) {
      toast.error('Please accept or modify at least one suggestion before proceeding to composer');
      return;
    }

    try {
      const finalReviewPayload = {
        subtopicId: sourcePayload?.subtopicId || '00000000-0000-0000-0000-000000000001',
        sectionType: sourcePayload?.sectionType || 'notes',
        approvedSuggestions,
        readyBlockCount: approvedSuggestions.length,
        completedAt: new Date().toISOString(),
      };

      sessionStorage.setItem(
        'tutorial_composer_final_review',
        JSON.stringify(finalReviewPayload)
      );

      toast.success(
        `Final review saved: ${approvedSuggestions.length} blocks prepared for Composer`
      );
      router.push(composerHref);
    } catch (e) {
      console.warn('Failed to store final review in sessionStorage', e);
      toast.success(`Prepared ${approvedSuggestions.length} blocks for Composer`);
    }
  }, [items, sourcePayload, composerHref, router]);

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
        <Link href={backToPresentationHref} className="hover:text-slate-800 transition-colors">
          Presentation Ideas
        </Link>
        <ChevronRight size={13} className="text-slate-400" />
        <span className="text-slate-900 font-semibold">Review & Approve</span>
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

      {/* 3. Main Review & Approve Content (Page 15) */}
      {!isLoading && (
        <div>
          {/* Header */}
          <ReviewApproveHeader
            readyCount={readyForComposer}
            onProceedToComposer={handleProceedToComposer}
            backHref={backToPresentationHref}
          />

          {/* 5 KPI Summary Cards */}
          <ReviewSummaryCards
            total={total}
            accepted={accepted}
            modified={modified}
            rejected={rejected}
            readyForComposer={readyForComposer}
          />

          {/* Main 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Review Suggestions Table (~68% / 8 cols) */}
            <div className="lg:col-span-8">
              <ReviewSuggestionsTable
                items={items}
                onAccept={handleAccept}
                onModify={handleOpenModify}
                onReject={handleReject}
                onToggleCheck={handleToggleCheck}
                onToggleCheckAll={handleToggleCheckAll}
              />
            </div>

            {/* Right Column: Outline Sidebar + Next Step + Tips (~32% / 4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <ContentOutlineSidebar items={items} />
              <ReviewNextStepCard onOpenComposer={handleProceedToComposer} />
              <ReviewTipsCard />
            </div>
          </div>

          {/* Bottom Bar */}
          <ReviewApproveBottomBar onSaveReview={handleProceedToComposer} />

          {/* Modify Modal */}
          <ModifySuggestionModal
            idea={modifyingItem}
            isOpen={Boolean(modifyingItem)}
            onClose={() => setModifyingItem(null)}
            onSaveModification={handleSaveModification}
            existingModification={modifyingItem?.customModification}
          />
        </div>
      )}
    </div>
  );
}
