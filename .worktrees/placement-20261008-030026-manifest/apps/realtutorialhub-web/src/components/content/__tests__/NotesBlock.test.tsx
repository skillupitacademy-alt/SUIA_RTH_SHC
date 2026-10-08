import { cleanup, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotesBlock } from '../NotesBlock';
import { mockTutorialContent } from '../__fixtures__/mock-content';
import { getDomainTheme } from '@/lib/domain-themes';

import { renderWithIntl, runAxe } from './test-utils';

const theme = getDomainTheme('full-stack');

describe('NotesBlock', () => {
  it('renders content, exposes an aria-label, and passes axe', async () => {
    const { container } = renderWithIntl(<NotesBlock data={mockTutorialContent.notes} theme={theme} />);

    expect(screen.getByLabelText('Notes block')).toBeDefined();
    expect(screen.getAllByText(/Promises are placeholders/)).toHaveLength(1);

    const results = await runAxe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('handles null and empty content without crashing', () => {
    renderWithIntl(<NotesBlock data={null} theme={theme} />);
    expect(screen.getByLabelText('Notes block')).toBeDefined();

    cleanup();

    renderWithIntl(<NotesBlock data={{ markdown: '', image: null }} theme={theme} />);
    expect(screen.getByLabelText('Notes block')).toBeDefined();
  });

  it('applies notes UI/UX contract to modular blocks', () => {
    renderWithIntl(
      <NotesBlock
        data={{
          schemaVersion: 1,
          sectionType: 'notes',
          concept_card: {
            heroTitle: 'What is Python? Notes',
            heroSubtitle: 'A clear overview.',
            quickLook: ['Definition', 'Syntax'],
          },
          uiux_contract: {
            component_design_system: {
              concept_card: {
                primary_color: '#d03f00',
                density: 'compact',
                visible_parts: { action: false },
              },
            },
          },
        }}
        theme={theme}
      />
    );

    expect(screen.getByText('What is Python? Notes')).toBeDefined();
    expect(screen.queryByText('Begin with meaning first')).toBeNull();
  });
});
