'use client';

import { useTranslations } from 'next-intl';

type BlockErrorFallbackProps = {
  blockName: string;
};

export function BlockErrorFallback({ blockName }: BlockErrorFallbackProps) {
  const t = useTranslations('common');

  return (
    <div
      role="alert"
      style={{
        minHeight: 160,
        borderRadius: 18,
        border: '1px solid rgba(185, 28, 28, 0.18)',
        background: 'rgba(185, 28, 28, 0.06)',
        color: '#991b1b',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 420, fontWeight: 800 }}>{t('unableToLoadBlock', { blockName })}</div>
    </div>
  );
}
