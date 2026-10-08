'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function TutorialNavbar() {
  const t = useTranslations('navbar');
  const locale = useLocale();
  const router = useRouter();

  const setLocale = (nextLocale: 'en' | 'hi') => {
    document.cookie = `rth-locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 60,
        background: 'var(--tutorial-surface)',
        borderBottom: '1px solid var(--tutorial-border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          height: '100%',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', color: 'var(--block-text-primary)', fontWeight: 900, fontSize: 18 }}>
          {t('brand')}
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 14, color: 'var(--block-text-secondary)' }}>
          <a href="#compare" style={{ color: 'inherit', textDecoration: 'none' }}>
            {t('dashboard')}
          </a>
          <a href="#compare" style={{ color: 'inherit', textDecoration: 'none' }}>
            {t('progress')}
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--block-text-secondary)' }}>{t('language')}</span>
            <button
              type="button"
              onClick={() => setLocale('en')}
              aria-pressed={locale === 'en'}
              style={{
                border: '1px solid var(--tutorial-border)',
                borderRadius: 999,
                padding: '6px 10px',
                background: locale === 'en' ? 'var(--tutorial-surface-soft)' : 'var(--tutorial-surface)',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {t('english')}
            </button>
            <button
              type="button"
              onClick={() => setLocale('hi')}
              aria-pressed={locale === 'hi'}
              style={{
                border: '1px solid var(--tutorial-border)',
                borderRadius: 999,
                padding: '6px 10px',
                background: locale === 'hi' ? 'var(--tutorial-surface-soft)' : 'var(--tutorial-surface)',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {t('hindi')}
            </button>
          </div>
          <ThemeToggle />
          <span
            aria-hidden="true"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'inline-grid',
              placeItems: 'center',
              background: 'var(--block-layman-bg)',
              color: 'var(--block-text-primary)',
              fontWeight: 800,
            }}
          >
            R
          </span>
        </nav>
      </div>
    </header>
  );
}
