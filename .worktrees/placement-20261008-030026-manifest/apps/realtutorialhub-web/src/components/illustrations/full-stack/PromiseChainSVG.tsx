import type { FC } from 'react';

export const PromiseChainSVG: FC<{ width?: number }> = ({ width = 180 }) => {
  const height = Math.round((width / 240) * 160);

  return (
    <svg
      viewBox="0 0 240 160"
      width={width}
      height={height}
      role="img"
      aria-label="Promise state transitions showing pending moving to fulfilled or rejected"
    >
      <defs>
        <linearGradient id="promiseChainBg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#eef4ff" />
          <stop offset="100%" stopColor="#dfe8ff" />
        </linearGradient>
      </defs>
      <rect x="12" y="16" width="216" height="128" rx="20" fill="url(#promiseChainBg)" stroke="#7a8fbc" />
      <circle cx="56" cy="80" r="24" fill="#f57c00" opacity="0.92" />
      <circle cx="120" cy="80" r="24" fill="#3d5a9e" opacity="0.92" />
      <circle cx="184" cy="80" r="24" fill="#2e7d46" opacity="0.92" />
      <path d="M80 80h16" stroke="#5a6f96" strokeWidth="4" strokeLinecap="round" />
      <path d="M144 80h16" stroke="#5a6f96" strokeWidth="4" strokeLinecap="round" />
      <path d="M72 64l8 16-8 16" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M136 64l8 16-8 16" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <text x="56" y="120" textAnchor="middle" fontSize="12" fill="#1a2340" fontWeight="700">
        Pending
      </text>
      <text x="120" y="120" textAnchor="middle" fontSize="12" fill="#1a2340" fontWeight="700">
        Then
      </text>
      <text x="184" y="120" textAnchor="middle" fontSize="12" fill="#1a2340" fontWeight="700">
        Done
      </text>
    </svg>
  );
};

