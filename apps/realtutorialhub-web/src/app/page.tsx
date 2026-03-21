export default function HomePage() {
  return (
    <main className="tutorial-scaffold" style={{ padding: 32 }}>
      <section
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: 24,
          borderRadius: 20,
          background: 'var(--block-layman-bg)',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
        }}
      >
        <h1 style={{ margin: '0 0 12px', fontSize: 32, fontWeight: 800 }}>
          RealTutorialHub scaffold
        </h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: 'var(--block-text-secondary)' }}>
          The new tutorial app is scaffolded and ready for T2 block components.
        </p>
      </section>
    </main>
  );
}
