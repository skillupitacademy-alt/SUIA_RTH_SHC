import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface Node {
  id: string;
  label: string;
  description: string;
}

interface Connection {
  from: string;
  to: string;
  label: string;
}

interface LaymanMentalModelProps {
  title: string;
  conceptMap: {
    nodes: Node[];
    connections: Connection[];
  };
  visualLabels: string[];
}

/**
 * Layman Mental Model Component
 * Renderer: diagram_renderer
 * Layout Template: interactive_visual_canvas
 * Purpose: Mental model and conceptual visual system
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function LaymanMentalModel({ title, conceptMap, visualLabels }: LaymanMentalModelProps) {
  const brand = useBrand();

  return (
    <div className="w-full mb-8">
      {/* Title */}
      <h2 className="text-2xl font-bold text-slate-950 mb-6">{title}</h2>

      <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-8 border border-gray-200 shadow-lg">
        {/* Concept Map - Hierarchical Visual */}
        <div className="mb-8">
          <div className="flex flex-col items-center space-y-6">
            {conceptMap.nodes.map((node, index) => {
              const connection = conceptMap.connections.find(c => c.from === node.id);
              const level = index;
              const colors = [
                { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900' },
                { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900' },
                { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-900' },
                { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-900' },
                { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-900' }
              ];
              const color = colors[level % colors.length];

              return (
                <div key={node.id} className="flex flex-col items-center w-full max-w-md">
                  {/* Node */}
                  <div
                    className={`w-full ${color.bg} ${color.border} border-2 rounded-xl p-5 shadow-md transition-all duration-300 hover:scale-105 cursor-pointer`}
                  >
                    <h3 className={`text-lg font-bold ${color.text} mb-2 text-center`}>
                      {node.label}
                    </h3>
                    <p className="text-sm font-medium text-slate-700 text-center">
                      {node.description}
                    </p>
                  </div>

                  {/* Connection Arrow */}
                  {connection && index < conceptMap.nodes.length - 1 && (
                    <div className="flex flex-col items-center my-3">
                      <Icons.ArrowDown
                        size={24}
                        style={{ color: brand.primaryColor }}
                        aria-hidden="true"
                      />
                      <span
                        className="text-xs font-bold mt-1"
                        style={{ color: brand.primaryColorDark }}
                      >
                        {connection.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual Labels */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-base font-bold text-slate-950 mb-4 flex items-center gap-2">
            <Icons.Layers size={18} style={{ color: brand.primaryColor }} aria-hidden="true" />
            Understanding the Hierarchy
          </h3>
          <ul className="space-y-2">
            {visualLabels.map((label, index) => (
              <li key={index} className="flex items-start gap-3">
                <Icons.CheckCircle2
                  size={18}
                  className="shrink-0 mt-0.5"
                  style={{ color: brand.primaryColor }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
