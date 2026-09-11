/**
 * Overall Progress Card
 * 
 * Prototype Authority: ILS_UI_UX/index.html lines 38-67 + style.css lines 305-415
 * Section color: brand.primaryColor (RTH: #d03f00, SkillUp: #f54a8d)
 */

'use client';

import React from 'react';
import type { ILSOverallProgress } from '../ILSProvider';
import { formatSeconds } from './utils';

interface OverallProgressCardProps {
  overallProgress: ILSOverallProgress | null;
  brand: {
    primaryColor: string;
  };
}

/**
 * Overall Progress Card
 * 
 * DATA SOURCE: ILSOverallProgress (page-level metrics)
 * - status → status badge
 * - progressPercentage → main % display + progress bar width
 * - visitCount → SEEN
 * - timeSpentActiveSec → TIME
 * - revisionCount → REVISED
 * - completedBlockCount / totalBlockCount → DONE
 * 
 * VISUAL TOKENS (exact from prototype):
 * - Background: brand.primaryColor
 * - Text: white with 90% opacity for labels
 * - Border radius: 18px
 * - Padding: 20px
 * - Shadow: 0 10px 25px rgba(245,74,141,0.25) [uses pink rgba for reference, will adjust]
 * - Hover transform: translateY(-5px)
 * - Transition: 0.2s ease
 */
export function OverallProgressCard({ overallProgress, brand }: OverallProgressCardProps) {
  if (!overallProgress) {
    // Minimal production fallback - NOT from prototype
    return (
      <div className="rounded-[18px] border border-[#edf2f7] bg-white p-5 text-center text-sm text-gray-500">
        No progress data available
      </div>
    );
  }
  
  const {
    status,
    progressPercentage,
    visitCount,
    timeSpentActiveSec,
    revisionCount,
    completedBlockCount,
    totalBlockCount,
  } = overallProgress;
  
  // Status badge text mapping
  const statusText = status === 'completed' ? 'COMPLETED' : 
                    status === 'in_progress' ? 'IN PROGRESS' : 
                    'NOT STARTED';
  
  return (
    <div
      className="flex flex-col gap-[14px] rounded-[18px] p-5 transition-all duration-200 ease-in-out hover:-translate-y-[5px]"
      style={{
        backgroundColor: brand.primaryColor,
        boxShadow: `0 10px 25px ${brand.primaryColor}40`, // 40 = 25% opacity in hex
        color: '#ffffff',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 14px 30px ${brand.primaryColor}59`; // 59 = 35% opacity
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 10px 25px ${brand.primaryColor}40`;
      }}
    >
      {/* Top section: badge + percentage + subtext */}
      <div className="flex flex-col items-start gap-1">
        {/* Status Badge - ILS_UI_UX/style.css line 350-361 */}
        <span
          className="rounded-[12px] px-[10px] py-1 text-[12px] font-bold uppercase tracking-wider backdrop-blur-[4px]"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            color: '#ffffff',
          }}
        >
          {statusText}
        </span>
        
        {/* Overall Percentage - ILS_UI_UX/style.css line 363-368 */}
        <div className="text-[34px] font-extrabold text-white">
          {Math.round(progressPercentage)}%
        </div>
        
        {/* Subtext - ILS_UI_UX/style.css line 370-375 */}
        <p className="text-[14px] font-semibold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          Overall Progress
        </p>
      </div>
      
      {/* Progress Bar - ILS_UI_UX/style.css line 377-392 */}
      <div
        className="h-[8px] w-full overflow-hidden rounded-[4px]"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
      >
        <div
          className="h-full rounded-[4px] transition-[width] duration-300 ease-in-out"
          style={{
            width: `${progressPercentage}%`,
            backgroundColor: '#ffffff',
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
          }}
        />
      </div>
      
      {/* 4-Column Summary Grid - ILS_UI_UX/style.css line 394-415 */}
      <div
        className="grid grid-cols-4 gap-2 rounded-[12px] p-3 text-center backdrop-blur-[4px]"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
      >
        {/* SEEN */}
        <div>
          <span
            className="mb-0.5 block text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
          >
            SEEN
          </span>
          <span className="text-[15px] font-extrabold text-white">
            {visitCount}
          </span>
        </div>
        
        {/* TIME */}
        <div>
          <span
            className="mb-0.5 block text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
          >
            TIME
          </span>
          <span className="text-[15px] font-extrabold text-white">
            {formatSeconds(timeSpentActiveSec)}
          </span>
        </div>
        
        {/* REVISED */}
        <div>
          <span
            className="mb-0.5 block text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
          >
            REVISED
          </span>
          <span className="text-[15px] font-extrabold text-white">
            {revisionCount}
          </span>
        </div>
        
        {/* DONE */}
        <div>
          <span
            className="mb-0.5 block text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
          >
            DONE
          </span>
          <span className="text-[15px] font-extrabold text-white">
            {completedBlockCount}/{totalBlockCount}
          </span>
        </div>
      </div>
    </div>
  );
}
