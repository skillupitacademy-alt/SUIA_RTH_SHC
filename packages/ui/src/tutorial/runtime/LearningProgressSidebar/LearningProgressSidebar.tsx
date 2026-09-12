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
 *     1. Lifecycle & Overview (brand.secondaryColor)
 *     2. Engagement Metrics (#ff7300 FIXED)
 *     3. ◷ Time Analysis (#0091d5 FIXED)
 *     4. Overall Progress (brand.primaryColor)
 * 
 * DATA SOURCE: useILS() only (passive consumer)
 * NO manual block selector (follows ActiveBlockContext automatically)
 */
export function LearningProgressSidebar({ isOpen, onClose, brand }: LearningProgressSidebarProps) {
  const { overallProgress, activeBlockProgress, loading } = useILS();
  
  return (
    <aside
      aria-label="Your Progress"
      className={`sticky top-[71px] z-10 flex h-[calc(100dvh-71px)] shrink-0 flex-col overflow-hidden bg-white text-[#1e293b] transition-all duration-300 ease-in-out ${
        isOpen ? 'w-[440px] border-l border-[#edf2f7] opacity-100' : 'w-0 border-none opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex h-full w-[440px] flex-col overflow-hidden">
        {/* Header - ILS_UI_UX/style.css line 59-72 */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#edf2f7] px-[28px] py-[24px]">
          <h2 className="text-[20px] font-bold text-[#1a202c]">
            ◎ Your Progress
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer border-none bg-transparent text-[28px] leading-none text-[#a0aec0] transition-colors duration-150 hover:text-[#1a202c]"
            aria-label="Close sidebar"
          >
            <X className="h-7 w-7" />
          </button>
        </header>
        
        {/* Scrollable Content - ILS_UI_UX/style.css line 76-89 */}
        <div className="flex flex-1 flex-col gap-[24px] overflow-y-auto px-[28px] py-[24px] scrollbar-none">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Loading progress...
            </div>
          ) : (
            <>
              {/* Section 1: Lifecycle & Overview */}
              <LifecycleMetrics
                activeBlockProgress={activeBlockProgress}
                brand={brand}
              />
              
              {/* Section 2: Engagement Metrics */}
              <EngagementMetrics
                activeBlockProgress={activeBlockProgress}
              />
              
              {/* Section 3: ◷ Time Analysis */}
              <TimeAnalysisMetrics
                activeBlockProgress={activeBlockProgress}
              />
              
              {/* Section 4: Overall Progress */}
              <OverallProgressCard 
                overallProgress={overallProgress}
                brand={brand}
              />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
