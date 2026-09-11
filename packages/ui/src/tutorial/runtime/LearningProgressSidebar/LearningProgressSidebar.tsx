/**
 * Learning Progress Sidebar - Main Container
 * 
 * Prototype Authority: ILS_UI_UX/index.html + style.css
 * 100% visual/structural parity required
 */

'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useILS } from '../ILSProvider';
import { OverallProgressCard } from './OverallProgressCard';
import { LifecycleMetrics } from './LifecycleMetrics';
import { EngagementMetrics } from './EngagementMetrics';
import { TimeAnalysisMetrics } from './TimeAnalysisMetrics';

export interface LearningProgressSidebarProps {
  /**
   * Sidebar open/closed state
   * Presentation state only - not learning state
   */
  isOpen: boolean;
  
  /**
   * Close handler
   */
  onClose: () => void;
  
  /**
   * Brand configuration for primary/secondary colors
   * Source: useBrand() from production brandConfig.ts
   */
  brand: {
    primaryColor: string;
    secondaryColor: string;
  };
}

/**
 * RSSB Main Container
 * 
 * STRUCTURE (from prototype):
 * - Overlay (backdrop with blur, onClick → close)
 * - Panel (fixed right, 440px, slide transition)
 *   - Header (title + close button)
 *   - Scroll Content (4 sections with 24px gap)
 *     1. Overall Progress (brand.primaryColor)
 *     2. Lifecycle Metrics (brand.secondaryColor)
 *     3. Engagement Metrics (#ff7300 FIXED)
 *     4. Time Analysis (#0091d5 FIXED)
 * 
 * DATA SOURCE: useILS() only (passive consumer)
 * NO manual block selector (follows ActiveBlockContext automatically)
 */
export function LearningProgressSidebar({ isOpen, onClose, brand }: LearningProgressSidebarProps) {
  const { overallProgress, activeBlockProgress, loading } = useILS();
  
  return (
    <>
      {/* Backdrop Overlay - ILS_UI_UX/style.css line 30-42 */}
      <div
        className={`fixed inset-0 z-[100] bg-[rgba(15,23,42,0.35)] backdrop-blur-[2px] transition-all duration-300 ${
          isOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sidebar Panel - ILS_UI_UX/style.css line 44-56 */}
      <aside
        className={`fixed right-0 top-0 z-[101] flex h-screen w-[440px] max-w-[90vw] flex-col bg-white text-[#1e293b] shadow-[-10px_0_30px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header - ILS_UI_UX/style.css line 59-72 */}
        <header className="flex items-center justify-between border-b border-[#edf2f7] px-[28px] py-[24px]">
          <h2 className="text-[20px] font-bold text-[#1a202c]">
            Learning Progress
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="border-none bg-transparent text-[28px] leading-none text-[#a0aec0] transition-colors duration-150 hover:text-[#1a202c]"
            aria-label="Close sidebar"
          >
            <X className="h-7 w-7" />
          </button>
        </header>
        
        {/* Scrollable Content - ILS_UI_UX/style.css line 76-89 */}
        <div className="flex flex-col gap-[24px] overflow-y-auto px-[28px] py-[24px] scrollbar-none">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Loading progress...
            </div>
          ) : (
            <>
              {/* Section 1: Overall Progress */}
              <OverallProgressCard 
                overallProgress={overallProgress}
                brand={brand}
              />
              
              {/* Section 2: Lifecycle Metrics */}
              <LifecycleMetrics
                activeBlockProgress={activeBlockProgress}
                brand={brand}
              />
              
              {/* Section 3: Engagement Metrics */}
              <EngagementMetrics
                activeBlockProgress={activeBlockProgress}
              />
              
              {/* Section 4: Time Analysis */}
              <TimeAnalysisMetrics
                activeBlockProgress={activeBlockProgress}
              />
            </>
          )}
        </div>
      </aside>
    </>
  );
}
