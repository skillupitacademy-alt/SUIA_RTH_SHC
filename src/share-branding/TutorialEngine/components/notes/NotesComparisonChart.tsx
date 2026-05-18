import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SVGIconRenderer } from '../shared/SVGIconRenderer';

interface NotesComparisonChartProps {
  image?: any;
  title: string;
  columns: string[];
  rows: string[][];
}

/**
 * Comparison Summary Chart Component
 * Renderer: comparison_summary_chart
 * Purpose: Side-by-side comparison of technical concepts
 */
export function NotesComparisonChart({ image, title, columns, rows }: NotesComparisonChartProps) {
  const brand = useBrand();

  const dataUri = typeof image === 'string' ? image : image?.dataUri;
  const altText = typeof image === 'object' ? image?.alt : 'Comparison Diagram';

  return (
    <div className="w-full rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl sm:p-8 overflow-hidden">
      <div className="mb-6 flex items-center gap-2">
        <div 
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <span className="text-sm font-bold">5</span>
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Comparison Summary Chart</h3>
      </div>

      {dataUri && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-slate-50/50 p-3">
          <SVGIconRenderer 
            dataUri={dataUri} 
            alt={altText} 
            className="w-full h-auto max-h-[450px] object-contain mx-auto"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className={`px-6 py-4 font-bold tracking-tight text-slate-900 ${i === 0 ? 'bg-slate-100/50' : ''}`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <tr key={i} className="transition-colors hover:bg-slate-50/50">
                {row.map((cell, j) => (
                  <td 
                    key={j} 
                    className={`px-6 py-4 font-medium leading-relaxed ${
                      j === 0 
                        ? 'text-slate-900 bg-slate-50/50 font-bold border-r border-slate-100' 
                        : 'text-slate-600'
                    }`}
                  >
                    {cell.includes('<') && cell.includes('>') ? (
                       <code className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[12px]">{cell}</code>
                    ) : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-lg bg-emerald-50 p-4 border border-emerald-100">
         <Icons.Info size={18} className="text-emerald-600 shrink-0" />
         <p className="text-[12px] font-medium text-emerald-800">
           Use this chart for quick revision before exams to distinguish between core technologies.
         </p>
      </div>
    </div>
  );
}
