'use client';

import React from 'react';
import * as Icons from 'lucide-react';

interface ConceptComparisonProps {
  data: {
    gridTitle: string;
    useCaseCards: Array<{
      id: string;
      title: string;
      description: string;
      category: 'everyday' | 'career';
      icon: string;
    }>;
  };
  sectionNumber?: number;
}

function getIcon(iconName: string) {
  const registry = Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;
  return registry[iconName] ?? Icons.Box;
}

export function ConceptComparison({ data, sectionNumber = 4 }: ConceptComparisonProps) {
  if (!data) return null;

  return (
    <section className="rounded-[28px] border border-violet-200 bg-white p-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)] h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500 text-lg font-black text-white">
          {sectionNumber}
        </div>
        <h3 className="text-3xl font-black tracking-tight text-slate-950">{data.gridTitle}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {data.useCaseCards.map((card) => {
          const Icon = getIcon(card.icon);
          const isEveryday = card.category === 'everyday';
          return (
            <article
              key={card.id}
              className={`rounded-[22px] border p-5 text-center shadow-sm ${
                isEveryday ? 'border-amber-200 bg-amber-50' : 'border-indigo-200 bg-indigo-50'
              }`}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Icon size={22} className={isEveryday ? 'text-amber-600' : 'text-indigo-600'} />
              </div>
              <h4 className="mt-4 text-base font-black text-slate-950">{card.title}</h4>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{card.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
