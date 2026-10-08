/**
 * Tutorial Editor Panel Component
 * 
 * Visual authoring surface for block content.
 * Displays JSON/Markdown editor with action buttons and status messages.
 * 
 * Parent owns:
 * - Content parsing/validation
 * - C1 conversion logic
 * - API calls
 * - Block instance creation
 * - Save/publish operations
 */

import { Plus, Eye, Save, Send, Sparkles, FileCode } from 'lucide-react';

interface TutorialEditorPanelProps {
  // Editor state
  sourceContent: string;
  versionCode: string;
  isEditingExisting: boolean;
  
  // Actions
  onContentChange: (content: string) => void;
  onAddBlock: () => void;
  onStartNewBlock: () => void;
  onPreviewBlock: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  
  // Status
  message: string;
  memoryModelWarning: string;
  isSaving: boolean;
  isLoadingDocument: boolean;
  canSave: boolean;
}

export function TutorialEditorPanel({
  sourceContent,
  versionCode,
  isEditingExisting,
  onContentChange,
  onAddBlock,
  onStartNewBlock,
  onPreviewBlock,
  onSaveDraft,
  onPublish,
  message,
  memoryModelWarning,
  isSaving,
  isLoadingDocument,
  canSave,
}: TutorialEditorPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-5 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
      <div className="flex items-center justify-between pb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
        <span className="flex items-center gap-1.5">
          <FileCode size={14} className="text-pink-600" />
          <span>Block Content Editor</span>
          <span className="text-[10px] text-slate-400 font-mono">({versionCode})</span>
        </span>
        <span className="text-[10px] text-pink-600 font-mono font-semibold">Pure Block Schema</span>
      </div>
      
      <textarea
        className="h-[400px] w-full rounded-xl border border-slate-800 bg-[#071024] p-4 font-mono text-xs leading-5 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-y"
        value={sourceContent}
        onChange={(event) => onContentChange(event.target.value)}
        placeholder="Paste or edit JSON content here..."
        aria-label="JSON Content Editor"
      />

      {/* Main Action Buttons */}
      <div className="mt-4 space-y-2.5">
        {/* Editing Mode Indicator */}
        {isEditingExisting && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
            <span className="text-xs font-bold text-blue-700">✏️ Editing existing block</span>
            <button
              type="button"
              onClick={onStartNewBlock}
              className="ml-auto text-xs font-bold text-blue-600 hover:text-blue-800 underline"
            >
              Start New Block Instead
            </button>
          </div>
        )}
        
        {/* Primary Add/Update Block Action */}
        <button
          type="button"
          onClick={onAddBlock}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-pink-500/25 hover:scale-[1.01] active:scale-95 transition-all"
        >
          <Plus size={16} />
          <span>
            {isEditingExisting 
              ? `✓ Update Block in Document (${versionCode})`
              : `+ Add ${versionCode} Block Instance to Document`
            }
          </span>
        </button>

        {/* Secondary Actions Row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
            onClick={onPreviewBlock}
          >
            <Eye className="h-3.5 w-3.5" /> Preview Block
          </button>
          <button
            type="button"
            disabled={isSaving || isLoadingDocument || !canSave}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onSaveDraft}
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
          <button
            type="button"
            disabled={isSaving || isLoadingDocument || !canSave}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#e11d48] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#be123c] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onPublish}
          >
            <Send className="h-3.5 w-3.5" /> Publish
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-3 rounded-lg bg-pink-50/70 border border-pink-100 p-3 text-xs font-semibold text-[#071f63] flex items-center gap-2">
          <Sparkles size={14} className="text-pink-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {memoryModelWarning && (
        <div className="mt-3 rounded-lg bg-orange-50/70 border border-orange-200 p-3 text-xs font-semibold text-orange-900 flex items-start gap-2">
          <span className="text-orange-600 shrink-0 mt-0.5">⚠️</span>
          <div>
            <div className="font-bold mb-1">Memory Model Data Will Be Lost</div>
            <div className="font-normal text-orange-800">{memoryModelWarning}</div>
          </div>
        </div>
      )}
    </div>
  );
}
