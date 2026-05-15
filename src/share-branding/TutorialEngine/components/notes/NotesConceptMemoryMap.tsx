import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface MemoryNode {
  id: string;
  label: string;
  description: string;
  type?: 'core' | 'supporting' | 'related';
}

interface Connection {
  from: string;
  to: string;
  label?: string;
}

interface NotesConceptMemoryMapProps {
  nodes: MemoryNode[];
  connections: Connection[];
}

/**
 * Concept Memory Map Component
 * Renderer: concept_memory_map
 * Purpose: Visual representation of conceptual relationships
 */
export function NotesConceptMemoryMap({ nodes, connections }: NotesConceptMemoryMapProps) {
  const brand = useBrand();

  if (!nodes || nodes.length === 0) return null;

  // Identify central node (usually the first one or id='core')
  const centralNode = nodes.find(n => n.id === 'core') || nodes[0];
  const surroundingNodes = nodes.filter(n => n.id !== centralNode.id);

  return (
    <div className="w-full rounded-[24px] border border-slate-200 bg-slate-50/50 p-6 shadow-xl sm:p-8 overflow-hidden">
      <div className="mb-8 flex items-center gap-2">
        <div 
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <span className="text-sm font-bold">2</span>
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Concept Memory Map</h3>
      </div>

      <div className="relative min-h-[500px] w-full flex items-center justify-center p-4">
        {/* SVG Connections Layer */}
        <svg className="absolute inset-0 h-full w-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={brand.primaryColor} opacity="0.3" />
            </marker>
          </defs>
          {/* We'll draw lines from center to outer nodes */}
          {surroundingNodes.map((node, i) => {
            const angle = (i / surroundingNodes.length) * 2 * Math.PI;
            const radius = 180;
            const x2 = 50 + Math.cos(angle) * 35; // % based
            const y2 = 50 + Math.sin(angle) * 35; // % based
            
            return (
              <line 
                key={i}
                x1="50%" 
                y1="50%" 
                x2={`${x2}%`} 
                y2={`${y2}%`} 
                stroke={brand.primaryColor} 
                strokeWidth="2" 
                strokeDasharray="4 4" 
                opacity="0.2"
                className="animate-pulse"
              />
            );
          })}
        </svg>

        {/* Central Node */}
        <div 
          className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full border-4 border-white bg-amber-100 shadow-2xl text-center p-4"
          style={{ borderColor: brand.primaryColor }}
        >
          <span className="text-sm font-black text-amber-900 leading-tight">{centralNode.label}</span>
          <span className="mt-1 text-[10px] font-bold text-amber-700">(Core)</span>
        </div>

        {/* Surrounding Nodes */}
        {surroundingNodes.map((node, i) => {
          const angle = (i / surroundingNodes.length) * 2 * Math.PI;
          const radius = 200; // px
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          const colors = [
            'bg-blue-50 border-blue-200 text-blue-900',
            'bg-emerald-50 border-emerald-200 text-emerald-900',
            'bg-purple-50 border-purple-200 text-purple-900',
            'bg-rose-50 border-rose-200 text-rose-900',
            'bg-indigo-50 border-indigo-200 text-indigo-900',
            'bg-cyan-50 border-cyan-200 text-cyan-900'
          ];
          const colorClass = colors[i % colors.length];

          return (
            <div 
              key={node.id}
              className={`absolute z-10 flex h-24 w-24 flex-col items-center justify-center rounded-2xl border shadow-lg p-3 text-center transition-all duration-300 hover:scale-110 hover:shadow-2xl ${colorClass}`}
              style={{ 
                transform: `translate(${x}px, ${y}px)` 
              }}
            >
              <span className="text-[11px] font-black mb-1">{node.label}</span>
              <span className="text-[9px] font-medium opacity-70 leading-tight">{node.description}</span>
            </div>
          );
        })}
      </div>

      {/* Legend / Key */}
      <div className="mt-8 flex flex-wrap justify-center gap-6 border-t border-slate-200 pt-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Core Foundation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Logic & Data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Interactivity</span>
        </div>
      </div>
    </div>
  );
}
