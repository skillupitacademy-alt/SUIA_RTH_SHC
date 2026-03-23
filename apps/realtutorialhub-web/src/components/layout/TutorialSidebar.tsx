'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import type { DomainTheme } from '@/lib/domain-themes';

type SidebarItemStatus = 'completed' | 'active' | 'in_progress' | 'locked' | 'not_started';

interface TutorialSidebarProps {
  currentDomain: {
    name: string;
    topics: Array<{ name: string; status: SidebarItemStatus; slug: string }>;
  };
  topicGroups: Array<{
    name: string;
    defaultExpanded: boolean;
    items: Array<{ name: string; status: SidebarItemStatus; slug: string }>;
  }>;
  notes: Array<{ term: string; detail: string }>;
  theme: DomainTheme;
  activeSubtopicSlug: string;
}

const statusStyles: Record<SidebarItemStatus, { color: string; label: string }> = {
  completed: { color: '#43a047', label: '✓' },
  active: { color: 'var(--sidebar-accent)', label: '●' },
  in_progress: { color: '#f57c00', label: '◐' },
  locked: { color: '#bdbdbd', label: '🔒' },
  not_started: { color: '#bdbdbd', label: '○' },
};

export function TutorialSidebar({ currentDomain, topicGroups, notes, theme, activeSubtopicSlug }: TutorialSidebarProps) {
  const t = useTranslations('sidebar');
  const [expanded, setExpanded] = useState(() => topicGroups.map((group) => group.defaultExpanded));
  const visibleNotes = useMemo(() => notes.slice(0, 6), [notes]);

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        background: 'var(--tutorial-surface)',
        borderRight: '1px solid var(--tutorial-border)',
        padding: '16px 0',
        position: 'sticky',
        top: 98,
        height: 'calc(100vh - 98px)',
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '0 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--block-text-primary)', marginBottom: 8 }}>
          {currentDomain.name}
        </div>
        <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          {currentDomain.topics.map((topic) => {
            const status = statusStyles[topic.status];
            const active = topic.slug === activeSubtopicSlug;

            return (
              <div
                key={topic.slug}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 8,
                  background: active ? `${theme.sidebarAccent}18` : 'transparent',
                  color: active ? theme.sidebarAccent : topic.status === 'completed' ? '#4a5568' : 'var(--block-text-secondary)',
                  fontWeight: active ? 700 : 600,
                  fontSize: 12.5,
                }}
              >
                <span aria-hidden="true" style={{ color: status.color, minWidth: 14, textAlign: 'center' }}>
                  {status.label}
                </span>
                <span>{topic.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 12px' }}>
        {topicGroups.map((group, index) => {
          const isOpen = expanded[index];
          return (
            <div
              key={group.name}
              style={{
                borderTop: index > 0 ? '1px solid var(--tutorial-muted-border)' : 'none',
                paddingTop: index > 0 ? 10 : 0,
                marginTop: index > 0 ? 10 : 0,
              }}
            >
              <button
                type="button"
                onClick={() => setExpanded((prev) => prev.map((item, idx) => (idx === index ? !item : item)))}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  padding: '4px 2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: 'var(--block-text-primary)',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <span>{group.name}</span>
                <span aria-hidden="true">{isOpen ? '∨' : '›'}</span>
              </button>
              {isOpen ? (
                <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                  {group.items.map((item) => {
                    const status = statusStyles[item.status];
                    const active = item.slug === activeSubtopicSlug;
                    return (
                      <div
                        key={item.slug}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 8px',
                          borderRadius: 8,
                          background: active ? `${theme.sidebarAccent}18` : 'transparent',
                          color: active ? theme.sidebarAccent : item.status === 'completed' ? '#4a5568' : 'var(--block-text-secondary)',
                          fontWeight: active ? 700 : 600,
                          fontSize: 12.5,
                        }}
                      >
                        <span aria-hidden="true" style={{ color: status.color, minWidth: 14, textAlign: 'center' }}>
                          {status.label}
                        </span>
                        <span>{item.name}</span>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '14px 12px 8px' }}>
        {['i', 'c', 'b', 't'].map((icon) => (
          <button
            key={icon}
            type="button"
            aria-label={icon}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid var(--tutorial-border)',
              background: 'var(--tutorial-surface-soft)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              cursor: 'pointer',
            }}
          >
            {icon}
          </button>
        ))}
      </div>

      <div
        style={{
          margin: '8px 12px',
          padding: '12px 14px',
          background: '#fffde7',
          borderRadius: 10,
          border: '1px solid #ffe082',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 12.5, color: '#5d4037', marginBottom: 8 }}>{t('notes')}</div>
        <div style={{ display: 'grid', gap: 8, maxHeight: 180, overflow: 'hidden' }}>
          {visibleNotes.map((note) => (
            <div key={note.term} style={{ fontSize: 11.5, lineHeight: 1.55, color: '#5d4037' }}>
              <strong style={{ color: '#e65100' }}>{note.term}:</strong> {note.detail}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
