/**
 * Lifecycle Metrics
 * 
 * Prototype Authority: ILS_UI_UX/index.html lines 70-94 + style.css lines 176-256
 * Section color: brand.secondaryColor (RTH: #124fd6, SkillUp: #133382)
 */

'use client';

import React from 'react';
import type { ILSActiveBlockProgress } from '../ILSProvider';
import { formatDate } from './utils';

interface LifecycleMetricsProps {
  activeBlockProgress: ILSActiveBlockProgress | null;
  brand: {
    primaryColor?: string;
    secondaryColor: string;
  };
}

/**
 * Lifecycle Metrics Table
 * 
 * DATA SOURCE: ILSActiveBlockProgress (block-level timestamps)
 * - firstViewedAt → First Viewed
 * - lastViewedAt → Last Viewed
 * - completedAt → Completed At (green text #5cf0b0 if exists, "—" if null)
 * 
 * VISUAL TOKENS (exact from prototype):
 * - Background: brand.secondaryColor
 * - Text: white
 * - Table structure: 3 rows × 2 columns (METRIC | VALUE)
 * - Border radius: 14px
 * - Shadow: 0 10px 25px rgba(0,0,0,0.12)
 * - Hover shadow: 0 14px 30px rgba(0,0,0,0.18)
 * - Hover transform: translateY(-7px)
 * - Transition: 0.2s ease
 */
export function LifecycleMetrics({ activeBlockProgress, brand }: LifecycleMetricsProps) {
  // Minimal production fallback if no active block
  if (!activeBlockProgress) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-[16px] font-bold text-[#334155]">
          Lifecycle & Overview
        </h3>
        <div className="rounded-[14px] border border-[#edf2f7] bg-white py-8 text-center text-sm text-gray-500">
          No active block data
        </div>
      </div>
    );
  }
  
  const { firstViewedAt, lastViewedAt, completedAt, isCompleted } = activeBlockProgress;
  const isBlockCompleted = Boolean(completedAt || isCompleted);
  const statusDisplay = isBlockCompleted ? 'COMPLETED' : '—';
  
  return (
    <div className="flex flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Section Title - ILS_UI_UX/style.css line 134-139 */}
      <h3 className="text-[16px] font-bold text-[#334155]" style={{ fontSize: '16px', fontWeight: 700, color: '#334155', margin: 0 }}>
        Lifecycle & Overview
      </h3>
      
      {/* Lifecycle Table - ILS_UI_UX/style.css line 176-256 (Uses brand.secondaryColor for elegant contrast) */}
      <table
        className="w-full overflow-hidden rounded-[14px]"
        style={{
          backgroundColor: brand.secondaryColor || '#133382',
          color: '#ffffff',
          borderCollapse: 'separate',
          borderSpacing: 0,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 14px 30px rgba(0, 0, 0, 0.18)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.12)';
        }}
      >
        <thead>
          <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}>
            <th className="px-4 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-white">
              METRIC
            </th>
            <th className="px-4 py-3 text-right text-[12px] font-bold uppercase tracking-wider text-white">
              VALUE
            </th>
          </tr>
        </thead>
        <tbody>
          {/* First Viewed */}
          <tr>
            <td
              className="px-4 py-3 text-[14px] font-semibold"
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              First Viewed
            </td>
            <td
              className="px-4 py-3 text-right text-[14px] font-extrabold text-white"
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              {formatDate(firstViewedAt)}
            </td>
          </tr>
          
          {/* Last Viewed */}
          <tr>
            <td
              className="px-4 py-3 text-[14px] font-semibold"
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              Last Viewed
            </td>
            <td
              className="px-4 py-3 text-right text-[14px] font-extrabold text-white"
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              {formatDate(lastViewedAt)}
            </td>
          </tr>
          
          {/* Completed At */}
          <tr>
            <td
              className="px-4 py-3 text-[14px] font-semibold"
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              Completed At
            </td>
            <td
              className="px-4 py-3 text-right text-[14px] font-extrabold text-white"
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              {formatDate(completedAt)}
            </td>
          </tr>

          {/* Status - green #5cf0b0 if completed, "—" if not completed */}
          <tr>
            <td
              className="px-4 py-3 text-[14px] font-semibold"
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
                borderBottom: 'none',
              }}
            >
              Status
            </td>
            <td
              className="px-4 py-3 text-right text-[14px] font-extrabold"
              style={{
                color: isBlockCompleted ? '#5cf0b0' : '#ffffff',
                borderBottom: 'none',
              }}
            >
              {statusDisplay}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
