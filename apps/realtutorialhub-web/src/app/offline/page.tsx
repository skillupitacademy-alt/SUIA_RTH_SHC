'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function OfflinePage() {
  const t = useTranslations('offline');
  const [lastVisited, setLastVisited] = useState<{ path: string; name: string } | null>(null);

  useEffect(() => {
    try {
      const path = window.localStorage.getItem('rth-last-subtopic-path');
      const name = window.localStorage.getItem('rth-last-subtopic-name');
      if (path && name) {
        setLastVisited({ path, name });
      }
    } catch {
      setLastVisited(null);
    }
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'var(--tutorial-page-bg)',
      }}
    >
      <section
        className="design-panel"
        style={{
          width: 'min(720px, 100%)',
          padding: 24,
          borderRadius: 18,
          backdropFilter: 'var(--design-backdrop)',
          WebkitBackdropFilter: 'var(--design-backdrop)',
        }}
      >
        <h1 style={{ margin: '0 0 10px', fontSize: 32, letterSpacing: '-0.04em' }}>{t('title')}</h1>
        <p style={{ margin: 0, color: 'var(--block-text-secondary)', lineHeight: 1.7 }}>{t('description')}</p>
        <div style={{ marginTop: 18 }}>
          {lastVisited ? (
            <Link
              href={lastVisited.path}
              style={{
                display: 'inline-flex',
                padding: '10px 14px',
                borderRadius: 999,
                background: 'var(--design-content-surface-soft)',
                border: 'var(--design-content-border)',
                color: 'var(--block-text-primary)',
                textDecoration: 'none',
                fontWeight: 800,
              }}
            >
              {t('restore')}: {lastVisited.name}
            </Link>
          ) : (
            <div style={{ color: 'var(--block-text-secondary)', fontWeight: 700 }}>{t('empty')}</div>
          )}
        </div>
      </section>
    </main>
  );
}
