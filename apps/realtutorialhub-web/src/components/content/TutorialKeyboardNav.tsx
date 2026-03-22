"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ContentBlockType } from '@quiz/types';

interface TutorialKeyboardNavProps {
  mode: 'compare' | 'detail' | 'learn';
  blockType?: ContentBlockType;
  blockOrder: ContentBlockType[];
  params: {
    domainSlug: string;
    subjectSlug: string;
    topicSlug: string;
    subtopicSlug: string;
  };
}

export function TutorialKeyboardNav({ mode, blockType, blockOrder, params }: TutorialKeyboardNavProps) {
  const router = useRouter();

  useEffect(() => {
    if (mode !== 'detail' || !blockType) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifiers and inputs
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const currentIndex = blockOrder.indexOf(blockType);
        if (currentIndex === -1) return;
        
        if (e.key === 'ArrowRight' && currentIndex < blockOrder.length - 1) {
          e.preventDefault();
          const nextBlock = blockOrder[currentIndex + 1];
          router.push(`/learn/${params.domainSlug}/${params.subjectSlug}/${params.topicSlug}/${params.subtopicSlug}/${nextBlock}`);
        } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
          e.preventDefault();
          const prevBlock = blockOrder[currentIndex - 1];
          router.push(`/learn/${params.domainSlug}/${params.subjectSlug}/${params.topicSlug}/${params.subtopicSlug}/${prevBlock}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, blockType, params, router, blockOrder]);

  return null;
}
