import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface NotesMnemonicGraphicProps {
  mnemonicTitle?: string;
  memoryHook?: string;
  rememberItems: Array<{ letter: string; label: string; description: string }>;
  keyPoints: string[];
}

/**
 * Mnemonic & Retention Graphic Component
 * Renderer: mnemonic_retention_graphic
 * Purpose: Creative memory aids and mnemonics
 */
export function NotesMnemonicGraphic({ 
  mnemonicTitle = "Remember This!", 
  memoryHook, 
  rememberItems, 
  keyPoints 
}: NotesMnemonicGraphicProps) {
  const brand = useBrand();

  return (
    <div className="w-full rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      <div className="mb-8 flex items-center gap-2">
        <div 
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <span className="text-sm font-bold">6</span>
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Mnemonic & Retention Graphic</h3>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Left: Acronym/Mnemonic */}
        <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
          <h4 className="text-[13px] font-bold text-slate-400 uppercase mb-6 tracking-wider">{mnemonicTitle}</h4>
          <div className="space-y-4">
             {rememberItems.map((item, i) => (
               <div key={i} className="flex items-center gap-4 group">
                 <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 text-xl font-black text-slate-900 group-hover:bg-amber-400 group-hover:text-white transition-colors">
                   {item.letter}
                 </div>
                 <div>
                    <span className="block text-[13px] font-bold text-slate-900">{item.label}</span>
                    <span className="block text-[11px] font-medium text-slate-500">{item.description}</span>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Right: Hook & Points */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-amber-50 p-6 border border-amber-100 border-dashed">
            <div className="flex items-center gap-3 mb-2">
              <Icons.Brain size={20} className="text-amber-600" />
              <span className="text-[12px] font-bold text-amber-900 uppercase">Memory Hook</span>
            </div>
            <p className="text-lg font-black text-amber-950 italic">
              {memoryHook || 'JS = Just makes things "WORK!"'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h5 className="text-[12px] font-bold text-slate-900 mb-4">Key Points to Remember</h5>
            <ul className="space-y-3">
              {keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Icons.CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-[12px] font-medium text-slate-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
