import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface CommonError {
  id: string;
  error: string;
  solution: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface NotesWarningFaqProps {
  commonErrors: CommonError[];
  faqItems: FaqItem[];
  misconceptionAlerts: string[];
}

/**
 * Warning FAQ Component
 * Renderer: warning_faq
 * Layout Template: mistake_prevention
 * Purpose: Common mistakes, FAQ, and misconception prevention
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function NotesWarningFaq({ 
  commonErrors, 
  faqItems, 
  misconceptionAlerts 
}: NotesWarningFaqProps) {
  const brand = useBrand();
  const [openFaqId, setOpenFaqId] = useState<string>(faqItems[0]?.id || '');

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? '' : id);
  };

  return (
    <div className="w-full mb-8">
      {/* Common Errors Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-950 mb-6 flex items-center gap-2">
          <Icons.AlertTriangle size={24} className="text-amber-600" aria-hidden="true" />
          Common Errors to Avoid
        </h2>
        <div className="space-y-4">
          {commonErrors.map((error) => (
            <div 
              key={error.id}
              className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border-l-4 border-amber-500 shadow-md"
            >
              <div className="flex items-start gap-4">
                <Icons.XCircle 
                  size={24} 
                  className="shrink-0 mt-0.5 text-amber-600"
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-amber-950 mb-2">
                    ❌ {error.error}
                  </h3>
                  <div className="flex items-start gap-2 mt-3 p-3 bg-white/60 rounded-lg">
                    <Icons.CheckCircle2 
                      size={18} 
                      className="shrink-0 mt-0.5 text-emerald-600"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium text-slate-800">
                      <strong className="text-emerald-900">Solution:</strong> {error.solution}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-950 mb-6 flex items-center gap-2">
          <Icons.HelpCircle size={24} className="text-blue-600" aria-hidden="true" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqItems.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div 
                key={faq.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                >
                  <span className="text-base font-bold text-slate-950 pr-4">
                    {faq.question}
                  </span>
                  <Icons.ChevronDown 
                    size={20} 
                    className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: brand.primaryColor }}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div 
                    id={`faq-answer-${faq.id}`}
                    className="px-5 pb-5 pt-2 border-t border-gray-100"
                  >
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Misconception Alerts */}
      <div>
        <h2 className="text-2xl font-bold text-slate-950 mb-6 flex items-center gap-2">
          <Icons.AlertCircle size={24} className="text-rose-600" aria-hidden="true" />
          Common Misconceptions
        </h2>
        <div className="space-y-3">
          {misconceptionAlerts.map((alert, index) => (
            <div 
              key={index}
              className="flex items-start gap-4 p-5 bg-rose-50 rounded-xl border border-rose-200"
            >
              <Icons.Info 
                size={20} 
                className="shrink-0 mt-0.5 text-rose-600"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-rose-950 leading-relaxed">
                {alert}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
