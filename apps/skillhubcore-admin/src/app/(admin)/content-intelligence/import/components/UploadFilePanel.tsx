'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, File, X, AlertCircle } from 'lucide-react';

interface UploadFilePanelProps {
  onFileContentParsed: (content: string, filename: string) => void;
}

export function UploadFilePanel({ onFileContentParsed }: UploadFilePanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    const validExtensions = ['.md', '.txt', '.html', '.htm', '.docx', '.pdf'];
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(extension)) {
      setErrorMessage(`Unsupported format '${extension}'. Please upload .txt, .md, or .html files.`);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 20MB limit.');
      return;
    }

    setSelectedFile(file);

    // Text & Markdown & HTML reading in browser
    if (['.md', '.txt', '.html', '.htm'].includes(extension)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          onFileContentParsed(text, file.name);
        }
      };
      reader.onerror = () => {
        setErrorMessage('Failed to read file content.');
      };
      reader.readAsText(file);
    } else {
      // For .docx or .pdf, inform the user that binary AST parsing is deferred
      setErrorMessage(`Binary document (${extension}) selected. Note: Server-side canonical parsing for binary files is deferred. Please paste text, Markdown, or HTML for immediate conversion.`);
      onFileContentParsed(`# Imported Document: ${file.name}\n\n[Binary content from ${file.name} - server parser deferred]`, file.name);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 mb-4">Upload File</h3>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-pink-500 bg-pink-50/50'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt,.html,.docx,.pdf"
          onChange={handleChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mb-3">
          <UploadCloud size={24} />
        </div>

        <p className="text-sm font-bold text-slate-800">
          Click to upload <span className="font-normal text-slate-500">or drag and drop</span>
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Supports .md, .txt, .html, .docx, .pdf (Max: 20MB)
        </p>
      </div>

      {selectedFile && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <File size={18} className="text-pink-600 shrink-0" />
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</div>
              <div className="text-[10px] text-slate-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
            }}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-amber-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
