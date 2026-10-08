import { ImageResponse } from 'next/og';

import { getSkillupProgramBySlug } from '@/lib/skillup-data';

type ProgramImageProps = {
  params: Promise<{ slug: string }>;
};

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function OpenGraphImage({ params }: ProgramImageProps) {
  const { slug } = await params;
  const program = await getSkillupProgramBySlug(slug);

  const title = program?.name ?? 'SkillUp IT Academy';
  const summary = program?.summary ?? 'Live tech training for students who want to build and place faster.';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background:
            'linear-gradient(135deg, #0f6e56 0%, #0f5f94 52%, #e9fbf4 100%)',
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 820 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 8, textTransform: 'uppercase', opacity: 0.9 }}>
            SkillUp IT Academy
          </div>
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.02, letterSpacing: -2 }}>{title}</div>
          <div style={{ fontSize: 30, lineHeight: 1.4, color: 'rgba(255,255,255,0.92)' }}>{summary}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>SkillUp IT Academy</div>
          <div
            style={{
              padding: '16px 22px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.18)',
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            Live Tech Training
          </div>
        </div>
      </div>
    ),
    size
  );
}
