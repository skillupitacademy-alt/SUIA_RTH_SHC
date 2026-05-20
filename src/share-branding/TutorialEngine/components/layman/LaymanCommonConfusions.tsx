import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface ConfusionItem {
  id: string;
  confusion: string;
  clarification: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface LaymanCommonConfusionsProps {
  title: string;
  confusionItems?: ConfusionItem[];
  faqItems?: FaqItem[];
  misconceptionAlerts?: string[];
}

/**
 * Layman Common Confusions Component
 * Renderer: faq_block
 * Layout Template: faq_accordion
 * Purpose: Confusion prevention, FAQ, misconception system
 */
export function LaymanCommonConfusions({
  title,
  confusionItems = [],
  faqItems = [],
  misconceptionAlerts = []
}: LaymanCommonConfusionsProps) {
  const brand = useBrand();
  const [openFaqId, setOpenFaqId] = useState<string>(faqItems[0]?.id || '');

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? '' : id);
  };

  return (
    <div className="w-full mb-8">
      {/* Title */}
      <h3 className="text-2xl font-bold text-slate-950 mb-6">{title}</h3>

      {/* Confusion Items */}
      <div className="mb-8">
        <h4 className="text-lg font-bold text-slate-950 mb-4 flex items-center gap-2">
          <Icons.HelpCircle size={20} className="text-amber-600" aria-hidden="true" />
          Common Questions Beginners Ask
        </h4>
        <div className="space-y-4">
          {confusionItems.map((item) => (
            <div
              key={item.id}
              className="bg-amber-50 rounded-xl p-5 border border-amber-200"
            >
              <div className="flex items-start gap-3 mb-3">
                <Icons.AlertCircle
                  size={20}
                  className="shrink-0 mt-0.5 text-amber-600"
                  aria-hidden="true"
                />
                <p className="text-base font-bold text-amber-950">
                  ❓ {item.confusion}
                </p>
              </div>
              <div className="ml-8 p-4 bg-white rounded-lg">
                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                  ✅ {item.clarification}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="mb-8">
        <h4 className="text-lg font-bold text-slate-950 mb-4 flex items-center gap-2">
          <Icons.MessageCircle size={20} className="text-blue-600" aria-hidden="true" />
          Frequently Asked Questions
        </h4>
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
        <h4 className="text-lg font-bold text-slate-950 mb-4 flex items-center gap-2">
          <Icons.AlertTriangle size={20} className="text-rose-600" aria-hidden="true" />
          Important: Don't Believe These Myths!
        </h4>
        <div className="space-y-3">
          {misconceptionAlerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-5 bg-rose-50 rounded-xl border border-rose-200"
            >
              <Icons.XCircle
                size={20}
                className="shrink-0 mt-0.5 text-rose-600"
                aria-hidden="true"
              />
              <p className="text-sm font-bold text-rose-950 leading-relaxed">
                {alert}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
