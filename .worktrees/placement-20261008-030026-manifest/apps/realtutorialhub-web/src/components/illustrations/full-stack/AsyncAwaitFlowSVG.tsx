import type { FC } from 'react';

export const AsyncAwaitFlowSVG: FC<{ width?: number }> = ({ width = 120 }) => {
  const height = Math.round((width / 240) * 160);

  return (
    <svg
      viewBox="0 0 240 160"
      width={width}
      height={height}
      role="img"
      aria-label="Async await execution flow showing order confirmation and delivery steps"
    >
      <defs>
        <linearGradient id="asyncFlowBg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#fff8e8" />
          <stop offset="100%" stopColor="#ffe8c8" />
        </linearGradient>
      </defs>
      <rect x="12" y="16" width="216" height="128" rx="20" fill="url(#asyncFlowBg)" stroke="#d6a75e" />
      <rect x="36" y="56" width="52" height="28" rx="14" fill="#f57c00" opacity="0.92" />
      <rect x="94" y="56" width="52" height="28" rx="14" fill="#3d5a9e" opacity="0.92" />
      <rect x="152" y="56" width="52" height="28" rx="14" fill="#2e7d46" opacity="0.92" />
      <path d="M88 70h6" stroke="#5a6f96" strokeWidth="4" strokeLinecap="round" />
      <path d="M146 70h6" stroke="#5a6f96" strokeWidth="4" strokeLinecap="round" />
      <text x="62" y="99" textAnchor="middle" fontSize="11" fill="#1a2340" fontWeight="700">
        Order
      </text>
      <text x="120" y="99" textAnchor="middle" fontSize="11" fill="#1a2340" fontWeight="700">
        Await
      </text>
      <text x="178" y="99" textAnchor="middle" fontSize="11" fill="#1a2340" fontWeight="700">
        Result
      </text>
    </svg>
  );
};

