'use client';

import React, { useRef } from 'react';
import {
  Bold,
  Italic,
  Code,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo2,
  Redo2,
  Trash2,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

interface PasteContentEditorProps {
  content: string;
  onChange: (value: string) => void;
  wordCount: number;
  charCount: number;
  lastSavedText?: string;
  onClear: () => void;
}

export function PasteContentEditor({
  content,
  onChange,
  wordCount,
  charCount,
  lastSavedText = 'Auto-saved 2 seconds ago',
  onClear,
}: PasteContentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to insert formatting at cursor position
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    onChange(newContent);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText.length || 4)
      );
    }, 0);
  };

  const handleHeadingSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val || val === 'normal') return;
    insertFormatting(`${val} `);
    e.target.value = 'normal';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Editor Header / Title */}
      <div className="px-5 pt-4 pb-2 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">
          Paste or Type Your Content
        </h3>
      </div>

      {/* Editor Toolbar */}
      <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-slate-700">
        <div className="flex flex-wrap items-center gap-1">
          {/* Format Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              aria-label="Text format"
              defaultValue="normal"
              onChange={handleHeadingSelect}
              className="appearance-none bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 py-1.5 pl-2.5 pr-7 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
            >
              <option value="normal">Normal</option>
              <option value="# ">Heading 1</option>
              <option value="## ">Heading 2</option>
              <option value="### ">Heading 3</option>
              <option value="#### ">Heading 4</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 pointer-events-none text-slate-400" />
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Formatting Buttons */}
          <button
            type="button"
            onClick={() => insertFormatting('**', '**')}
            title="Bold (**text**)"
            className="p-1.5 rounded hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <Bold size={15} />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('*', '*')}
            title="Italic (*text*)"
            className="p-1.5 rounded hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <Italic size={15} />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('```javascript\n', '\n```')}
            title="Code Block (```)"
            className="p-1.5 rounded hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 transition-colors font-mono text-xs"
          >
            <Code size={15} />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('- ')}
            title="Bullet List (- item)"
            className="p-1.5 rounded hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <List size={15} />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('1. ')}
            title="Numbered List (1. item)"
            className="p-1.5 rounded hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ListOrdered size={15} />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('> ')}
            title="Blockquote (> text)"
            className="p-1.5 rounded hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <Quote size={15} />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('[', '](https://)')}
            title="Link"
            className="p-1.5 rounded hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <Link2 size={15} />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          <button
            type="button"
            onClick={() => document.execCommand('undo')}
            title="Undo"
            className="p-1.5 rounded hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Undo2 size={14} />
          </button>

          <button
            type="button"
            onClick={() => document.execCommand('redo')}
            title="Redo"
            className="p-1.5 rounded hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Clear Button */}
        <button
          type="button"
          onClick={onClear}
          title="Clear content"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 px-2 py-1 rounded hover:bg-rose-50 transition-colors"
        >
          <Trash2 size={13} />
          <span>Clear</span>
        </button>
      </div>

      {/* Editor Main Content Textarea */}
      <div className="p-4 flex-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste or write your educational content here..."
          rows={16}
          className="w-full h-full min-h-[380px] p-2 bg-transparent text-slate-800 font-mono text-sm leading-relaxed border-none focus:outline-none resize-y custom-scrollbar"
        />
      </div>

      {/* Live Stats & Auto-save Status Bar */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4 font-medium">
          <span>Words: <strong className="text-slate-800">{wordCount.toLocaleString()}</strong></span>
          <span>Characters: <strong className="text-slate-800">{charCount.toLocaleString()}</strong></span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span>{lastSavedText}</span>
        </div>
      </div>
    </div>
  );
}
