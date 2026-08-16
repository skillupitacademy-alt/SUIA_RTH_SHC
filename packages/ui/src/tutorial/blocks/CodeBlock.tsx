'use client';

import React, { useState } from 'react';
import type { ICodeBlock, BlockComponentProps } from '../types';

export function CodeBlock({ block, className = '' }: BlockComponentProps<ICodeBlock>) {
  const { language, code, filename, caption, showLineNumbers, highlightLines } = block.content;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Graceful fallback if clipboard API is not available
    }
  };

  const lines = code.split('\n');

  return (
    <figure
      id={block.id}
      className={`my-4 rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950 text-slate-100 shadow-sm ${className}`}
    >
      {(filename || language) && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
          <span>{filename || language}</span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
            className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      )}

      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code className={`language-${language}`} data-language={language}>
          {showLineNumbers ? (
            lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isHighlighted = highlightLines?.includes(lineNum);
              return (
                <div
                  key={idx}
                  className={`flex ${isHighlighted ? 'bg-slate-800/80 -mx-4 px-4 font-semibold' : ''}`}
                >
                  <span className="select-none text-slate-600 w-8 text-right pr-4 shrink-0">
                    {lineNum}
                  </span>
                  <span className="flex-1 whitespace-pre">{line}</span>
                </div>
              );
            })
          ) : (
            <span className="whitespace-pre">{code}</span>
          )}
        </code>
      </pre>

      {caption && (
        <figcaption className="px-4 py-2 bg-slate-900/50 border-t border-slate-800/60 text-xs text-slate-400 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
