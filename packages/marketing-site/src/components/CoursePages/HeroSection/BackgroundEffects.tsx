'use client';

import React from 'react';

interface BackgroundEffectsProps {
  mousePosition: { x: number; y: number };
}

export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ 
  mousePosition 
}) => (
  <div className="absolute inset-0 pointer-events-none">
    {/* Ultra-subtle top-left wisp */}
    <div
      className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[180px] opacity-[0.06]"
      style={{
        backgroundColor: "#a0a0a0",
        transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
        transition: 'transform 0.5s ease-out',
      }}
    />
    {/* Ultra-subtle bottom-right wisp */}
    <div
      className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[180px] opacity-[0.05]"
      style={{
        backgroundColor: "#a0a0a0",
        transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)`,
        transition: 'transform 0.5s ease-out',
      }}
    />
  </div>
);
