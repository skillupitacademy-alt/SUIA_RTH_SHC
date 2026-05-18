'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react/no-danger */

import React, { useState, useEffect } from 'react';
import { 
  Eye, Sparkles, AlertTriangle, Terminal, Cpu, BookOpen, Info, AlertCircle
} from 'lucide-react';
import { SectionType } from './types';

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

  const getSafe = (obj: any, path: string, fallback = '') => {
    if (!obj || typeof obj !== 'object') return fallback;
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur === null || typeof cur !== 'object') return fallback;
      cur = cur[p];
    }
    return cur !== undefined && cur !== null ? cur : fallback;
  };

  const renderNotesComponent = () => {
    if (!subsection) {
      return (
        <div className="space-y-6">
          <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-xl mb-4">
            <h4 className="text-xs font-black uppercase text-pink-500 tracking-wider">Notes Section Container View</h4>
          </div>
          {getSafe(content, 'simpleWords') && (
            <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl">
              <span className="text-[9px] font-black uppercase bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded">Simple Words</span>
              <p className="text-sm font-semibold text-slate-200 mt-2 italic leading-relaxed">
                &ldquo;{getSafe(content, 'simpleWords')}&rdquo;
              </p>
            </div>
          )}
          {getSafe(content, 'definitionBlock') && (
            <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl border-l-4 border-l-pink-500">
              <span className="text-[9px] font-black uppercase bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded">Definition Block</span>
              <h4 className="text-xl font-black text-white mt-2">{getSafe(content, 'definitionBlock.term')}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{getSafe(content, 'definitionBlock.definition')}</p>
              {getSafe(content, 'definitionBlock.memoryHook') && (
                <div className="mt-3 bg-pink-950/20 border border-pink-900/50 rounded-xl p-3 text-[11px] text-pink-300 italic">
                  💡 {getSafe(content, 'definitionBlock.memoryHook')}
                </div>
              )}
            </div>
          )}
          {getSafe(content, 'componentGrid.components') && Array.isArray(getSafe(content, 'componentGrid.components')) && (
            <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl">
              <span className="text-[9px] font-black uppercase bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded mb-3 block w-fit">Component Breakdown Grid</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {content.componentGrid.components.slice(0, 4).map((comp: any, idx: number) => (
                  <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                      {comp.name || comp.title}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{comp.description || comp.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    switch (subsection) {
      case 'simpleWords':
        return (
          <div className="bg-slate-800/85 border border-slate-700/80 p-6 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="absolute -right-6 -bottom-6 text-pink-500/10"><BookOpen size={100} /></div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black uppercase bg-pink-500/15 text-pink-400 px-2.5 py-1 rounded-md tracking-wider">
                Notes &bull; Simple Words
              </span>
            </div>
            <p className="text-base font-extrabold text-slate-100 leading-relaxed italic relative z-10">
              &ldquo;{typeof content === 'string' ? content : getSafe(content, 'simpleWords')}&rdquo;
            </p>
          </div>
        );

      case 'definitionBlock':
        return (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-bl-full pointer-events-none" />
            <span className="text-[10px] font-black uppercase bg-pink-500/15 text-pink-400 px-2.5 py-1 rounded-md tracking-wider">
              Notes &bull; Glossary Definition Card
            </span>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {getSafe(content, 'term') || getSafe(content, 'definitionBlock.term') || 'Conceptual Term'}
                </h3>
                <span className="bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded leading-none">CORE</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                {getSafe(content, 'definition') || getSafe(content, 'definitionBlock.definition') || 'Dictionary description...'}
              </p>
              
              {(getSafe(content, 'memoryHook') || getSafe(content, 'definitionBlock.memoryHook')) && (
                <div className="mt-4 bg-pink-950/20 border border-pink-900/30 rounded-2xl p-4 flex gap-2">
                  <span className="text-lg shrink-0">💡</span>
                  <div>
                    <h5 className="text-[10px] font-black text-pink-400 uppercase tracking-wider">Memory Hook Analogy</h5>
                    <p className="text-[11px] text-pink-200 font-semibold italic mt-0.5 leading-relaxed">
                      {getSafe(content, 'memoryHook') || getSafe(content, 'definitionBlock.memoryHook')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'warningFaq':
        return (
          <div className="bg-amber-950/20 border-2 border-amber-900/60 rounded-3xl p-6 shadow-xl relative">
            <span className="text-[10px] font-black uppercase bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1 w-fit">
              <AlertTriangle size={12} /> Gotchas & Warning FAQ
            </span>
            <div className="mt-4 space-y-3">
              <h4 className="text-base font-bold text-amber-200 flex items-center gap-2">
                ⚠️ {getSafe(content, 'warningTitle') || 'Common Pitfall Trap'}
              </h4>
              <p className="text-xs text-amber-100/90 leading-relaxed font-semibold">
                {getSafe(content, 'warningDescription') || 'Description of the trap and warning criteria...'}
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
            <span className="text-[10px] font-black uppercase text-pink-400 tracking-wider">
              {subsection} Subsection Detail
            </span>
            <pre className="mt-3 overflow-auto bg-slate-900 rounded-lg p-3 text-[10px] text-slate-300 max-h-[300px]">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const renderLaymanComponent = () => {
    if (!subsection) {
      return (
        <div className="space-y-6">
          <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-xl">
            <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider">Layman Section Container View</h4>
          </div>
          {getSafe(content, 'everydayAnalogy.analogyName') && (
            <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl border-l-4 border-l-amber-500">
              <span className="text-[9px] font-black uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">Everyday Analogy</span>
              <h4 className="text-lg font-black text-white mt-2">{getSafe(content, 'everydayAnalogy.analogyName')}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{getSafe(content, 'everydayAnalogy.explanation')}</p>
            </div>
          )}
        </div>
      );
    }

    switch (subsection) {
      case 'everydayAnalogy':
        return (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 text-amber-500/10"><Cpu size={100} /></div>
            <span className="text-[10px] font-black uppercase bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1 w-fit">
              <Cpu size={12} /> Layman &bull; Everyday Analogy
            </span>
            <div className="mt-4 space-y-3 relative z-10">
              <h3 className="text-xl font-black text-white tracking-tight">
                {getSafe(content, 'analogyName') || getSafe(content, 'everydayAnalogy.analogyName') || 'Metaphor Comparison'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                {getSafe(content, 'explanation') || getSafe(content, 'everydayAnalogy.explanation') || 'Plain English analogy breakdown...'}
              </p>
              
              {(getSafe(content, 'visualConcept') || getSafe(content, 'everydayAnalogy.visualConcept')) && (
                <div className="mt-3 bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 text-[11px] text-amber-300 font-medium">
                  🎨 Metaphor Graphic Mapping: {getSafe(content, 'visualConcept') || getSafe(content, 'everydayAnalogy.visualConcept')}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
              {subsection} Subsection Detail
            </span>
            <pre className="mt-3 overflow-auto bg-slate-900 rounded-lg p-3 text-[10px] text-slate-300 max-h-[300px]">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const renderCodeComponent = () => {
    if (subsection === 'basicCodeExample') {
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold">Code Sandbox Preview</span>
          </div>
          <div className="p-5 space-y-4">
            <h4 className="text-sm font-bold text-white">
              🖥️ {getSafe(content, 'title') || getSafe(content, 'basicCodeExample.title') || 'Interactive Editor File'}
            </h4>
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 font-mono text-xs text-emerald-400">
              <pre className="overflow-x-auto whitespace-pre">
                {getSafe(content, 'code') || getSafe(content, 'basicCodeExample.code') || '# Paste programming syntax here'}
              </pre>
            </div>
          </div>
        </div>
      );
    }

    if (subsection === 'outputDemonstration') {
      return (
        <div className="bg-slate-955 border border-slate-850 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center gap-2 mb-3 border-b border-slate-900 pb-2">
            <Terminal size={16} className="text-slate-500" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Console Simulator Output</span>
          </div>
          <div className="font-mono text-xs text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">
              &gt; {getSafe(content, 'simulatedLogs') || getSafe(content, 'outputDemonstration.simulatedLogs') || 'Execution logs...'}
            </pre>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
          Code &bull; {subsection || 'Whole Section'} Detail
        </span>
        <pre className="mt-3 overflow-auto bg-slate-900 rounded-lg p-3 text-[10px] text-slate-300 max-h-[300px]">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    );
  };

  const renderComponentBody = () => {
    switch (section) {
      case 'notes':
        return renderNotesComponent();
      case 'layman':
        return renderLaymanComponent();
      case 'code':
        return renderCodeComponent();
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
