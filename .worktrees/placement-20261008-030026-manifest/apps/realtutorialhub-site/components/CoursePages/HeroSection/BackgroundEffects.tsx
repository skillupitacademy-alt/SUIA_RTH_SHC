'use client';

import React from 'react';

interface BackgroundEffectsProps {
  mousePosition: { x: number; y: number };
}

export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ 
  mousePosition 
}) => (
  <div className="absolute inset-0">
    <div
      className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse"
      style={{
        transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
        transition: 'transform 0.5s ease-out',
      }}
    />
    <div
      className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"
      style={{
        transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)`,
        transition: 'transform 0.5s ease-out',
        animationDelay: '1s',
      }}
    />
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
  </div>
);