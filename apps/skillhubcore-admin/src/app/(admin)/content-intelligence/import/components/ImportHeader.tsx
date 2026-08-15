'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Play, ArrowRight, HelpCircle, Bell } from 'lucide-react';

interface ImportHeaderProps {
  onHowItWorksClick: () => void;
  onAnalyzeContent: () => void;
  isAnalyzing?: boolean;
}

export function ImportHeader({
  onHowItWorksClick,
  onAnalyzeContent,
  isAnalyzing = false,
}: ImportHeaderProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Top Breadcrumb & User Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 pb-2">
        <div className="flex items-center gap-1.5 font-medium">
          <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
            Dashboard
          </Link>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-600">Content Intelligence</span>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-600">Import Content</span>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-900 font-semibold">Raw Content Input</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Help"
          >
            <HelpCircle size={18} />
          </button>
          <div className="relative">
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white">
                1
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-7 h-7 rounded-full bg-pink-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              SA
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-800 leading-none">Super Admin</div>
              <div className="text-[10px] text-slate-400">Administrator</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Import Raw Content
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            Paste your content in any format. Our engine will analyze it and suggest the best content blocks.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onHowItWorksClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <Play size={15} className="text-slate-600 fill-slate-600" />
            <span>How it works</span>
          </button>

          <button
            type="button"
            onClick={onAnalyzeContent}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#f54a8d] hover:bg-[#e03d7c] text-white text-sm font-bold shadow-md shadow-pink-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze Content</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
