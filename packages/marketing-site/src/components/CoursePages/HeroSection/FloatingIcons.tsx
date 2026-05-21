'use client';

import React from 'react';
import { FloatingIcon } from './types';

interface FloatingIconsProps {
  icons: FloatingIcon[];
}

export const FloatingIcons: React.FC<FloatingIconsProps> = ({ icons }) => (
  <>
    {icons.map((item, idx) => (
      <div
        key={idx}
        className="absolute opacity-20"
        style={{
          top: item.top,
          left: item.left,
          right: item.right,
          animation: `float 6s ease-in-out infinite`,
          animationDelay: `${item.delay}s`,
        }}
      >
        <item.Icon className="w-16 h-16 text-white" />
      </div>
    ))}
    <style>{`
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
      }
    `}</style>
  </>
);