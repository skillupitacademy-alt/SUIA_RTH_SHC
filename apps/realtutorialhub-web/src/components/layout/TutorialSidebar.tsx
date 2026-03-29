import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Play, 
  MessageSquare, 
  CheckSquare, 
  Target, 
  Video, 
  FolderCode, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react';

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
  onOpenAiTutor: () => void;
}

const statusStyles: Record<SidebarItemStatus, { color: string; label: string }> = {
  completed: { color: '#43a047', label: '✓' },
  active: { color: 'var(--sidebar-accent)', label: '●' },
  in_progress: { color: '#f57c00', label: '◐' },
  locked: { color: '#bdbdbd', label: '🔒' },
  not_started: { color: '#bdbdbd', label: '○' },
};

export function TutorialSidebar({ currentDomain, topicGroups, notes, theme, activeSubtopicSlug, onOpenAiTutor }: TutorialSidebarProps) {
  const t = useTranslations('sidebar');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(() => topicGroups.map((group) => group.defaultExpanded));
  const [showUpArrow, setShowUpArrow] = useState(false);
  const [showDownArrow, setShowDownArrow] = useState(false);

  const visibleNotes = useMemo(() => notes.slice(0, 6), [notes]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowUpArrow(el.scrollTop > 10);
    setShowDownArrow(el.scrollTop + el.clientHeight < el.scrollHeight - 10);
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  const scrollBy = (amount: number) => {
    scrollContainerRef.current?.scrollBy({ top: amount, behavior: 'smooth' });
  };

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleContinueLesson = () => {
    // Finds the first 'not_started' or 'in_progress' block
    const allItems = [...currentDomain.topics, ...topicGroups.flatMap(g => g.items)];
    const firstUnviewed = allItems.find(item => item.status === 'not_started' || item.status === 'in_progress');
    
    if (firstUnviewed) {
      const el = document.getElementById(`block-${firstUnviewed.slug}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const shortcuts = [
    { label: 'Continue', icon: Play, onClick: handleContinueLesson, color: '#4f46e5' },
    { label: 'AI Tutor', icon: MessageSquare, onClick: onOpenAiTutor, color: theme.sidebarAccent },
    { label: 'Progress', icon: CheckSquare, onClick: () => scrollToId('progress-panel'), color: '#0891b2' },
    { label: 'Weak Areas', icon: Target, href: '/learn/remediation', color: '#e11d48' },
    { label: 'Sessions', icon: Video, onClick: () => scrollToId('live-session-panel'), color: '#7c3aed' },
    { label: 'Projects', icon: FolderCode, onClick: () => scrollToId('project-panel'), color: '#2563eb' },
  ];

  return (
    <aside
      style={{
        width: 260,
        flexShrink: 0,
        background: 'var(--tutorial-surface)',
        borderRight: '1px solid var(--tutorial-border)',
        position: 'sticky',
        top: 98,
        height: 'calc(100vh - 98px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Scroll Controls (Conditional) */}
      {showUpArrow && (
        <button
          onClick={() => scrollBy(-150)}
          style={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: 'var(--tutorial-surface)',
            border: '1px solid var(--tutorial-border)',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            color: theme.sidebarAccent,
          }}
        >
          <ChevronUp size={16} />
        </button>
      )}

      {showDownArrow && (
        <button
          onClick={() => scrollBy(150)}
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: 'var(--tutorial-surface)',
            border: '1px solid var(--tutorial-border)',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
            color: theme.sidebarAccent,
          }}
        >
          <ChevronDown size={16} />
        </button>
      )}

      {/* Main Scrollable Content */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px 0',
        }}
        className="hide-scrollbar"
      >
        {/* Domain Name */}
        <div style={{ padding: '0 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--block-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Current Domain
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--block-text-primary)', lineHeight: 1.3 }}>
            {currentDomain.name}
          </div>
        </div>

        {/* Shortcuts Section */}
        <div style={{ padding: '0 12px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--block-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, padding: '0 4px' }}>
            Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {shortcuts.map((s) => {
              const content = (
                <>
                  <s.icon size={16} style={{ color: s.color }} />
                  <span style={{ fontSize: 11, fontWeight: 800 }}>{s.label}</span>
                </>
              );

              const btnStyle = {
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid var(--tutorial-border)',
                background: 'var(--tutorial-surface-soft)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                color: 'var(--block-text-primary)',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
              };

              if (s.href) {
                return (
                  <a key={s.label} href={s.href} style={btnStyle} className="sidebar-shortcut">
                    {content}
                  </a>
                );
              }

              return (
                <button key={s.label} onClick={s.onClick} style={btnStyle} className="sidebar-shortcut">
                  {content}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '0 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--block-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, padding: '0 4px' }}>
            Curriculum
          </div>
          <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
            {currentDomain.topics.map((topic) => {
              const status = statusStyles[topic.status];
              const active = topic.slug === activeSubtopicSlug;

              return (
                <div
                  key={topic.slug}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: active ? `${theme.sidebarAccent}14` : 'transparent',
                    color: active ? theme.sidebarAccent : topic.status === 'completed' ? '#4a5568' : 'var(--block-text-secondary)',
                    fontWeight: active ? 800 : 600,
                    fontSize: 13,
                    cursor: 'default',
                  }}
                >
                  <span aria-hidden="true" style={{ color: status.color, minWidth: 16, textAlign: 'center', fontSize: 14 }}>
                    {status.label}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic.name}</span>
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
                  paddingTop: index > 0 ? 12 : 0,
                  marginTop: index > 0 ? 12 : 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => prev.map((item, idx) => (idx === index ? !item : item)))}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    padding: '6px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'var(--block-text-primary)',
                    fontSize: 13,
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{group.name}</span>
                  <span aria-hidden="true" style={{ opacity: 0.5 }}>{isOpen ? '∨' : '›'}</span>
                </button>
                {isOpen ? (
                  <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                    {group.items.map((item) => {
                      const status = statusStyles[item.status];
                      const active = item.slug === activeSubtopicSlug;
                      return (
                        <div
                          key={item.slug}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 10px',
                            borderRadius: 10,
                            background: active ? `${theme.sidebarAccent}14` : 'transparent',
                            color: active ? theme.sidebarAccent : item.status === 'completed' ? '#4a5568' : 'var(--block-text-secondary)',
                            fontWeight: active ? 800 : 600,
                            fontSize: 13,
                          }}
                        >
                          <span aria-hidden="true" style={{ color: status.color, minWidth: 16, textAlign: 'center', fontSize: 14 }}>
                            {status.label}
                          </span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div
          style={{
            margin: '24px 12px 12px',
            padding: '16px',
            background: '#fffde7',
            borderRadius: 16,
            border: '1px solid #ffe082',
            boxShadow: '0 2px 8px rgba(253, 224, 71, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Target size={16} style={{ color: '#e65100' }} />
            <div style={{ fontWeight: 900, fontSize: 13, color: '#5d4037' }}>{t('notes')}</div>
          </div>
          <div style={{ display: 'grid', gap: 10, maxHeight: 220, overflow: 'hidden' }}>
            {visibleNotes.map((note) => (
              <div key={note.term} style={{ fontSize: 12, lineHeight: 1.6, color: '#5d4037' }}>
                <strong style={{ color: '#e65100' }}>{note.term}:</strong> {note.detail}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
