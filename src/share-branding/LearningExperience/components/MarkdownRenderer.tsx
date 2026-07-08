'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';
import { Callout } from './Callout';

interface MarkdownRendererProps {
  content: string;
}

// Pre-process content to replace custom <Callout> tags with a custom marker
// so ReactMarkdown can pass them through as HTML (we handle via rehype-raw style)
function preprocessContent(raw: string): string {
  // Replace <Callout type="..." title="...">...</Callout> with placeholder marker
  return raw.replace(
    /<Callout\s+type="(\w+)"(?:\s+title="([^"]*)")?>([\s\S]*?)<\/Callout>/g,
    (_, type, title, content) => {
      const safeContent = content.trim().replace(/\n/g, ' ');
      return `\n\n:::callout-${type}|${title ?? ''}|${safeContent}:::\n\n`;
    }
  );
}

function parseCalloutMarker(line: string) {
  const match = line.match(/^:::callout-(\w+)\|([^|]*)\|([\s\S]*):::$/);
  if (!match) return null;
  return { type: match[1] as 'tip' | 'interview' | 'warning' | 'info', title: match[2] || undefined, content: match[3] };
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const processed = useMemo(() => preprocessContent(content), [content]);

  return (
    <div className="max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings with anchor IDs
          h2: ({ children }) => {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return (
              <h2
                id={id}
                className="text-2xl font-bold tracking-tight text-foreground mt-12 mb-4 pb-2 border-b border-border scroll-mt-20"
              >
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return (
              <h3 id={id} className="text-lg font-semibold text-foreground mt-8 mb-3 scroll-mt-20">
                {children}
              </h3>
            );
          },
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-foreground mt-6 mb-2">{children}</h4>
          ),

          // Paragraph — intercept callout markers
          p: ({ children }) => {
            const text = String(children);
            const callout = parseCalloutMarker(text.trim());
            if (callout) {
              return (
                <Callout type={callout.type} title={callout.title}>
                  <p dangerouslySetInnerHTML={{ __html: callout.content }} />
                </Callout>
              );
            }
            return <p className="text-[15px] leading-7 text-foreground/90 mb-4">{children}</p>;
          },

          // Code blocks
          code: ({ inline, className, children }: { inline?: boolean; className?: string; children?: React.ReactNode }) => {
            const match = /language-(\w+)/.exec(className ?? '');
            const lang = match ? match[1] : 'text';
            const code = String(children).replace(/\n$/, '');

            if (!inline) {
              return <CodeBlock code={code} language={lang} />;
            }
            return (
              <code className="px-1.5 py-0.5 rounded-md text-[13px] font-mono bg-muted text-foreground border border-border">
                {children}
              </code>
            );
          },

          // Horizontal rule
          hr: () => <div className="my-10 h-px bg-border" />,

          // Blockquote — use as info callout
          blockquote: ({ children }) => (
            <blockquote className="my-5 pl-4 border-l-4 border-primary/40 italic text-muted-foreground text-[15px] leading-7">
              {children}
            </blockquote>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="my-4 ml-1 space-y-1.5 list-none text-[15px] text-foreground/90">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-4 ml-5 space-y-1.5 list-decimal text-[15px] text-foreground/90">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex gap-2 items-start leading-7">
              <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
              <span className="flex-1">{children}</span>
            </li>
          ),

          // Strong/bold
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),

          // Tables
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left font-semibold text-foreground text-xs uppercase tracking-wider border-b border-border">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-foreground/80 border-b border-border/50 last:border-0">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
          ),
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
