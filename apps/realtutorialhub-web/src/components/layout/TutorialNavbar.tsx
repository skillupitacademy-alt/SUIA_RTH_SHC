import Link from 'next/link';

export function TutorialNavbar() {
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
          📚 RealTutorialHub
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 14, color: 'var(--block-text-secondary)' }}>
          <a href="#compare" style={{ color: 'inherit', textDecoration: 'none' }}>
            Dashboard
          </a>
          <a href="#compare" style={{ color: 'inherit', textDecoration: 'none' }}>
            My Progress
          </a>
          <span aria-hidden="true">🔔</span>
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

