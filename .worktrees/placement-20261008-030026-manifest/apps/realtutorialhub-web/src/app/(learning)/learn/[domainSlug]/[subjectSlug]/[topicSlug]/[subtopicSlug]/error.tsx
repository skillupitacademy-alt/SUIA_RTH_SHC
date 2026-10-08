'use client';

export default function TutorialSubtopicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 720,
          width: '100%',
          borderRadius: 16,
          border: '1px solid #fecaca',
          background: '#fff1f2',
          padding: 24,
          color: '#881337',
        }}
      >
        <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800 }}>Tutorial Content Blocked</h1>
        <p style={{ margin: '0 0 16px', lineHeight: 1.7 }}>{error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            border: 'none',
            borderRadius: 10,
            background: '#d03f00',
            color: '#fff',
            padding: '10px 18px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
