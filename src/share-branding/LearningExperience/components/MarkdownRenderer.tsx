'use client';

import React, { useMemo } from 'react';
import { CodeBlock } from './CodeBlock';
import { Callout } from './Callout';

interface MarkdownRendererProps {
  content: string;
}

type Block =
  | { type: 'h2'; id: string; text: string }
  | { type: 'h3'; id: string; text: string }
  | { type: 'h4'; text: string }
  | { type: 'hr' }
  | { type: 'blockquote'; text: string }
  | { type: 'callout'; calloutType: 'tip' | 'interview' | 'warning' | 'info'; title: string; content: string }
  | { type: 'code'; lang: string; code: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'p'; text: string }
  | { type: 'blank' };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[*_`[\]()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Inline markdown → React nodes (bold, italic, inline code) */
function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Regex: inline code, bold, italic, links
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(<React.Fragment key={key++}>{text.slice(lastIndex, match.index)}</React.Fragment>);
    }
    const raw = match[0];
    if (raw.startsWith('`')) {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded-md text-[13px] font-mono bg-muted text-foreground border border-border">
          {raw.slice(1, -1)}
        </code>
      );
    } else if (raw.startsWith('**')) {
      parts.push(<strong key={key++} className="font-semibold text-foreground">{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith('*')) {
      parts.push(<em key={key++}>{raw.slice(1, -1)}</em>);
    } else if (match[2] && match[3]) {
      parts.push(<a key={key++} href={match[3]} className="text-primary underline underline-offset-2">{match[2]}</a>);
    }
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < text.length) {
    parts.push(<React.Fragment key={key++}>{text.slice(lastIndex)}</React.Fragment>);
  }
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank
    if (line.trim() === '') { blocks.push({ type: 'blank' }); i++; continue; }

    // HR
    if (/^---+$/.test(line.trim())) { blocks.push({ type: 'hr' }); i++; continue; }

    // Headings
    const h2 = line.match(/^## (.+)/);
    if (h2) { const t = h2[1].trim(); blocks.push({ type: 'h2', id: slugify(t), text: t }); i++; continue; }
    const h3 = line.match(/^### (.+)/);
    if (h3) { const t = h3[1].trim(); blocks.push({ type: 'h3', id: slugify(t), text: t }); i++; continue; }
    const h4 = line.match(/^#### (.+)/);
    if (h4) { blocks.push({ type: 'h4', text: h4[1].trim() }); i++; continue; }

    // Callout: :::callout-TYPE|TITLE|CONTENT:::
    const calloutLine = line.match(/^:::callout-(\w+)\|([^|]*)\|([\s\S]*):::$/);
    if (calloutLine) {
      blocks.push({
        type: 'callout',
        calloutType: calloutLine[1] as 'tip' | 'interview' | 'warning' | 'info',
        title: calloutLine[2],
        content: calloutLine[3],
      });
      i++; continue;
    }

    // <Callout> tag (multi-line not needed here, preprocessed to single line via preprocessContent)
    const calloutTag = line.match(/^<Callout\s+type="(\w+)"(?:\s+title="([^"]*)")?>([\s\S]*?)<\/Callout>$/);
    if (calloutTag) {
      blocks.push({
        type: 'callout',
        calloutType: calloutTag[1] as 'tip' | 'interview' | 'warning' | 'info',
        title: calloutTag[2] ?? '',
        content: calloutTag[3].trim(),
      });
      i++; continue;
    }

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing ```
      blocks.push({ type: 'code', lang, code: codeLines.join('\n') });
      continue;
    }

    // Table
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (r: string) =>
          r.split('|').map((c) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        const headers = parseRow(tableLines[0]);
        const rows = tableLines.slice(2).map(parseRow); // skip separator row
        blocks.push({ type: 'table', headers, rows });
      }
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const bqLines: string[] = [line.slice(1).trim()];
      i++;
      while (i < lines.length && lines[i].startsWith('>')) {
        bqLines.push(lines[i].slice(1).trim());
        i++;
      }
      blocks.push({ type: 'blockquote', text: bqLines.join(' ') });
      continue;
    }

    // Unordered list
    if (/^[*\-] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[*\-] /.test(lines[i])) {
        items.push(lines[i].replace(/^[*\-] /, '').trim());
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, '').trim());
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Paragraph (consume until blank line)
    const pLines: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('>') && !lines[i].startsWith('```') && !lines[i].startsWith('|') && !/^[*\-] /.test(lines[i]) && !/^\d+\. /.test(lines[i]) && !/^---+$/.test(lines[i].trim())) {
      pLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'p', text: pLines.join(' ') });
  }

  return blocks;
}

