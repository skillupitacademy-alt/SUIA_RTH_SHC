import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SVGIconRenderer } from '../shared/SVGIconRenderer';

interface NotesFooterProps {
  image?: any;
  finalNote: string;
  nextStepLabel: string;
  nextStepTarget: string;
}

/**
 * Notes Footer Component (Final Note & Next Step)
 * Matches the bottom section of the Visual Architecture image
 */
export function NotesFooter({ 
  image,
  finalNote, 
  nextStepLabel, 
  nextStepTarget 
}: NotesFooterProps) {
  const brand = useBrand();

  const dataUri = typeof image === 'string' ? image : image?.dataUri;
  const altText = typeof image === 'object' ? image?.alt : 'Footer Visual';

  return (
    <div className="w-full space-y-4">
      {dataUri && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-slate-50/50 p-3">
          <SVGIconRenderer 
            dataUri={dataUri} 
            alt={altText} 
            className="w-full h-auto max-h-[250px] object-contain mx-auto"
          />
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[1.5fr,1fr]">
        {/* Final Note */}
        <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm">
           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Icons.ClipboardCheck size={20} />
           </div>
           <p className="text-[14px] font-bold leading-relaxed text-slate-700">
             <span className="text-blue-600">Final Note:</span> {finalNote}
           </p>
        </div>

        {/* Next Step */}
        <div 
          className="group flex cursor-pointer items-center justify-between rounded-2xl p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
          style={{ backgroundColor: `${brand.primaryColor}08`, border: `1px solid ${brand.primaryColor}20` }}
        >
           <div className="flex items-center gap-4">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ backgroundColor: brand.primaryColor }}
              >
                 <Icons.ArrowRight size={20} />
              </div>
              <div>
                 <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Next Step</p>
                 <p className="text-[14px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{nextStepLabel}</p>
              </div>
           </div>
           <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-indigo-500 shadow-sm opacity-0 transition-opacity group-hover:opacity-100">
              <Icons.Target size={16} />
           </div>
        </div>
      </div>
    </div>
  );
}
