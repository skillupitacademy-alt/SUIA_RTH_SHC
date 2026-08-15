'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import type { ContentAnalysisResult } from '@quiz/types';

import { AnalysisHeader } from './components/AnalysisHeader';
import { AnalysisSummaryCards } from './components/AnalysisSummaryCards';
import { DetectedSectionOutline } from './components/DetectedSectionOutline';
import { ContentQualityIndicators } from './components/ContentQualityIndicators';
import { SmartSuggestionsCard } from './components/SmartSuggestionsCard';
import { AnalysisConfidenceCard } from './components/AnalysisConfidenceCard';
import { WhatWeDetectedCard } from './components/WhatWeDetectedCard';
import { WhatHappensNextPipeline } from './components/WhatHappensNextPipeline';
import { mockContentAnalysisResult } from './components/mockAnalysisData';

export default function ContentAnalysisPage() {
  const [data, setData] = useState<ContentAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async (documentPayload: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tutorial-composer/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document: documentPayload.document,
          subtopicId: documentPayload.subtopicId || '00000000-0000-0000-0000-000000000001',
          sectionType: documentPayload.sectionType || 'notes',
          brandId: documentPayload.brandId || 'skillhubcore',
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to view content analysis.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to analyze this content.');
        }
        throw new Error(json.error?.message || `Analysis failed with status ${response.status}`);
      }

      if (!json.data) {
        throw new Error('Invalid response received from analysis API.');
      }

      setData(json.data as ContentAnalysisResult);
    } catch (err: unknown) {
      console.error('[ContentAnalysisPage] API Error:', err);
      setError(err instanceof Error ? err.message : 'Unable to analyze content.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Retrieve TutorialDocument from previous import step
    try {
      const stored = sessionStorage.getItem('tutorial_composer_document');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.document) {
          fetchAnalysis(parsed);
          return;
        }
      }

      // 2. If running under preview route or standalone mode, construct canonical sample document
      const isPreview = typeof window !== 'undefined' && window.location.pathname.startsWith('/preview/');
      if (isPreview) {
        // Construct canonical TutorialDocument to trigger real analysis API
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
                content: { text: 'JavaScript is a programming language that makes websites interactive. While HTML gives a webpage structure and CSS gives it style, JavaScript is the engine that makes it come alive.' },
              },
              {
                id: 'heading-2',
                type: 'heading',
                content: { text: '1. What does it actually do? (The "Interactive" Part)', level: 2 },
              },
              {
                id: 'paragraph-2',
                type: 'paragraph',
                content: { text: 'When you click a button and a menu drops down, when you see live stock tickers update, or when a form validates—that is JavaScript.' },
              },
              {
                id: 'heading-3',
                type: 'heading',
                content: { text: '2. Where does it run? (The Two Sides)', level: 2 },
              },
              {
                id: 'heading-3a',
                type: 'heading',
                content: { text: 'Client-Side (Frontend)', level: 3 },
              },
              {
                id: 'paragraph-3a',
                type: 'paragraph',
                content: { text: 'This is its original home. The JavaScript code is sent to your web browser and executed on your computer or phone.' },
              },
              {
                id: 'heading-3b',
                type: 'heading',
                content: { text: 'Server-Side (Backend)', level: 3 },
              },
              {
                id: 'paragraph-3b',
                type: 'paragraph',
                content: { text: 'Thanks to Node.js, JavaScript can now run on web servers handling APIs, databases, and file systems.' },
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
                  items: [
                    'Single-threaded event-loop architecture',
                    'Dynamic and weak typing system',
                    'First-class functions supporting functional programming',
                  ],
                  ordered: false,
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
                content: { text: 'Very rarely do developers write plain, raw JavaScript anymore. Modern ecosystems rely on React, Next.js, and TypeScript.' },
              },
              {
                id: 'heading-6',
                type: 'heading',
                content: { text: '5. The Crucial Clarification: JavaScript is NOT Java', level: 2 },
              },
              {
                id: 'paragraph-6',
                type: 'paragraph',
                content: { text: 'Despite the similar name, they are completely different languages created by different teams for different purposes.' },
              },
              {
                id: 'quote-1',
                type: 'callout',
                content: {
                  text: 'Today, JavaScript is the undisputed "language of the web." According to Stack Overflow, it remains the most commonly used programming language.',
                  variant: 'info',
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

        fetchAnalysis(previewDocPayload);
        return;
      }

      // If production path with no document imported, show empty state
      setIsLoading(false);
      setData(null);
    } catch {
      setIsLoading(false);
      setData(null);
    }
  }, []);

  const handleRetry = () => {
    try {
      const stored = sessionStorage.getItem('tutorial_composer_document');
      if (stored) {
        fetchAnalysis(JSON.parse(stored));
      } else {
        setError('No imported document found. Please return to Import Content.');
      }
    } catch {
      setError('Unable to retry analysis.');
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
        <Link href="/content-intelligence/import" className="hover:text-slate-800 transition-colors">
          Import Content
        </Link>
        <ChevronRight size={13} className="text-slate-400" />
        <span className="text-slate-900 font-semibold">Content Analysis</span>
      </nav>

      {/* 2. Loading State */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-10 bg-slate-200 rounded-lg w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 h-96 bg-slate-200 rounded-xl" />
            <div className="lg:col-span-3 h-96 bg-slate-200 rounded-xl" />
            <div className="lg:col-span-3 h-96 bg-slate-200 rounded-xl" />
          </div>
        </div>
      )}

      {/* 3. Error State */}
      {!isLoading && error && (
        <div className="bg-white rounded-xl border border-rose-200 p-8 shadow-sm text-center max-w-lg mx-auto mt-12">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-2">Unable to Analyze Content</h2>
          <p className="text-xs text-slate-500 mb-6">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
            <Link
              href="/content-intelligence/import"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Import</span>
            </Link>
          </div>
        </div>
      )}

      {/* 4. Empty State */}
      {!isLoading && !error && !data && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center max-w-lg mx-auto mt-12">
          <h2 className="text-base font-bold text-slate-900 mb-2">No Analysis Available</h2>
          <p className="text-xs text-slate-500 mb-6">
            Please import raw content first to generate a structured content analysis.
          </p>
          <Link
            href="/content-intelligence/import"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Go to Import Content</span>
          </Link>
        </div>
      )}

      {/* 5. Main Content Analysis GUI (Page 12) */}
      {!isLoading && !error && data && (
        <div>
          {/* Header */}
          <AnalysisHeader />

          {/* Top 5 KPI Cards */}
          <AnalysisSummaryCards
            statistics={data.statistics}
            overallConfidence={data.overallConfidence}
          />

          {/* Main 3-Column Layout Matching Page 12 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Column 1: Detected Section Outline (~50% / 6 cols) */}
            <div className="lg:col-span-6">
              <DetectedSectionOutline sections={data.sectionOutline} />
            </div>

            {/* Column 2: Quality Indicators & Smart Suggestions (~25% / 3 cols) */}
            <div className="lg:col-span-3 space-y-6">
              <ContentQualityIndicators indicators={data.qualityIndicators} />
              <SmartSuggestionsCard suggestions={data.smartSuggestions} />
            </div>

            {/* Column 3: Analysis Confidence & What We Detected (~25% / 3 cols) */}
            <div className="lg:col-span-3 space-y-6">
              <AnalysisConfidenceCard overallConfidence={data.overallConfidence} />
              <WhatWeDetectedCard detectedElements={data.detectedElements} />
            </div>
          </div>

          {/* Bottom Workflow Pipeline: What happens next? */}
          <WhatHappensNextPipeline />
        </div>
      )}
    </div>
  );
}
