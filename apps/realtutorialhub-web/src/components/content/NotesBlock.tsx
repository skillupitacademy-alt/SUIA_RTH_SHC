import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { ContentImage } from './ContentImage';

interface NotesBlockProps {
  data: TutorialContentJSON['notes'];
  theme: {
    blockNotes: string;
    blockNotesHeader: string;
  };
}

export function NotesBlock({ data, theme }: NotesBlockProps) {
  return (
    <section className="design-panel" aria-label="Notes block">
      <BlockHeader icon="📝" title="Notes" accentColor={theme.blockNotesHeader} />
      <div style={{ padding: 18, background: theme.blockNotes }}>
        <div
          style={{
            color: 'var(--block-text-primary)',
            fontSize: 14,
            lineHeight: 1.75,
            whiteSpace: 'pre-wrap',
          }}
        >
          {data.markdown}
        </div>
        {data.image ? <div style={{ marginTop: 16 }}><ContentImage image={data.image} /></div> : null}
      </div>
    </section>
  );
}

