import React from 'react';
import type { DomainTheme, TutorialBlockRuntimeContext } from '../types';

export interface BlockShellProps extends React.HTMLAttributes<HTMLElement> {
  blockId?: string;
  blockType?: string;
  blockVersion?: string;
  runtimeContext?: TutorialBlockRuntimeContext;
  theme?: DomainTheme;
  children: React.ReactNode;
  className?: string;
  as?: 'article' | 'section' | 'div';
}

/**
 * Universal Block Shell - Generic UBA Container Primitive
 * 
 * Enforces:
 * 1. UBRC DOM identity attributes (data-block-id, data-block-type, data-block-version)
 * 2. Canonical outer padding: w-full px-[5%] py-8 sm:py-10
 * 3. Smooth dark-mode & responsive container support
 */
export function BlockShell({
  blockId,
  blockType,
  blockVersion,
  runtimeContext,
  children,
  className = '',
  style,
  as: Component = 'article',
  ...rest
}: BlockShellProps) {
  const effectiveBlockId = runtimeContext?.blockId ?? blockId ?? 'unknown-block';
  const effectiveBlockType = runtimeContext?.blockType ?? blockType ?? 'generic';
  const effectiveBlockVersion = runtimeContext?.blockVersion ?? blockVersion ?? '1.0';

  const combinedClass = [
    'w-full bg-white dark:bg-slate-900 px-[5%] py-8 sm:py-10 transition-colors',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component
      data-block-id={effectiveBlockId}
      data-block-type={effectiveBlockType}
      data-block-version={effectiveBlockVersion}
      className={combinedClass}
      style={style}
      {...rest}
    >
      {children}
    </Component>
  );
}
