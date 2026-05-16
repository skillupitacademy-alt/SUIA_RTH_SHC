import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SVGIconRenderer } from '../shared/SVGIconRenderer';

interface NotesHeroInfographicProps {
  summaryTitle: string;
  image?: any; // String or InlineSvgAsset
  examTips: string[];
  howItWorks?: Array<{ step: number; label: string; description: string }>;
}

/**
 * Summary Hero Infographic Component
 * Renderer: summary_hero_infographic
 * Purpose: Top-level visual summary of the subtopic
 */
export function NotesHeroInfographic({ 
  summaryTitle, 
  image, 
  examTips,
  howItWorks 
}: NotesHeroInfographicProps) {
  const brand = useBrand();

  const dataUri = typeof image === 'string' ? image : image?.dataUri;
  const altText = typeof image === 'object' ? image?.alt : 'Hero Infographic';

  return (
    <div className="w-full rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <span className="text-sm font-bold">1</span>
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Summary Hero Infographic</h3>
        </div>
      </div>

      {dataUri && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
          <SVGIconRenderer 
            dataUri={dataUri} 
            alt={altText} 
            className="w-full h-auto max-h-[400px] object-cover"
          />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Side: Identity & Meta */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-start gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-amber-400 p-4 shadow-lg text-white">
               {/* JS Logo Placeholder */}
               <span className="text-4xl font-black">JS</span>
            </div>
            <div className="space-y-2">
              <h4 className="text-3xl font-bold text-slate-900">{summaryTitle}</h4>
              <p className="text-[15px] font-medium leading-relaxed text-slate-600">
                {examTips[0]}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Icons.Globe, label: 'Runs In', value: 'Web Browsers' },
              { icon: Icons.Code2, label: 'Works With', value: 'HTML / CSS' },
              { icon: Icons.Zap, label: 'Main Power', value: 'Interactivity' },
              { icon: Icons.Target, label: 'Used For', value: 'Web Apps' }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center">
                <item.icon size={20} className="mb-2 text-slate-400" />
                <span className="text-[10px] font-bold uppercase text-slate-400">{item.label}</span>
                <span className="text-[11px] font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Process Flow */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-50/80 p-6 border border-slate-100">
          <h5 className="mb-6 text-center text-[13px] font-bold text-slate-500 uppercase tracking-wide">How {summaryTitle} Works</h5>
          
          <div className="flex items-center justify-between gap-2">
             {howItWorks?.map((step, i) => (
               <React.Fragment key={i}>
                 <div className="flex flex-col items-center gap-3 text-center">
                   <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md border border-slate-100">
                      {i === 0 && <Icons.MousePointer2 size={20} className="text-slate-900" />}
                      {i === 1 && <span className="text-xl font-bold text-amber-500">JS</span>}
                      {i === 2 && <Icons.Layout size={20} className="text-emerald-500" />}
                   </div>
                   <div>
                     <span className="block text-[11px] font-bold text-slate-900">{step.label}</span>
                     <span className="block text-[9px] font-medium text-slate-500">({step.description})</span>
                   </div>
                 </div>
                 {i < howItWorks.length - 1 && (
                   <Icons.ArrowRight size={16} className="text-slate-300 mb-6" />
                 )}
               </React.Fragment>
             ))}
          </div>

          <div className="mt-8 rounded-xl bg-indigo-50/50 p-4 border border-indigo-100 border-dashed">
            <div className="flex gap-3">
              <Icons.Star size={18} className="text-indigo-600 shrink-0" />
              <div>
                <h6 className="text-[12px] font-bold text-indigo-900 mb-0.5">Key Takeaway</h6>
                <p className="text-[12px] font-medium text-indigo-800 leading-snug">
                  {examTips[1] || 'JavaScript is the core engine for modern interactivity.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
