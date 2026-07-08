'use client';

import React from 'react';
import { BookOpen, Code, CheckCircle2 } from 'lucide-react';
import { cn } from '../../ui/utils';

interface SidebarItem {
  id: string;
  title: string;
  isCompleted?: boolean;
  isActive?: boolean;
  type: 'lesson' | 'exercise' | 'quiz';
}

const curriculum: SidebarItem[] = [
  { id: 'python-lists-part-1', title: 'Python Lists — Part 1', isActive: true, type: 'lesson' },
  { id: 'python-lists-part-2', title: 'Python Lists — Part 2', type: 'lesson' },
  { id: 'python-tuples', title: 'Python Tuples', type: 'lesson' },
  { id: 'python-dictionaries', title: 'Python Dictionaries', type: 'lesson' },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:block w-72 border-r border-border bg-background/60 backdrop-blur-sm h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto shrink-0">
      <div className="p-5">
        <p className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-4 px-1">
          Course Curriculum
        </p>
        <div className="space-y-0.5">
          {curriculum.map((item, index) => (
            <button
              key={item.id}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all text-left group',
                item.isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full border text-[11px] font-semibold transition-colors',
                  item.isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : item.isCompleted
                      ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'border-border text-muted-foreground'
                )}
              >
                {item.isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : index + 1}
              </div>
              <span className="flex-1 truncate leading-tight">{item.title}</span>
              {item.type === 'lesson' && (
                <BookOpen className="w-3.5 h-3.5 opacity-40 shrink-0" />
              )}
              {item.type === 'exercise' && (
                <Code className="w-3.5 h-3.5 opacity-40 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
