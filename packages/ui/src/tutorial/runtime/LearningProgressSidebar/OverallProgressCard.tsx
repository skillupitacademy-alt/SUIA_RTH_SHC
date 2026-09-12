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
      className="flex flex-col gap-[14px] rounded-[18px] p-5"
      style={{
        backgroundColor: brand.primaryColor,
        borderRadius: '18px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: `0 10px 25px ${brand.primaryColor}40`, // 40 = 25% opacity in hex
        color: '#ffffff',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 14px 30px ${brand.primaryColor}59`; // 59 = 35% opacity
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = `0 10px 25px ${brand.primaryColor}40`;
      }}
    >
      {/* Top section: badge + percentage + subtext */}
      <div className="flex flex-col items-start gap-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
        {/* Status Badge - ILS_UI_UX/style.css line 350-361 */}
        <span
          className="rounded-[12px] px-[10px] py-1 text-[12px] font-bold uppercase tracking-wider backdrop-blur-[4px]"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            color: '#ffffff',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {statusText}
        </span>
        
        {/* Overall Percentage - ILS_UI_UX/style.css line 363-368 */}
        <div className="text-[34px] font-extrabold text-white" style={{ fontSize: '34px', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
          {Math.round(progressPercentage)}%
        </div>
        
        {/* Subtext - ILS_UI_UX/index.html line 119 */}
        <p className="text-[14px] font-semibold" style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', fontWeight: 600, margin: 0 }}>
          {completedBlockCount} of {totalBlockCount} blocks completed
        </p>
      </div>
      
      {/* Progress Bar - ILS_UI_UX/style.css line 377-392 */}
      <div
        className="my-3 h-[8px] w-full overflow-hidden rounded-[4px] border border-white/10"
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          borderRadius: '4px',
          overflow: 'hidden',
          margin: '12px 0',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          className="h-full rounded-[4px] transition-[width] duration-300 ease-in-out"
          style={{
            width: `${progressPercentage}%`,
            height: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
          }}
        />
      </div>
      
      {/* 4-Column Summary Grid - ILS_UI_UX/index.html lines 125-142 */}
      <div
        className="grid grid-cols-4 gap-2 rounded-[12px] p-3 text-center backdrop-blur-[4px]"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          padding: '12px',
          borderRadius: '12px',
          textAlign: 'center',
        }}
      >
        {/* COMPLETED */}
        <div>
          <span
            className="mb-0.5 block text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}
          >
            COMPLETED
          </span>
          <span className="text-[15px] font-extrabold text-white" style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
            {completedBlockCount}
          </span>
        </div>
        
        {/* TOTAL */}
        <div>
          <span
            className="mb-0.5 block text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}
          >
            TOTAL
          </span>
          <span className="text-[15px] font-extrabold text-white" style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
            {totalBlockCount}
          </span>
        </div>
        
        {/* REQUIRED */}
        <div>
          <span
            className="mb-0.5 block text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}
          >
            REQUIRED
          </span>
          <span className="text-[15px] font-extrabold text-white" style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
            {totalBlockCount}
          </span>
        </div>
        
        {/* ACTIVE */}
        <div>
          <span
            className="mb-0.5 block text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}
          >
            ACTIVE
          </span>
          <span className="text-[15px] font-extrabold text-white" style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
            {formatSeconds(timeSpentActiveSec)}
          </span>
        </div>
      </div>
    </div>
  );
}
