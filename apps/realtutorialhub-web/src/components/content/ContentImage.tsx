'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

import type { ContentImage as ContentImageType } from '@quiz/types';

import { getSVGComponent } from '../illustrations';

interface ContentImageProps {
  image: ContentImageType;
  className?: string;
}

export function ContentImage({ image, className }: ContentImageProps) {
  const t = useTranslations('common');
  const isBottom = image.position === 'bottom';
  const width = image.width;
  const SVGComponent = image.type === 'svg_standard' ? getSVGComponent(image.svgKey ?? '') : null;

  return (
    <figure
      className={className}
      style={{
        margin: 0,
        width: isBottom ? '100%' : width,
        maxWidth: '100%',
        flexShrink: 0,
      }}
    >
      {image.type === 'svg_standard' && SVGComponent ? (
        <SVGComponent width={width} />
      ) : image.type === 'svg_standard' ? (
        <div
          style={{
            width: '100%',
            minHeight: 120,
            borderRadius: 12,
            border: '1px dashed var(--tutorial-border)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--block-text-secondary)',
            background: 'var(--tutorial-surface-soft)',
          }}
        >
          {t('illustrationPending')}
        </div>
      ) : (
        <Image
          src={image.url ?? ''}
          alt={image.alt}
          width={width}
          height={width}
          sizes={`${width}px`}
          unoptimized
          style={{ width: '100%', height: 'auto', borderRadius: 12 }}
        />
      )}
      {image.caption ? (
        <figcaption
          style={{
            marginTop: 8,
            fontSize: 12,
            color: 'var(--block-text-secondary)',
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          {image.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
