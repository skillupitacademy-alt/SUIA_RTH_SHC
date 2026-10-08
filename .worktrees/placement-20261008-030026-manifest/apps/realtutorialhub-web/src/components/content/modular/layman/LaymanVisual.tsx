'use client';

import React from 'react';
import { ArrowRight, Brain } from 'lucide-react';

interface LaymanVisualProps {
  data: {
    title: string;
    conceptMap: {
      nodes: Array<{
        id: string;
        label: string;
        description: string;
      }>;
      connections: Array<{
        from: string;
        to: string;
        label: string;
      }>;
    };
    visualLabels: string[];
  };
  sectionNumber?: number;
}

export function LaymanVisual({ data, sectionNumber = 6 }: LaymanVisualProps) {
  if (!data) return null;

  const nodeById = new Map(data.conceptMap.nodes.map((node) => [node.id, node]));
  const orderedNodes = data.conceptMap.connections.length > 0
    ? Array.from(
        new Set([
          data.conceptMap.connections[0]?.from,
          ...data.conceptMap.connections.flatMap((connection) => [connection.from, connection.to]),
        ])
      )
        .map((id) => nodeById.get(id))
        .filter((node): node is NonNullable<typeof node> => Boolean(node))
    : data.conceptMap.nodes;

  return (
    <section className="rounded-[28px] border border-blue-200 bg-white p-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)] h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-lg font-black text-white">
          {sectionNumber}
        </div>
        <h3 className="text-3xl font-black tracking-tight text-slate-950">{data.title}</h3>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {orderedNodes.map((node, index) => (
            <React.Fragment key={node.id}>
              <article className="min-w-[150px] max-w-[210px] rounded-2xl border border-blue-200 bg-white px-4 py-4 text-center shadow-sm">
                <div className="text-base font-black text-slate-950">{node.label}</div>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{node.description}</p>
              </article>
              {index < orderedNodes.length - 1 ? <ArrowRight size={20} className="text-slate-400" /> : null}
            </React.Fragment>
          ))}
        </div>

        {data.visualLabels.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
              <Brain size={14} />
              Think Like This
            </div>
            <ul className="space-y-2">
              {data.visualLabels.map((label, index) => (
                <li key={index} className="text-sm font-semibold leading-6 text-blue-950">
                  {label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
