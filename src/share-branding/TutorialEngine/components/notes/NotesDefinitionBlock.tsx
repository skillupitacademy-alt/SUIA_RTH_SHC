import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface NotesDefinitionBlockProps {
  badge: string;
  headline: string;
  definitionText: string;
  importanceCallout: string;
  quickSummary: string[];
}

/**
 * Definition Block Component
 * Renderer: definition_block
 * Layout Template: top_priority_intro
 */
export function NotesDefinitionBlock({ 
  badge, 
  headline, 
  definitionText, 
  importanceCallout, 
  quickSummary 
}: NotesDefinitionBlockProps) {
  const brand = useBrand();

  return (
    <div className="w-full rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl sm:p-10 transition-all hover:shadow-2xl">
      {/* Top Header */}
      <div className="mb-6 flex items-center gap-3">
        <div 
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: brand.primaryColor }}
        >
           <Icons.BookOpen size={16} />
        </div>
        <span className="text-[12px] font-bold uppercase tracking-widest text-slate-400">{badge}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.5fr,1fr]">
        <div className="space-y-6">
          <h3 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            {headline}
          </h3>
          <p className="text-lg font-medium leading-relaxed text-slate-600">
            {definitionText}
          </p>
          
          {/* Importance Callout */}
          <div className="rounded-xl bg-indigo-50 p-6 border border-indigo-100 relative group overflow-hidden">
            <div className="flex items-center gap-3 mb-2">
               <Icons.Info className="text-indigo-600" size={20} />
               <h4 className="text-[14px] font-bold text-indigo-900">Why This Matters</h4>
            </div>
            <p className="text-[14px] font-medium text-indigo-900/80 leading-relaxed relative z-10">
              {importanceCallout}
            </p>
            <div className="absolute right-0 bottom-0 opacity-5 group-hover:scale-110 transition-transform">
               <Icons.Lightbulb size={120} />
            </div>
          </div>
        </div>

        {/* Quick Summary Sidebar */}
        <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100 h-fit">
          <h4 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-slate-900">
            <Icons.Zap className="text-amber-500 fill-amber-500" size={18} />
            Quick Summary
          </h4>
          <ul className="space-y-4">
            {quickSummary.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <div 
                  className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                   <Icons.Check size={10} strokeWidth={4} />
                </div>
                <span className="text-[13px] font-medium text-slate-700 leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
