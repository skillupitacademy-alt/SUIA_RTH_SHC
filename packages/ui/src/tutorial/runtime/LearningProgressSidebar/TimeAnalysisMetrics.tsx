/**
 * Time Analysis Metrics
 * 
 * Prototype Authority: ILS_UI_UX/index.html lines 122-144 + style.css lines 142-175, 262-304
 * Section color: #0091d5 FIXED (blue - NOT brand color)
 */

'use client';

import React from 'react';
import type { ILSActiveBlockProgress } from '../ILSProvider';
import { formatSeconds } from './utils';

interface TimeAnalysisMetricsProps {
  activeBlockProgress: ILSActiveBlockProgress | null;
}

/**
 * Time Analysis 2x2 Grid
 * 
 * DATA SOURCE: ILSActiveBlockProgress (block-level time metrics)
 * - activeTimeSec → ACTIVE TIME
 * - expectedTimeSec → EXPECTED (nullable - display "—" if null)
 * - PACE → raw calculation (activeTimeSec / expectedTimeSec) * 100 if both available
 * - STATUS → "On Track" (prototype literal text - NOT computed learning judgment)
 * 
 * VISUAL TOKENS (exact from prototype):
 * - Background: #0091d5 FIXED (blue)
 * - Text: white with 90% opacity for labels
 * - Grid: 2x2 with 12px gap
 * - Card height: 90px
 * - Card padding: 16px
 * - Border radius: 14px
 * - Shadow: 0 8px 20px rgba(0,145,213,0.25)
 * - Hover shadow: 0 12px 24px rgba(0,145,213,0.35)
 * - Hover transform: translateY(-5px)
 * - Transition: 0.2s ease
 * 
 * CRITICAL:
 * - Time Analysis color is FIXED across all brands for visual hierarchy
 * - expectedTimeSec: number | null - handle null explicitly (never convert to 0)
 * - PACE is raw prototype calculation only - NO R/Y/G, thresholds, classifications
 * - "On Track" is literal prototype text - NOT a computed learning judgment
 */
export function TimeAnalysisMetrics({ activeBlockProgress }: TimeAnalysisMetricsProps) {
  // Minimal production fallback if no active block
  if (!activeBlockProgress) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-[16px] font-bold text-[#334155]">
          Time Analysis
        </h3>
        <div className="rounded-[14px] border border-[#edf2f7] bg-white py-8 text-center text-sm text-gray-500">
          No active block data
        </div>
      </div>
    );
  }
  
  const { activeTimeSec, expectedTimeSec } = activeBlockProgress;
  
  // Calculate PACE only if expected time is available (NOT null)
  // Raw prototype arithmetic - NOT educational classification
  const pace = expectedTimeSec !== null && expectedTimeSec > 0
    ? Math.round((activeTimeSec / expectedTimeSec) * 100)
    : null;
  
  // Card component for 2x2 grid items
  const TimeCard = ({ label, value }: { label: string; value: string | number }) => (
    <div
      className="flex h-[90px] flex-col justify-between rounded-[14px] p-4 transition-all duration-200 ease-in-out hover:-translate-y-[5px]"
      style={{
        backgroundColor: '#0091d5',
        boxShadow: '0 8px 20px rgba(0, 145, 213, 0.25)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 145, 213, 0.35)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 145, 213, 0.25)';
      }}
    >
      {/* Card Label */}
      <div
        className="text-[11px] font-bold uppercase tracking-wider"
        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
      >
        {label}
      </div>
      
      {/* Card Value */}
      <div className="text-[22px] font-extrabold text-white">
        {value}
      </div>
    </div>
  );
  
  return (
    <div className="flex flex-col gap-3">
      {/* Section Title */}
      <h3 className="text-[16px] font-bold text-[#334155]">
        Time Analysis
      </h3>
      
      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        <TimeCard 
          label="ACTIVE TIME" 
          value={formatSeconds(activeTimeSec)} 
        />
        <TimeCard 
          label="EXPECTED" 
          value={expectedTimeSec !== null ? formatSeconds(expectedTimeSec) : "—"} 
        />
        <TimeCard 
          label="PACE" 
          value={pace !== null ? `${pace}%` : "—"} 
        />
        <TimeCard 
          label="STATUS" 
          value="On Track" 
        />
      </div>
    </div>
  );
}
