/**
 * Learning Progress Sidebar - Main Container
 * 
 * Prototype Authority: ILS_UI_UX/index.html + style.css
 * 100% visual/structural parity required
 */

'use client';

import React from 'react';
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
   * Optional close handler
   */
  onClose?: () => void;
  
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
export function LearningProgressSidebar({ isOpen, brand }: LearningProgressSidebarProps) {
  const { overallProgress, activeBlockProgress, loading } = useILS();
  
  return (
    <aside
      aria-label="Your Progress"
      className={`sticky top-0 z-10 flex h-[100dvh] shrink-0 flex-col overflow-hidden bg-white text-[#1e293b] transition-all duration-300 ease-in-out ${
        isOpen ? 'w-[440px] border-l border-[#edf2f7] opacity-100' : 'w-0 border-none opacity-0 pointer-events-none'
      }`}
      style={{
        width: isOpen ? '440px' : '0px',
        minWidth: isOpen ? '440px' : '0px',
        maxWidth: isOpen ? '440px' : '0px',
        borderLeft: isOpen ? '1px solid #edf2f7' : 'none',
      }}
    >
      <div className="flex h-full w-[440px] flex-col overflow-hidden" style={{ width: '440px' }}>
        {/* Header - ILS_UI_UX/style.css line 59-72 */}
        <header
          className="flex shrink-0 items-center justify-between border-b border-[#edf2f7] bg-white px-[28px] py-[22px]"
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid #edf2f7',
            backgroundColor: '#ffffff',
          }}
        >
          <h2 className="text-[20px] font-bold text-[#1a202c]" style={{ fontSize: '20px', fontWeight: 700, color: '#1a202c' }}>
            ◎ Your Progress
          </h2>
        </header>
        
        {/* Scrollable Content - self-contained internal scroll matching LSNB architecture */}
        <div className="min-h-0 flex-1 overflow-hidden" style={{ minHeight: 0, flex: '1 1 0%', overflow: 'hidden' }}>
          <div 
            className="tutorial-rssb-scroll h-full overflow-y-auto overflow-x-hidden overscroll-contain px-[28px] py-[24px] pb-[48px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{
              height: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              overscrollBehavior: 'contain',
              padding: '24px 28px 48px 28px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Loading progress...
              </div>
            ) : (
              <div
                className="flex flex-col gap-[32px]"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '32px',
                }}
              >
                {/* Section 1: Lifecycle & Overview */}
                <LifecycleMetrics
                  activeBlockProgress={activeBlockProgress}
                  brand={brand}
                />
                
                {/* Section 2: Engagement Metrics */}
                <EngagementMetrics
                  activeBlockProgress={activeBlockProgress}
                />
                
                {/* Section 3: Time Analysis */}
                <TimeAnalysisMetrics
                  activeBlockProgress={activeBlockProgress}
                />
                
                {/* Section 4: Overall Progress */}
                <OverallProgressCard 
                  overallProgress={overallProgress}
                  brand={brand}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .tutorial-rssb-scroll {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .tutorial-rssb-scroll::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>
    </aside>
  );
}
