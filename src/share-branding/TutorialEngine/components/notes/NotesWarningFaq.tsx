import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface NotesWarningFaqProps {
  faqItems: FaqItem[];
  title?: string;
}

/**
 * Warning & FAQ (Common Mistakes) Component
 * Template 7 in the Visual Architecture
 */
export function NotesWarningFaq({ 
  faqItems,
  title = "WARNING & FAQ (COMMON MISTAKES)"
}: NotesWarningFaqProps) {
  const brand = useBrand();

  return (
    <div className="w-full rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div 
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: "#f43f5e" }} // Red for Warning
        >
          <Icons.AlertTriangle size={16} />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">{title}</h3>
      </div>

      {/* FAQ Grid */}
      <div className="grid gap-6">
        {faqItems.map((item) => (
          <div key={item.id} className="space-y-3">
            {/* Question */}
            <div className="flex items-start gap-4">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white mt-1">
                Q
              </div>
              <h4 className="text-[15px] font-bold text-slate-900 pt-1">
                {item.question}
              </h4>
            </div>

            {/* Answer / Warning */}
            <div className="flex items-start gap-4 pl-0 sm:pl-0">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-600 mt-1 border border-rose-200">
                A
              </div>
              <div className="flex-1 rounded-xl bg-slate-50 p-4 border border-slate-100 relative group">
                <p className="text-[14px] font-medium leading-relaxed text-slate-700">
                  {item.answer}
                </p>
                <div className="absolute right-3 top-3 text-rose-500 opacity-30">
                  <Icons.AlertTriangle size={18} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
