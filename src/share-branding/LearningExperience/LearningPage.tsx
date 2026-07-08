'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { LearningLayout } from './layout/LearningLayout';
import { HeroSection } from './components/HeroSection';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { pythonListsPart1 } from './content/python-lists-part-1';

interface LearningPageProps {
  brandColor: string;
  brandName: string;
}

/** Extract H2/H3 headings from markdown to build TOC */
function extractTocItems(content: string) {
  const lines = content.split('\n');
  const items: { id: string; text: string; level: number }[] = [];

  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    if (h2) {
      const text = h2[1].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      items.push({ id, text, level: 2 });
    } else if (h3) {
      const text = h3[1].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      items.push({ id, text, level: 3 });
    }
  }
  return items;
}

export function LearningPage({ brandColor, brandName }: LearningPageProps) {
  const lesson = pythonListsPart1;
  const tocItems = useMemo(() => extractTocItems(lesson.content), [lesson.content]);

  return (
    <LearningLayout tocItems={tocItems}>
      <article className="max-w-3xl mx-auto" aria-label="Lesson content">
        {/* Hero */}
        <HeroSection
          title={lesson.title}
          description={lesson.description}
          estimatedTime={lesson.estimatedTime}
          difficulty={lesson.difficulty as 'Beginner' | 'Intermediate' | 'Advanced'}
          prerequisites={lesson.prerequisites}
          brandColor={brandColor}
        />

        {/* Lesson content */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
        >
          <MarkdownRenderer content={lesson.content} />
        </motion.div>

        {/* Key Takeaways Card */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
          className="mt-14 rounded-2xl border border-border bg-muted/30 p-6"
          aria-label="Quick recap"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">Quick Recap ✦</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              'Lists are ordered, mutable, and dynamically sized collections.',
              'Python stores object references, not raw values, inside lists.',
              'Indexing starts at 0; negative indexing starts at -1 from the end.',
              'Nested lists allow building hierarchical data structures.',
              'Slicing: start is inclusive, stop is exclusive.',
            ].map((point) => (
              <li key={point} className="flex items-start gap-2">
                <span
                  className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: brandColor }}
                />
                {point}
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Prev / Next navigation */}
        <nav
          className="mt-10 flex items-center justify-between gap-4"
          aria-label="Lesson navigation"
        >
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            disabled
            aria-label="Previous lesson"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-transparent text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ background: brandColor }}
            aria-label="Next lesson"
          >
            Next: Lists — Part 2
            <ArrowRight className="w-4 h-4" />
          </button>
        </nav>
      </article>
    </LearningLayout>
  );
}
