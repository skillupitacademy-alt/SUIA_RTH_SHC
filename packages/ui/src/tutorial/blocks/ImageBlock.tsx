import React from 'react';
import type { IImageBlock, BlockComponentProps } from '../types';

export function ImageBlock({ block, className = '' }: BlockComponentProps<IImageBlock>) {
  const { assetId, alt, caption, aspectRatio } = block.content;

  // Safe asset resolution: If assetId is already a valid URL/path or storage key
  const isUrl = assetId.startsWith('http://') || assetId.startsWith('https://') || assetId.startsWith('/');
  const imageSrc = isUrl ? assetId : `/api/assets/${encodeURIComponent(assetId)}`;

  return (
    <figure
      id={block.id}
      className={`my-4 flex flex-col items-center justify-center ${className}`}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm"
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <img
          src={imageSrc}
          alt={alt || 'Tutorial illustration'}
          loading="lazy"
          className="w-full h-auto object-contain mx-auto"
          onError={(e) => {
            // Graceful fallback for broken or non-resolved asset references
            const target = e.currentTarget;
            target.style.display = 'none';
            if (target.parentElement) {
              const fallback = document.createElement('div');
              fallback.className = 'p-6 text-center text-xs text-slate-400 font-mono';
              fallback.innerText = `[Image Asset: ${assetId}] - ${alt}`;
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