function preprocessContent(raw: string): string {
  // Replace multi-line <Callout> tags with single-line versions
  return raw.replace(
    /<Callout\s+type="(\w+)"(?:\s+title="([^"]*)")?>([\s\S]*?)<\/Callout>/g,
    (_, type, title, content) =>
      `<Callout type="${type}" title="${title ?? ''}">${content.trim().replace(/\n/g, ' ')}</Callout>`
  );
}

function renderBlock(block: Block, idx: number): React.ReactNode {
  switch (block.type) {
    case 'blank':
      return null;

    case 'hr':
      return <div key={idx} className="my-10 h-px bg-border" />;

    case 'h2':
      return (
        <h2
          key={idx}
          id={block.id}
          className="text-2xl font-bold tracking-tight text-foreground mt-12 mb-4 pb-2 border-b border-border scroll-mt-20"
        >
          {parseInline(block.text)}
        </h2>
      );

    case 'h3':
      return (
        <h3
          key={idx}
          id={block.id}
          className="text-lg font-semibold text-foreground mt-8 mb-3 scroll-mt-20"
        >
          {parseInline(block.text)}
        </h3>
      );

    case 'h4':
      return (
        <h4 key={idx} className="text-base font-semibold text-foreground mt-6 mb-2">
          {parseInline(block.text)}
        </h4>
      );

    case 'callout':
      return (
        <Callout key={idx} type={block.calloutType} title={block.title || undefined}>
          <span dangerouslySetInnerHTML={{ __html: block.content }} />
        </Callout>
      );

    case 'code':
      return <CodeBlock key={idx} code={block.code} language={block.lang} />;

    case 'blockquote':
      return (
        <blockquote
          key={idx}
          className="my-5 pl-4 border-l-4 border-primary/40 italic text-muted-foreground text-[15px] leading-7"
        >
          {parseInline(block.text)}
        </blockquote>
      );

    case 'table':
      return (
        <div key={idx} className="my-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {block.headers.map((h, hi) => (
                  <th
                    key={hi}
                    className="px-4 py-3 text-left font-semibold text-foreground text-xs uppercase tracking-wider border-b border-border"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-muted/30 transition-colors">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-4 py-3 text-foreground/80 border-b border-border/50"
                    >
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'ul':
      return (
        <ul key={idx} className="my-4 ml-1 space-y-1.5 list-none text-[15px] text-foreground/90">
          {block.items.map((item, ii) => (
            <li key={ii} className="flex gap-2 items-start leading-7">
              <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
              <span className="flex-1">{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );

    case 'ol':
      return (
        <ol key={idx} className="my-4 ml-5 space-y-1.5 list-decimal text-[15px] text-foreground/90">
          {block.items.map((item, ii) => (
            <li key={ii} className="leading-7 pl-1">
              {parseInline(item)}
            </li>
          ))}
        </ol>
      );

    case 'p':
      if (!block.text.trim()) return null;
      return (
        <p key={idx} className="text-[15px] leading-7 text-foreground/90 mb-4">
          {parseInline(block.text)}
        </p>
      );

    default:
      return null;
  }
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const blocks = useMemo(() => parseBlocks(preprocessContent(content)), [content]);

  return (
    <div className="max-w-none">
      {blocks.map((block, idx) => renderBlock(block, idx))}
    </div>
  );
}
