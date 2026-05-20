import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SVGIconRenderer } from '../shared/SVGIconRenderer';

interface ChecklistItem {
  id: string;
  item: string;
  checked: boolean;
}

interface NotesSummaryCardProps {
  image?: any;
  summaryTitle?: string;
  keyTakeaways: string[];
  revisionChecklist: ChecklistItem[];
  memoryReinforcement?: string;
  examTips: string[];
}

/**
 * Summary Card (Revision Dashboard) Component
 * Template 8 in the Visual Architecture
 */
export function NotesSummaryCard({ 
  image,
  summaryTitle = "SUMMARY CARD (REVISION DASHBOARD)", 
  revisionChecklist,
  examTips
}: NotesSummaryCardProps) {
  const brand = useBrand();

  const dataUri = typeof image === 'string' ? image : image?.dataUri;
  const altText = typeof image === 'object' ? image?.alt : 'Summary Graphic';

  return (
    <div className="w-full rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div 
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <Icons.CheckSquare size={16} />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">{summaryTitle}</h3>
      </div>

      {/* Optional Visual Architecture Infographic - Premium Full Width Above Content */}
      {dataUri && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-slate-50/50 p-3">
           <SVGIconRenderer 
             dataUri={dataUri} 
             alt={altText} 
             className="w-full h-auto max-h-[450px] object-contain mx-auto"
           />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Side: Quick Recap */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 text-[16px] font-bold text-slate-900">
            <Icons.CheckCircle className="text-blue-600" size={18} />
            Quick Recap
          </h4>
          <ul className="space-y-3">
            {revisionChecklist.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Icons.Check size={10} strokeWidth={4} />
                </div>
                <span className="text-[14px] font-medium text-slate-700">{item.item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Side: Pro Tip & Fallback Visual (if no custom SVG) */}
        <div className="space-y-6">
          {/* Pro Tip Card */}
          <div className="rounded-xl bg-amber-50 p-6 border border-amber-100 relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Icons.Star className="text-amber-500 fill-amber-500" size={16} />
              <span className="text-[12px] font-bold text-amber-900 uppercase tracking-tight">Pro Tip</span>
            </div>
            <p className="text-[13px] font-medium text-amber-950 leading-relaxed">
              {examTips[0] || "Practice small examples daily and build projects to master concepts!"}
            </p>
            <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
               <Icons.Lightbulb size={80} />
            </div>
          </div>

          {/* Fallback Summary Block (Only visible when no custom image is set) */}
          {!dataUri && (
            <div className="flex items-center gap-6 rounded-xl border border-slate-100 bg-slate-50/50 p-6 overflow-hidden">
              <div 
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-2xl font-bold text-slate-900 shadow-sm"
                style={{ backgroundColor: "#fbbf24" }}
              >
                JS
              </div>
              <div>
                 <p className="text-[13px] font-bold text-slate-900">HTML = Structure</p>
                 <p className="text-[13px] font-bold text-slate-900">CSS = Style</p>
                 <p className="text-[13px] font-bold text-slate-900">JavaScript = Behavior</p>
                 <p className="mt-2 text-[12px] font-bold text-slate-500">Keep Learning! Keep Building! 💪</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
