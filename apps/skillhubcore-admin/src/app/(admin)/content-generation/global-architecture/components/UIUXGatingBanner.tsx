"use client";

import React from 'react';
import { Lock, Unlock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import type { ArchitectureStatus } from '../types';

interface UIUXGatingBannerProps {
  isLocked: boolean;
  educationalStatus: ArchitectureStatus;
  enabledComponentsCount: number;
  totalComponentsCount: number;
  sectionLabel: string;
  onNavigateToEducational: () => void;
}

export function UIUXGatingBanner({
  isLocked,
  educationalStatus,
  enabledComponentsCount,
  totalComponentsCount,
  sectionLabel,
  onNavigateToEducational,
}: UIUXGatingBannerProps) {
  if (!isLocked) {
    // Show unlocked/success banner
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <Unlock size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-emerald-900 mb-2">
              ✅ UI/UX Architecture - UNLOCKED
            </h3>
            <p className="text-sm font-semibold text-emerald-800 mb-3">
              Educational Architecture is finalized. You can now design visual styling for the selected components.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-emerald-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Designing for {enabledComponentsCount} enabled components</span>
              </div>
              <div className="w-px h-4 bg-emerald-300" />
              <div className="flex items-center gap-2">
                <span>Educational Architecture: Finalized</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToEducational}
            className="bg-white border border-emerald-200 text-emerald-700 rounded-xl px-4 py-2 text-xs font-black hover:bg-emerald-50 transition-colors"
          >
            View Educational Arch
          </button>
        </div>
      </div>
    );
  }

  // Show locked banner
  return (
    <div className="bg-gradient-to-r from-rose-50 to-red-50 border-2 border-rose-300 rounded-2xl p-8 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-rose-600 flex items-center justify-center shrink-0">
          <Lock size={32} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-black text-rose-900 mb-2 flex items-center gap-3">
            🔒 UI/UX Architecture - LOCKED
          </h3>
          <p className="text-base font-semibold text-rose-800 mb-4">
            Complete and finalize Educational Architecture before designing UI/UX properties.
          </p>

          {/* Current Status */}
          <div className="bg-white border border-rose-200 rounded-xl p-4 mb-4">
            <h4 className="text-sm font-black uppercase text-rose-900 mb-3">Educational Architecture Status</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <span className="text-xs font-bold text-slate-600 block mb-1">Current Status</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    educationalStatus === 'finalized' ? 'bg-emerald-500' :
                    educationalStatus === 'ready' ? 'bg-blue-500' :
                    educationalStatus === 'archived' ? 'bg-amber-500' :
                    'bg-slate-400'
                  }`} />
                  <span className="text-sm font-black text-slate-900 capitalize">{educationalStatus}</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-600 block mb-1">Enabled Components</span>
                <span className="text-sm font-black text-slate-900">{enabledComponentsCount} of {totalComponentsCount}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-600 block mb-1">Section</span>
                <span className="text-sm font-black text-slate-900">{sectionLabel}</span>
              </div>
            </div>
          </div>

          {/* What needs to be done */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <h4 className="text-sm font-black uppercase text-amber-900 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} />
              What You Need to Do
            </h4>
            <ol className="space-y-2 text-sm font-semibold text-amber-900">
              <li className="flex items-start gap-2">
                <span className="font-black shrink-0">1.</span>
                <span>Switch to Educational Architecture dropdown above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black shrink-0">2.</span>
                <span>Select at least 3 components to enable (use Component Selection tab)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black shrink-0">3.</span>
                <span>Configure educational properties for each enabled component</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black shrink-0">4.</span>
                <span>Go to Learning Flow & Requirements tab and click &quot;Finalize&quot;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black shrink-0">5.</span>
                <span>Return to UI/UX Architecture to design visual styling</span>
              </li>
            </ol>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={onNavigateToEducational}
            className="bg-rose-600 text-white rounded-xl px-6 py-3 text-sm font-black hover:bg-rose-700 transition-colors flex items-center gap-2 shadow-lg"
          >
            <ArrowRight size={16} />
            Go to Educational Architecture
          </button>

          {/* Why this exists */}
          <div className="mt-6 pt-4 border-t border-rose-200">
            <h4 className="text-xs font-black uppercase text-rose-900 mb-2">💡 Why This Workflow?</h4>
            <p className="text-xs font-semibold text-rose-700 leading-relaxed">
              Educational Architecture defines <strong>WHAT</strong> components to show and <strong>WHY</strong> they matter for learning.
              UI/UX Architecture defines <strong>HOW</strong> they look and feel. This separation ensures pedagogical decisions 
              come before visual design, preventing you from designing components that won&apos;t be used.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
