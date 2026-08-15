'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

export function WhatHappensNextPipeline() {
  const steps = [
    {
      step: '1',
      title: 'Review Block Suggestions',
      description: 'Review and adjust the suggested blocks',
      isActive: true,
    },
    {
      step: '2',
      title: 'Choose Presentation Ideas',
      description: 'Select the best layouts and components',
      isActive: false,
    },
    {
      step: '3',
      title: 'Build in Composer',
      description: 'Compose and arrange content visually',
      isActive: false,
    },
    {
      step: '4',
      title: 'Save as Document',
      description: 'Save and proceed to preview',
      isActive: false,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mt-6">
      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
        What happens next?
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        {steps.map((item, index) => {
          const isLast = index === steps.length - 1;

          return (
            <div key={item.step} className="flex items-center gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    item.isActive
                      ? 'border-2 border-pink-500 text-pink-600 font-extrabold bg-pink-50/50'
                      : 'border border-slate-200 text-slate-400 bg-slate-50'
                  }`}
                >
                  {item.step}
                </span>

                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </div>

              {!isLast && (
                <ArrowRight
                  size={16}
                  className="hidden lg:block text-slate-300 shrink-0 ml-auto mr-1"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
