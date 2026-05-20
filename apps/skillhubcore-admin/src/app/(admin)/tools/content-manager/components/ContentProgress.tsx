'use client';

import React from 'react';
import { sections } from './types';

interface ContentProgressProps {
  sectionStatus: Record<string, boolean>;
  getPageUrl: () => string;
}

export function ContentProgress({ sectionStatus, getPageUrl }: ContentProgressProps) {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-lg border border-slate-100">
      <h2 className="mb-6 text-2xl font-bold text-gray-800 font-outfit">Content Progress</h2>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className={`rounded-lg border-2 p-4 ${sectionStatus[section.id] ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
              }`}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 min-w-8 items-center justify-center rounded bg-white px-2 text-xs font-bold text-gray-700 shadow-sm">
                {section.marker}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800">{section.label}</p>
                <p className={`text-xs ${sectionStatus[section.id] ? 'text-green-600' : 'text-gray-500'}`}>
                  {sectionStatus[section.id] ? 'Saved' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded border-l-4 border-blue-500 bg-blue-50 p-4">
        <p className="font-medium text-blue-900">
          Page URL:{' '}
          <a href={getPageUrl()} target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-blue-700">
            {getPageUrl()}
          </a>
        </p>
      </div>
    </section>
  );
}
