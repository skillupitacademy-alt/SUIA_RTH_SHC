import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface CheatSheetItem {
  id: string;
  title: string;
  code: string;
  description?: string;
}

interface NotesCheatSheetProps {
  title?: string;
  items: CheatSheetItem[];
}

/**
 * Cheat Sheet (Quick Reference) Component
 * Renderer: cheat_sheet_svg (or cheat_sheet_grid)
 * Purpose: Compact reference for syntax and key commands
 */
export function NotesCheatSheet({ 
  title = "Cheat Sheet (Quick Reference)", 
  items 
}: NotesCheatSheetProps) {
  const brand = useBrand();

  return (
    <div className="w-full rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <span className="text-sm font-bold">3</span>
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">{title}</h3>
        </div>
        <Icons.FileText className="text-slate-300" size={24} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-md">
            <h4 className="text-[12px] font-bold text-slate-900 mb-2 border-b border-slate-100 pb-2">{item.title}</h4>
            <div className="relative">
               <pre className="font-mono text-[10px] text-indigo-600 leading-tight whitespace-pre-wrap">
                 {item.code}
               </pre>
            </div>
            {item.description && (
              <p className="mt-2 text-[9px] font-medium text-slate-400 italic">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
