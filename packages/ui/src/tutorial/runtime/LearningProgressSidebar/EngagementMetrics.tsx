/**
 * Engagement Metrics
 * 
 * Prototype Authority: ILS_UI_UX/index.html lines 97-119 + style.css lines 142-175, 262-304
 * Section color: #ff7300 FIXED (orange - NOT brand color)
 */

'use client';

import React from 'react';
import type { ILSActiveBlockProgress } from '../ILSProvider';

interface EngagementMetricsProps {
  activeBlockProgress: ILSActiveBlockProgress | null;
}

/**
 * Engagement Metrics 2x2 Grid
 * 
 * DATA SOURCE: ILSActiveBlockProgress (block-level engagement)
 * - visitCount → VISITS
 * - revisionCount → REVISIONS
 * - Attempts → "—" (unavailable - NO quiz system)
 * - Score → "—" (unavailable - NO quiz system)
 * 
 * VISUAL TOKENS (exact from prototype):
 * - Background: #ff7300 FIXED (orange)
 * - Text: white with 90% opacity for labels
 * - Grid: 2x2 with 12px gap
 * - Card height: 90px
 * - Card padding: 16px
 * - Border radius: 14px
 * - Shadow: 0 8px 20px rgba(255,115,0,0.25)
 * - Hover shadow: 0 12px 24px rgba(255,115,0,0.35)
 * - Hover transform: translateY(-5px)
 * - Transition: 0.2s ease
 * 
 * CRITICAL: Engagement color is FIXED across all brands for visual hierarchy
 */
export function EngagementMetrics({ activeBlockProgress }: EngagementMetricsProps) {
  // Minimal production fallback if no active block
  if (!activeBlockProgress) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-[16px] font-bold text-[#334155]">
          Engagement Metrics
        </h3>
        <div className="rounded-[14px] border border-[#edf2f7] bg-white py-8 text-center text-sm text-gray-500">
          No active block data
        </div>
      </div>
    );
  }
  
  const { visitCount, revisionCount } = activeBlockProgress;
  
  // Card component for 2x2 grid items
  const EngagementCard = ({ label, value }: { label: string; value: string | number }) => (
    <div
      className="flex h-[90px] flex-col justify-between rounded-[14px] p-4 hover:-translate-y-[5px]"
      style={{
        backgroundColor: '#ff7300',
        boxShadow: '0 8px 20px rgba(255, 115, 0, 0.25)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 115, 0, 0.35)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 115, 0, 0.25)';
      }}
    >
      {/* Card Label - ILS_UI_UX/style.css line 168-175 */}
      <div
        className="text-[11px] font-bold uppercase tracking-wider"
        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
      >
        {label}
      </div>
      
      {/* Card Value - ILS_UI_UX/style.css line 277-281 (adjusted to 22px for uniformity) */}
      <div className="text-[22px] font-extrabold text-white">
        {value}
      </div>
    </div>
  );
  
  return (
    <div className="flex flex-col gap-3">
      {/* Section Title - ILS_UI_UX/style.css line 134-139 */}
      <h3 className="text-[16px] font-bold text-[#334155]">
        Engagement Metrics
      </h3>
      
      {/* 2x2 Grid - ILS_UI_UX/style.css line 262-268 */}
      <div className="grid grid-cols-2 gap-3">
        <EngagementCard label="VISITS" value={visitCount} />
        <EngagementCard label="REVISIONS" value={revisionCount} />
        <EngagementCard label="ATTEMPTS" value="—" />
        <EngagementCard label="SCORE" value="—" />
      </div>
    </div>
  );
}
