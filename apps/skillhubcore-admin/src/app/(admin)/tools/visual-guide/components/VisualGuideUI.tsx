'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Eye, Sparkles, Edit, List, Map, 
  ArrowRight, Compass, CheckCircle2, 
  Layers, X, Save, Plus, Trash2
} from 'lucide-react';
import { SubsectionInfo, SectionSpec } from './types';
import { SECTIONS_SPECS } from './sections-specs';
import { WireframeRenderer } from './WireframeRenderer';

export function VisualGuideUI() {
  const [sections, setSections] = useState<SectionSpec[]>(SECTIONS_SPECS);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('notes');
  const [selectedSubsectionId, setSelectedSubsectionId] = useState<string>('definitionBlock');
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null);
  const [isEditingSubsection, setIsEditingSubsection] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<SubsectionInfo | null>(null);

  const activeSection = sections.find(s => s.id === selectedSectionId) || sections[1];
  const activeSubsection = activeSection.subsections.find(sub => sub.id === selectedSubsectionId) || activeSection.subsections[0];

  const wireframeCanvasRef = useRef<HTMLDivElement>(null);

  const handleSectionChange = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    const sect = sections.find(s => s.id === sectionId) || sections[1];
    setSelectedSubsectionId(sect.subsections[0].id);
    scrollToWireframeSegment(sectionId);
  };

  const handleEditClick = () => {
    setEditForm({ ...activeSubsection, components: [...activeSubsection.components] });
    setIsEditingSubsection(true);
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    setSections(prev => prev.map(sect => {
      if (sect.id === activeSection.id) {
        return {
          ...sect,
          subsections: sect.subsections.map(sub => sub.id === editForm.id ? editForm : sub)
        };
      }
      return sect;
    }));
    setIsEditingSubsection(false);
  };

  const scrollToWireframeSegment = (sectionId: string) => {
    setHighlightedElement(sectionId);
    setTimeout(() => setHighlightedElement(null), 2500);
    if (wireframeCanvasRef.current) {
      wireframeCanvasRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (highlightedElement) {
      const timer = setTimeout(() => setHighlightedElement(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [highlightedElement]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!wireframeCanvasRef.current) return;
      
      const overlays = wireframeCanvasRef.current.querySelectorAll('.absolute.inset-0');
      let activeOverlay: HTMLElement | null = null;
      
      for (const el of Array.from(overlays)) {
        const htmlEl = el as HTMLElement;
        const className = htmlEl.className;
        if (className.includes('scale-100') && !className.includes('border-transparent')) {
          activeOverlay = htmlEl;
          break;
        }
      }
      
      if (activeOverlay && activeOverlay.parentElement) {
        activeOverlay.parentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }, 80);
    
    return () => clearTimeout(timer);
  }, [selectedSectionId, selectedSubsectionId]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Upper Title Block */}
      <header className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-slate-100">
        <div className="p-8 text-center bg-gradient-to-r from-pink-600 via-purple-600 to-orange-600">
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight font-outfit">
            Global Visual Architecture & Component Guide
          </h1>
          <p className="text-white/90 text-lg font-semibold max-w-2xl mx-auto">
            An interactive reference guide mapping all 14 sections and their subsections to understand page placements, UI layouts, and AI prompt roles.
          </p>
        </div>
        
        {/* Navigation Shortcut Panel */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-600 font-bold">
            <Layers size={18} className="text-pink-600" />
            <span>Developer Workspace Connections:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link 
              href={`/tools/prompt-generator?section=${selectedSectionId}&subsection=${selectedSubsectionId}`}
              className="flex items-center gap-2 px-4 py-2 bg-pink-50 border border-pink-100 hover:bg-pink-100 text-pink-600 font-bold rounded-xl transition-all"
            >
              <Sparkles size={16} />
              Open Prompt Generator
            </Link>
            <Link 
              href={`/tools/content-manager?section=${selectedSectionId}&subsection=${selectedSubsectionId}`}
              className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 hover:bg-orange-100 text-orange-600 font-bold rounded-xl transition-all"
            >
              <Edit size={16} />
              Open Content Manager
            </Link>
          </div>
        </div>
      </header>

      {/* Main Dual Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Control Column (lg:col-span-5) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Section Selection List */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <List size={20} className="text-purple-600" />
              14 Educational Sections
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {sections.map((sect) => (
                <button
                  key={sect.id}
                  onClick={() => handleSectionChange(sect.id)}
                  className={`flex flex-col text-left p-3 rounded-xl border-2 transition-all ${
                    selectedSectionId === sect.id
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-[1.02]'
                      : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-purple-200 hover:bg-purple-50/50'
                  }`}
                >
                  <span className="font-bold text-sm">{sect.label}</span>
                  <span className={`text-[10px] ${selectedSectionId === sect.id ? 'text-slate-400' : 'text-slate-500'} mt-1 truncate`}>
                    {sect.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Subsections & Component Mappings */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 flex-1 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Map size={20} className="text-orange-600" />
              Subsections & Components Map
            </h2>

            <div className="space-y-3 mb-6">
              <label htmlFor="subset-select" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Subsection for Deep Dive:
              </label>
              <select
                id="subset-select"
                value={selectedSubsectionId}
                onChange={(e) => setSelectedSubsectionId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer"
              >
                {activeSection.subsections.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.label} ({sub.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Subsection Details Dashboard */}
            <div className="flex-1 bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4 relative">
              <button 
                onClick={handleEditClick}
                className="absolute top-4 right-4 bg-white border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1 text-[11px] font-bold"
              >
                <Edit size={14} /> Edit Component
              </button>
              <div className="pr-32">
                <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md tracking-wider">
                  Subsection Role
                </span>
                <h3 className="text-base font-extrabold text-slate-800 mt-2">
                  {activeSubsection.label}
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                  {activeSubsection.purpose}
                </p>
              </div>

              {/* Components Inside */}
              <div>
                <span className="text-[10px] font-black uppercase bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md tracking-wider">
                  Visible UI Elements Inside
                </span>
                <div className="flex flex-wrap gap-2 mt-3">
                  {activeSubsection.components.map((comp, idx) => (
                    <span key={idx} className="bg-white border border-slate-200/80 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 hover:border-purple-300 transition-colors">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Associated SVG asset mapping */}
              {activeSubsection.svgId && (
                <div className="pt-4 border-t border-slate-200/60 space-y-2">
                  <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md tracking-wider flex w-fit items-center gap-1">
                    <Compass size={11} /> Associated SVG Image Asset
                  </span>
                  <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3 flex items-center justify-between text-xs hover:bg-amber-50 transition-colors">
                    <div>
                      <p className="font-extrabold text-amber-900 leading-none">{activeSubsection.svgLabel}</p>
                      <p className="text-[9px] text-amber-600 font-bold mt-1">Asset ID: {activeSubsection.svgId}</p>
                    </div>
                    <Link 
                      href={`/tools/prompt-generator?section=${selectedSectionId}&asset=${activeSubsection.svgId}`}
                      className="flex items-center gap-1 text-[11px] font-black text-amber-700 hover:underline shrink-0"
                    >
                      Prompt specs <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Preview Column (lg:col-span-7) */}
        <section className="lg:col-span-7 bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col h-[750px] overflow-hidden">
          
          {/* Live Mockup Header Panel */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
              <span className="text-xs font-bold text-slate-500 font-mono ml-2">
                Simulated Canvas: /start-learning/subtopic/whatispython
              </span>
            </div>
            <span className="bg-emerald-50 border border-emerald-100 text-emerald-605 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
              <Eye size={12} /> Live Preview Map
            </span>
          </div>

          {/* Tab Selector Bar inside the Simulated Canvas representing the 14 Educational Sections */}
          <div className="flex items-center gap-1.5 bg-slate-900 text-white px-4 py-3 overflow-x-auto text-[11px] font-bold hide-scrollbar select-none border-b border-slate-800">
            {sections.map((sect) => (
              <button
                key={sect.id}
                onClick={() => handleSectionChange(sect.id)}
                className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all duration-200 ${
                  selectedSectionId === sect.id 
                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 text-white shadow-lg shadow-pink-500/20 scale-[1.02] border border-white/10' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                }`}
              >
                {sect.label.replace(/^\d+\.\s*/, '')}
              </button>
            ))}
          </div>

          {/* Simulated Educational Page Wireframe Content Canvas */}
          <WireframeRenderer
            selectedSectionId={selectedSectionId}
            selectedSubsectionId={selectedSubsectionId}
            highlightedElement={highlightedElement}
            handleSectionChange={handleSectionChange}
            wireframeCanvasRef={wireframeCanvasRef}
          />

        </section>

      </div>

      {/* Full-width Edit Mode Overlay */}
      {isEditingSubsection && editForm && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in slide-in-from-right-8 duration-300">
          {/* Header */}
          <header className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-pink-500 to-orange-500 w-10 h-10 rounded-lg flex items-center justify-center shadow-lg">
                <Edit size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-outfit tracking-tight">Edit Component: {activeSubsection.label}</h2>
                <p className="text-[11px] text-slate-400 font-medium tracking-wider uppercase">Live Visual Architecture Editor</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditingSubsection(false)}
                className="px-4 py-2 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <X size={16} /> Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-5 py-2 text-sm font-bold bg-white text-slate-900 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </header>

          {/* Split Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Form (1/3 width) */}
            <div className="w-1/3 border-r border-slate-200 bg-white p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Edit Labels</span>
                  <div className="space-y-4">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Component Label</span>
                      <input 
                        type="text" 
                        value={editForm.label}
                        onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Component Purpose & Role</span>
                      <textarea 
                        rows={3}
                        value={editForm.purpose}
                        onChange={e => setEditForm({ ...editForm, purpose: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-400">UI Elements Inside</h4>
                    <button 
                      onClick={() => setEditForm({ ...editForm, components: [...editForm.components, 'New Component'] })}
                      className="text-[10px] font-black text-purple-600 hover:text-purple-700 flex items-center gap-0.5"
                    >
                      <Plus size={12} /> Add Component
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {editForm.components.map((comp, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          value={comp}
                          onChange={e => {
                            const copy = [...editForm.components];
                            copy[idx] = e.target.value;
                            setEditForm({ ...editForm, components: copy });
                          }}
                          className="flex-1 px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                        <button 
                          onClick={() => {
                            const copy = [...editForm.components];
                            copy.splice(idx, 1);
                            setEditForm({ ...editForm, components: copy });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-[10px] font-black uppercase text-amber-600 mb-3 flex items-center gap-1"><Compass size={14} /> SVG Asset Mapping (Optional)</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">SVG Asset ID</span>
                      <input 
                        type="text" 
                        value={editForm.svgId || ''}
                        onChange={e => setEditForm({ ...editForm, svgId: e.target.value })}
                        placeholder="e.g. overview-hero"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">SVG Asset Label</span>
                      <input 
                        type="text" 
                        value={editForm.svgLabel || ''}
                        onChange={e => setEditForm({ ...editForm, svgLabel: e.target.value })}
                        placeholder="e.g. Hero Dashboard Diagram"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Preview Dashboard (2/3 width) */}
            <div className="w-2/3 bg-[#f4f7fa] p-8 overflow-y-auto flex items-start justify-center relative">
              {/* Pattern Background */}
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
              
              <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl relative z-10 scale-[1.02]">
                <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1 animate-pulse">
                  <Eye size={12} /> Live Preview
                </div>
                
                <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md tracking-wider">
                  Subsection Role
                </span>
                <h3 className="text-2xl font-extrabold text-slate-800 mt-3 font-outfit">
                  {editForm.label}
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed mt-2">
                  {editForm.purpose}
                </p>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <span className="text-[10px] font-black uppercase bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md tracking-wider">
                    Visible UI Elements Inside
                  </span>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {editForm.components.length === 0 && (
                      <span className="text-sm text-slate-400 italic font-medium px-2 py-1">No components added yet. Add elements on the left.</span>
                    )}
                    {editForm.components.map((comp, idx) => (
                      <span key={idx} className="bg-slate-50 border border-slate-200/80 text-slate-700 text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all hover:border-emerald-300">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                {editForm.svgId && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md tracking-wider flex w-fit items-center gap-1 mb-4">
                      <Compass size={11} /> Associated SVG Image Asset
                    </span>
                    <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <p className="font-extrabold text-amber-900 text-lg leading-tight">{editForm.svgLabel || 'Unnamed Asset'}</p>
                        <p className="text-[11px] text-amber-600 font-bold mt-1.5 font-mono bg-amber-200/40 w-fit px-2 py-0.5 rounded">ID: {editForm.svgId}</p>
                      </div>
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-amber-100 shrink-0 text-amber-500">
                        <Map size={24} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
