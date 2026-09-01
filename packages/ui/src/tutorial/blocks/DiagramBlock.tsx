import React from 'react';
import type { IDiagramBlock, BlockComponentProps } from '../types';

export function DiagramBlock({ block, className = '' }: BlockComponentProps<IDiagramBlock>) {
  const { diagramType, diagramData, caption, alt } = block.content;

  if (diagramType === 'svg') {
    return (
      <figure
        id={block.id}
        data-block-id={block.id}
        data-block-type="diagram"
        className={`my-4 flex flex-col items-center justify-center ${className}`}
      >
        <div
          role="img"
          aria-label={alt || 'Tutorial diagram (SVG)'}
          className="w-full max-w-2xl overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 shadow-sm"
        >
          <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 dark:text-slate-300">
            <code>{diagramData}</code>
          </pre>
        </div>

        {caption && (
          <figcaption className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (diagramType === 'mermaid') {
    return (
      <figure
        id={block.id}
        data-block-id={block.id}
        data-block-type="diagram"
        className={`my-4 flex flex-col items-center justify-center ${className}`}
      >
        <div className="w-full max-w-2xl overflow-x-auto rounded-lg border border-slate-700/60 bg-slate-950 p-4 shadow-sm">
          <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider mb-1">
            Mermaid Diagram Source
          </div>
          <pre className="mermaid-source font-mono text-xs text-slate-200">
            <code>{diagramData}</code>
          </pre>
        </div>

        {caption && (
          <figcaption className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // Asset type
  const isUrl = diagramData.startsWith('http://') || diagramData.startsWith('https://') || diagramData.startsWith('/');
  const imageSrc = isUrl ? diagramData : `/api/assets/${encodeURIComponent(diagramData)}`;

  return (
    <figure
      id={block.id}
      data-block-id={block.id}
      data-block-type="diagram"
      className={`my-4 flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm">
        <img
          src={imageSrc}
          alt={alt || 'Tutorial diagram'}
          loading="lazy"
          className="w-full h-auto object-contain mx-auto"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            if (target.parentElement) {
              const fallback = document.createElement('div');
              fallback.className = 'p-6 text-center text-xs text-slate-400 font-mono';
              fallback.innerText = `[Diagram Asset: ${diagramData}] - ${alt || 'Diagram'}`;
              target.parentElement.appendChild(fallback);
            }
          }}
        />
      </div>

      {caption && (
        <figcaption className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
