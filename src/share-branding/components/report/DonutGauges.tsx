import React from 'react';

// Single Ring Donut Gauge
export function DonutGauge({
  percentage,
  size = 140,
  strokeWidth = 14,
  color = '#ff0055',
  trackColor = '#f1f5f9',
  children,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const validPct = Math.max(0, Math.min(100, isNaN(percentage) ? 0 : percentage));
  const offset = circumference - (validPct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
}

// Multi-Segment Donut (Correct / Incorrect / Skipped)
export function SegmentedDonut({
  correct,
  incorrect,
  skipped,
  size = 150,
  strokeWidth = 18,
  children,
}: {
  correct: number;
  incorrect: number;
  skipped: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const total = Math.max(1, correct + incorrect + skipped);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const correctPct = (correct / total) * 100;
  const incorrectPct = (incorrect / total) * 100;
  const skippedPct = (skipped / total) * 100;

  const correctDash = (correctPct / 100) * circumference;
  const incorrectDash = (incorrectPct / 100) * circumference;
  const skippedDash = (skippedPct / 100) * circumference;

  const gap = 2;
  const adjustedCorrect = Math.max(0, correctDash - gap);
  const adjustedIncorrect = Math.max(0, incorrectDash - gap);
  const adjustedSkipped = Math.max(0, skippedDash - gap);

  const correctOffset = 0;
  const incorrectOffset = -correctDash;
  const skippedOffset = -(correctDash + incorrectDash);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {correct > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#10b981"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${adjustedCorrect} ${circumference}`}
            strokeDashoffset={correctOffset}
            strokeLinecap="round"
          />
        )}
        {incorrect > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#ef4444"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${adjustedIncorrect} ${circumference}`}
            strokeDashoffset={incorrectOffset}
            strokeLinecap="round"
          />
        )}
        {skipped > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f97316"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${adjustedSkipped} ${circumference}`}
            strokeDashoffset={skippedOffset}
            strokeLinecap="round"
          />
        )}
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
}

// 4-Color Segmented Donut for Concept Wise Performance Center
export function ConceptSegmentedDonut({
  size = 110,
  strokeWidth = 14,
  children,
}: {
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const quarter = circumference / 4;
  const gap = 3;
  const seg = Math.max(0, quarter - gap);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-45">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ff0055"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${seg} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2563eb"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${seg} ${circumference}`}
          strokeDashoffset={-quarter}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#059669"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${seg} ${circumference}`}
          strokeDashoffset={-quarter * 2}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f97316"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${seg} ${circumference}`}
          strokeDashoffset={-quarter * 3}
          strokeLinecap="round"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

// Snail Icon for Slowest Question
export function SnailIcon({ className = 'w-6 h-6 text-red-600' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 13a6 6 0 1 0 12 0 4 4 0 1 0-8 0 2 2 0 0 0 4 0" />
      <circle cx="10" cy="13" r="8" />
      <path d="M2 21h12c4.4 0 8-3.6 8-8a4 4 0 0 0-4-4h-2" />
      <path d="M18 5l2-2" />
      <path d="M20 9l2-2" />
    </svg>
  );
}
