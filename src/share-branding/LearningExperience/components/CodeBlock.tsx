'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '../../ui/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

// Minimal but effective keyword-based token highlighter (no external dep needed)
function tokenize(code: string, language: string): React.ReactNode[] {
  if (language !== 'python') {
    return [<span key="raw" className="text-slate-300">{code}</span>];
  }

  const keywords = /\b(def|class|return|import|from|if|elif|else|for|while|in|not|and|or|is|True|False|None|pass|break|continue|lambda|with|as|try|except|finally|raise|yield|del|global|nonlocal|assert|print)\b/g;
  const strings = /("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')/g;
  const comments = /(#.*)/g;
  const numbers = /\b(\d+\.?\d*)\b/g;
  const builtins = /\b(len|range|list|tuple|dict|set|str|int|float|bool|type|isinstance|print|input|open|zip|map|filter|enumerate|sorted|reversed|min|max|sum|abs|round)\b/g;

  // Simple multi-pass tokenizer: split by color groups
  const parts: { text: string; type: string }[] = [];
  let lastIndex = 0;

  const allMatches: { start: number; end: number; text: string; type: string }[] = [];

  const addMatches = (regex: RegExp, type: string) => {
    let match;
    const re = new RegExp(regex.source, 'g');
    while ((match = re.exec(code)) !== null) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, text: match[0], type });
    }
  };

  addMatches(strings, 'string');
  addMatches(comments, 'comment');
  addMatches(keywords, 'keyword');
  addMatches(builtins, 'builtin');
  addMatches(numbers, 'number');

  // Sort & dedupe (non-overlapping, first-come wins)
  allMatches.sort((a, b) => a.start - b.start);
  const filtered: typeof allMatches = [];
  let cursor = 0;
  for (const m of allMatches) {
    if (m.start >= cursor) {
      filtered.push(m);
      cursor = m.end;
    }
  }

  const nodes: React.ReactNode[] = [];
  let pos = 0;
  filtered.forEach((m, i) => {
    if (m.start > pos) {
      nodes.push(<span key={`plain-${i}`} className="text-slate-300">{code.slice(pos, m.start)}</span>);
    }
    const colorMap: Record<string, string> = {
      keyword: 'text-violet-400',
      string: 'text-emerald-400',
      comment: 'text-slate-500 italic',
      builtin: 'text-sky-400',
      number: 'text-orange-400',
    };
    nodes.push(<span key={`tok-${i}`} className={colorMap[m.type] ?? 'text-slate-300'}>{m.text}</span>);
    pos = m.end;
  });
  if (pos < code.length) {
    nodes.push(<span key="tail" className="text-slate-300">{code.slice(pos)}</span>);
  }
  return nodes;
}

export function CodeBlock({ code, language = 'python', className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const lines = code.split('\n');

  return (
    <div className={cn('my-5 rounded-xl overflow-hidden border border-border shadow-sm group', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e2e] border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="ml-2 text-xs text-slate-500 font-mono">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copy code"
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <pre className="bg-[#1a1b2e] overflow-x-auto">
        <code className="text-sm font-mono leading-6 flex flex-col">
          {lines.map((line, i) => (
            <span key={i} className="flex">
              <span className="select-none w-10 shrink-0 text-right pr-4 text-slate-600 text-xs pt-0.5">
                {i + 1}
              </span>
              <span className="flex-1 pr-4">
                {tokenize(line, language)}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
