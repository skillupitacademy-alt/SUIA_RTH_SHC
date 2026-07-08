'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, BarChart2, Zap, ChevronRight } from 'lucide-react';
import { cn } from '../../ui/utils';

interface HeroSectionProps {
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  prerequisites: string[];
  brandColor: string;
}

const difficultyConfig = {
  Beginner: { label: 'Beginner', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  Intermediate: { label: 'Intermediate', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  Advanced: { label: 'Advanced', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
};

export function HeroSection({
  title,
  description,
  estimatedTime,
  difficulty,
  prerequisites,
  brandColor,
}: HeroSectionProps) {
  const diff = difficultyConfig[difficulty];

  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mb-10"
    >
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
        <span>Learning Path</span>
        <ChevronRight className="w-3 h-3" />
        <span>Python</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Lists — Part 1</span>
      </nav>

      {/* Meta badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
            diff.color
          )}
        >
          <BarChart2 className="w-3 h-3" />
          {diff.label}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-muted text-muted-foreground">
          <Clock className="w-3 h-3" />
          {estimatedTime}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3 leading-tight">
        {title}
      </h1>

      {/* Description */}
      <p className="text-base text-muted-foreground max-w-2xl leading-relaxed mb-6">
        {description}
      </p>

      {/* Prerequisites */}
      {prerequisites.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Zap className="w-3 h-3" />
            Prerequisites:
          </span>
          {prerequisites.map((pre) => (
            <span
              key={pre}
              className="px-2.5 py-1 rounded-md text-xs bg-muted text-muted-foreground border border-border"
            >
              {pre}
            </span>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="mt-8 h-px bg-border" />
    </motion.header>
  );
}
