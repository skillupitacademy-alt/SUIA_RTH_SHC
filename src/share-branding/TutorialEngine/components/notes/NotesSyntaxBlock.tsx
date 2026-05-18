import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SVGIconRenderer } from '../shared/SVGIconRenderer';

interface SyntaxExplanation {
  id: string;
  term: string;
  explanation: string;
}

interface NotesSyntaxBlockProps {
  image?: any;
  code: string;
  language?: string;
  title?: string;
  subtitle?: string;
  explanations: SyntaxExplanation[];
}

/**
 * Syntax Block Component (Template 4)
 * Premium Code Editor with Explanation List
 */
export function NotesSyntaxBlock({ 
  image,
  code, 
  language = "javascript", 
  title = "SYNTAX BLOCK",
  subtitle = "JavaScript Basic Syntax",
  explanations 
}: NotesSyntaxBlockProps) {
  const brand = useBrand();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  const lines = code.trim().split('\n');

  return (
    <div className="w-full rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <span className="text-sm font-bold">4</span>
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">{title}</h3>
        </div>
        <span className="text-xs font-bold text-slate-400">{subtitle}</span>
      </div>

      {/* Optional Visual Architecture Diagram */}
      {image && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-slate-50/50 p-3">
           <SVGIconRenderer 
             dataUri={typeof image === 'string' ? image : image?.dataUri} 
             alt={typeof image === 'object' ? image?.alt : 'Syntax Visual'} 
             className="w-full h-auto max-h-[450px] object-contain mx-auto"
           />
        </div>
      )}

      {/* Code Editor Mockup */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-[#1e293b] shadow-2xl">
        {/* Editor Controls */}
        <div className="flex items-center justify-between border-b border-slate-700/50 bg-slate-800/50 px-4 py-3">
           <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-rose-500" />
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
           </div>
           <button 
             onClick={copyToClipboard}
             className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
           >
              <Icons.Copy size={14} />
              Copy
           </button>
        </div>

        {/* Code Content */}
        <div className="overflow-x-auto p-6 font-mono text-[14px] leading-relaxed">
           <table className="border-collapse">
             <tbody>
               {lines.map((line, idx) => (
                 <tr key={idx}>
                   <td className="pr-6 text-right select-none text-slate-600 opacity-50">
                     {idx + 1}
                   </td>
                   <td className="text-slate-300 whitespace-pre">
                     {line || ' '}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>

      {/* Explanation Section */}
      <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
         <h4 className="mb-4 text-[15px] font-bold text-slate-900">Explanation</h4>
         <ul className="space-y-3">
            {explanations.map((item) => (
              <li key={item.id} className="flex items-start gap-2">
                <div className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                <p className="text-[14px] font-medium text-slate-600">
                   <code className="rounded bg-slate-200 px-1.5 py-0.5 font-bold text-slate-800">{item.term}</code>
                   <span className="mx-2 text-slate-300">→</span>
                   {item.explanation}
                </p>
              </li>
            ))}
         </ul>
      </div>
    </div>
  );
}
