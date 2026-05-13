export default function LoadingTutorialSubtopicPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--tutorial-page-bg, #f8fafc)',
      }}
    >
      <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '4px solid rgba(208, 63, 0, 0.18)',
            borderTopColor: '#d03f00',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ margin: 0, color: '#475569', fontWeight: 600 }}>Loading tutorial content...</p>
      </div>
    </div>
  );
}
