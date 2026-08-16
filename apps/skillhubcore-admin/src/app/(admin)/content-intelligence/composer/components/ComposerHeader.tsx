'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Settings, Eye, Save, Send, Sparkles } from 'lucide-react';

interface ComposerHeaderProps {
  status?: string;
  isSaving?: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onPreview: () => void;
  onOpenSettings?: () => void;
  backHref?: string;
}

export function ComposerHeader({
  status = 'DRAFT',
  isSaving = false,
  onSaveDraft,
  onPublish,
  onPreview,
  onOpenSettings,
  backHref = '/content-intelligence/review-approve',
}: ComposerHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200">
      <div>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 font-medium">
          <Link href="/dashboard" className="hover:text-slate-800 transition-colors">
            Dashboard
          </Link>
          <ChevronRight size={13} className="text-slate-400" />
          <Link href={backHref} className="hover:text-slate-800 transition-colors">
            Tutorial Content
          </Link>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-900 font-semibold">Composer</span>
        </nav>

        {/* Title + Status Badge */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tutorial Content Composer
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-pink-50 text-[#f54a8d] border border-pink-200">
            {status}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Build rich learning content using reusable components and approved presentation layouts
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
        <button
          onClick={onOpenSettings}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Settings size={14} className="text-slate-500" />
          <span>Composer Settings</span>
        </button>

        <button
          onClick={onPreview}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Eye size={14} className="text-slate-500" />
          <span>Preview</span>
        </button>

        <button
          onClick={onSaveDraft}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <Save size={14} className="text-slate-500" />
          <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
        </button>

        <button
          onClick={onPublish}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#f54a8d] hover:bg-[#e03a7a] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <span>Publish Tutorial</span>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
