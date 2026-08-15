'use client';

import React from 'react';
import type { ContentAnalysisResult } from '@quiz/types';

interface AnalysisConfidenceCardProps {
  overallConfidence: ContentAnalysisResult['overallConfidence'];
}

export function AnalysisConfidenceCard({ overallConfidence }: AnalysisConfidenceCardProps) {
  const { score, grade, description } = overallConfidence;

  // SVG Donut calculation
  const radius = 38;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-center">
      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 text-left">
        Analysis Confidence
      </h3>

      <div className="relative w-28 h-28 mx-auto mb-3 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="text-slate-100"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
          />
          {/* Progress arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="text-pink-600 transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {score}%
          </span>
        </div>
      </div>

      <div className="text-sm font-bold text-slate-900 mb-1">
        {grade}
      </div>

      <p className="text-xs text-slate-500 max-w-[220px] mx-auto leading-relaxed">
        {description || 'High confidence in structure detection. Review suggestions before proceeding.'}
      </p>
    </div>
  );
}
