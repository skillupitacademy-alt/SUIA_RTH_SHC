'use client';

import React from 'react';
import * as Icons from 'lucide-react';

interface RealWorldScenarioProps {
  data: {
    sectionTitle: string;
    benefitCards: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      type: 'career' | 'practical' | 'future';
    }>;
  };
  sectionNumber?: number;
}

const typeStyles: Record<'career' | 'practical' | 'future', { card: string; label: string }> = {
  career: { card: 'border-purple-200 bg-purple-50', label: 'text-purple-700' },
  practical: { card: 'border-blue-200 bg-blue-50', label: 'text-blue-700' },
  future: { card: 'border-emerald-200 bg-emerald-50', label: 'text-emerald-700' },
};

function getIcon(iconName: string) {
  const registry = Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;
  return registry[iconName] ?? Icons.Star;
}

export function RealWorldScenario({ data, sectionNumber = 3 }: RealWorldScenarioProps) {
  if (!data) return null;

  return (
    <section className="rounded-[28px] border border-amber-200 bg-white p-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)] h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500 text-lg font-black text-white">
          {sectionNumber}
        </div>
        <h3 className="text-3xl font-black tracking-tight text-slate-950">{data.sectionTitle}</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {data.benefitCards.map((card) => {
          const Icon = getIcon(card.icon);
          const style = typeStyles[card.type];

          return (
            <article key={card.id} className={`rounded-[24px] border p-5 shadow-sm ${style.card}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Icon size={22} className={style.label} />
              </div>
              <h4 className="mt-4 text-lg font-black text-slate-950">{card.title}</h4>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{card.description}</p>
              <div className={`mt-4 text-[11px] font-black uppercase tracking-[0.16em] ${style.label}`}>{card.type}</div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
