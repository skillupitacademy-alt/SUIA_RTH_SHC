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

  useEffect(() => {
    // Check if imported document data was stored in sessionStorage or use standard analysis result
    try {
      const stored = sessionStorage.getItem('tutorial_analysis_result');
      if (stored) {
        setData(JSON.parse(stored));
      } else {
        // Use authoritative Page 12 reference data
        setData(mockContentAnalysisResult);
      }
    } catch {
      setData(mockContentAnalysisResult);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      setData(mockContentAnalysisResult);
      setIsLoading(false);
    }, 400);
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
