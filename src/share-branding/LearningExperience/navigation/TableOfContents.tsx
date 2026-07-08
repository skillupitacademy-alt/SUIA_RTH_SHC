'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../ui/utils';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const headingElements = items.map(({ id }) => document.getElementById(id)).filter(Boolean);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -70% 0%', threshold: 0 }
    );

    headingElements.forEach((el) => {
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [items]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="hidden xl:block w-56 shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto py-5 pl-2 pr-4">
      <p className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-4">
        On This Page
      </p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => handleClick(item.id)}
              className={cn(
                'block w-full text-left py-1 text-sm transition-colors hover:text-foreground',
                item.level === 3 ? 'pl-4' : 'pl-0',
                activeId === item.id
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              )}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
