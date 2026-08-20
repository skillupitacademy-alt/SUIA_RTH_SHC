'use client';

import React, { useState } from 'react';
import type { CodeC1Block as ICodeC1Block } from '@quiz/types';
import type { BlockComponentProps } from '../types';

/**
 * Code C1 Block Renderer
 * Phase 2D: UI/Renderer Implementation
 * 
 * Renders Code C1 "Basic Syntax" educational content.
 * 
 * SECURITY: All content rendered as React text (never executed)
 * FROZEN CONTRACT: Consumes Phase 2A/2B/2C canonical structure
 */
export function CodeC1Block({ 
  block, 
  className = '' 
}: BlockComponentProps<ICodeC1Block>) {
  const { page } = block.content;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(page.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Graceful fallback if clipboard API unavailable
    }
  };

  return (
    <article
      id={block.id}
      className={`my-6 p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 shadow-sm ${className}`}
      data-block-type="code"
      data-block-version="C1"
    >
      {/* Title */}
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
        <span className="text-indigo-500 text-lg">💻</span>
        <span>{page.title}</span>
      </h3>

      {/* Introduction */}
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
        {page.introduction}
      </p>

      {/* Code Panel */}
      <figure className="my-4 rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950 text-slate-100 shadow-sm">
        {/* Code Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
          <span>{page.filename || page.language}</span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
            className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        {/* Code Content - SECURITY: Rendered as text, never executed */}
        <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
          <code className={`language-${page.language}`} data-language={page.language}>
            {page.code}
          </code>
        </pre>
      </figure>

      {/* Explanation Section */}
      {page.explanation && page.explanation.length > 0 && (
        <div className="my-5 space-y-4">
          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <span>📝</span>
            <span>How It Works</span>
          </div>
          {page.explanation.map((item, index) => (
            <div 
              key={index}
              className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-900"
            >
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                {item.focus}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Output Section - Optional */}
      {page.output && (
        <div className="my-5 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span>▶</span>
            <span>Output</span>
          </div>
          <pre className="text-sm font-mono text-emerald-900 dark:text-emerald-100 whitespace-pre-wrap break-words">
            {page.output.value}
          </pre>
          {page.output.description && (
            <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
              {page.output.description}
            </p>
          )}
        </div>
      )}

      {/* Takeaway */}
      {page.takeaway && (
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">💡</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              Key Takeaway
            </span>
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
            {page.takeaway}
          </p>
        </div>
      )}

      {/* Practice Hint - Optional */}
      {page.practiceHint && (
        <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 dark:text-amber-400 text-sm shrink-0">💪</span>
            <div className="flex-1">
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
                Practice
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                {page.practiceHint}
              </p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
