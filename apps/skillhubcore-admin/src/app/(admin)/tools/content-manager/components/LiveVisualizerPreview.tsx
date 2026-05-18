'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react/no-danger */

import React, { useState, useEffect } from 'react';
import { Eye, Sparkles, Info, AlertCircle } from 'lucide-react';
import { SectionType } from './types';
import { NotesPreview } from './previewers/NotesPreview';
import { LaymanPreview } from './previewers/LaymanPreview';
import { CodePreview } from './previewers/CodePreview';

interface LiveVisualizerPreviewProps {
  section: SectionType;
  subsection: string;
  rawData: string;
}

export function LiveVisualizerPreview({ section, subsection, rawData }: LiveVisualizerPreviewProps) {
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const trimmed = rawData.trim();
    if (!trimmed) {
      setParsedData(null);
      return;
    }

    if (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml') || trimmed.includes('<svg')) {
      setParsedData({ type: 'svg', markup: trimmed });
      return;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed[section]) {
        setParsedData({ type: 'json', content: parsed[section] });
      } else {
        setParsedData({ type: 'json', content: parsed });
      }
    } catch (e: any) {
      setError(e.message || 'Invalid JSON syntax');
      setParsedData(null);
    }
  }, [rawData, section, subsection]);

  if (!rawData.trim()) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400">
        <Info className="w-12 h-12 mb-4 text-slate-500 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-300">Visualizer Preview Ready</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-2">
          Type or paste your JSON content or SVG markup in the editor to see it live-rendered in post-landing page theme styles.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-rose-400">
        <AlertCircle className="w-12 h-12 mb-4 text-rose-500" />
        <h3 className="text-lg font-bold text-rose-300">Syntax Alert</h3>
        <p className="text-xs text-rose-500/80 max-w-xs mt-2 font-mono bg-rose-950/40 p-3 rounded-xl border border-rose-900/50">
          {error}
        </p>
        <p className="text-[10px] text-slate-500 mt-4">
          Visualizer requires correct JSON or raw SVG format to draw mockups.
        </p>
      </div>
    );
  }

  if (parsedData?.type === 'svg') {
    return (
      <div className="flex flex-col h-full bg-slate-950/80 rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <span className="text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded tracking-wider flex items-center gap-1">
            <Sparkles size={12} /> Live SVG Illustration Preview
          </span>
          <span className="text-[10px] font-mono text-slate-500">Vector Render Mode</span>
        </div>
        <div className="flex-1 flex items-center justify-center bg-white rounded-xl p-4 min-h-[300px] shadow-inner overflow-auto">
          <div 
            className="w-full max-w-[500px] flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: parsedData.markup }}
          />
        </div>
      </div>
    );
  }

  const content = parsedData?.content;
  if (!content) return null;

  const renderComponentBody = () => {
    switch (section) {
      case 'notes':
        return <NotesPreview subsection={subsection} content={content} />;
      case 'layman':
        return <LaymanPreview subsection={subsection} content={content} />;
      case 'code':
        return <CodePreview subsection={subsection} content={content} />;
      default:
        return (
          <div className="space-y-4">
            <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
              <span className="text-[10px] font-black uppercase bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                Section: {section.toUpperCase()}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {subsection ? `Subsection: ${subsection}` : 'Whole Block Render'}
              </span>
            </div>
            <pre className="overflow-auto bg-slate-955 rounded-xl p-4 text-[11px] text-slate-300 max-h-[450px] border border-slate-850 font-mono">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl overflow-hidden min-h-[450px]">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-pink-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-2 font-mono">
            Live Component Visualizer
          </span>
        </div>
        <span className="bg-pink-500/10 text-pink-400 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 animate-pulse">
          <Eye size={12} /> Active Preview Map
        </span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 py-1">
        {renderComponentBody()}
      </div>
    </div>
  );
}
