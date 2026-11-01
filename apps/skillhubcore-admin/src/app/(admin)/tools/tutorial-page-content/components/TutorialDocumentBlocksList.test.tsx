// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BlockInstance } from '../document/documentTransformation';
import { TutorialDocumentBlocksList } from './TutorialDocumentBlocksList';

afterEach(cleanup);

const blocks: BlockInstance[] = ['First', 'Second'].map((title, index) => ({
  id: `block-${index}`, type: 'objective', version: 'O1', versionCode: 'O1', title,
  payload: { title, objectives: [{ id: '1', text: 'Learn the topic' }] },
  payloadFormat: 'canonical', sourceFormat: 'json', sourceContent: '{}',
}));

function setup() {
  const reorder = vi.fn();
  render(<TutorialDocumentBlocksList documentBlocks={blocks} onLoadBlock={vi.fn()}
    onRemoveBlock={vi.fn()} onReorderBlocks={reorder} />);
  return reorder;
}

describe('document block ordering', () => {
  it('exposes a semantic list and native keyboard reorder controls', () => {
    const reorder = setup();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    const handle = screen.getByRole('button', { name: 'Reorder Second' });
    fireEvent.keyDown(handle, { key: 'ArrowUp' });
    expect(reorder).toHaveBeenCalledWith(1, 0);
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(reorder).toHaveBeenCalledTimes(1);
  });

  it('preserves drag/drop and Move Up actions', () => {
    const reorder = setup();
    const dataTransfer = { setData: vi.fn(), getData: () => '0', effectAllowed: '', dropEffect: '' };
    fireEvent.dragStart(screen.getByRole('button', { name: 'Reorder First' }), { dataTransfer });
    fireEvent.dragOver(screen.getByRole('button', { name: 'Reorder Second' }), { dataTransfer });
    fireEvent.drop(screen.getByRole('button', { name: 'Reorder Second' }), { dataTransfer });
    expect(reorder).toHaveBeenCalledWith(0, 1);
    fireEvent.click(screen.getAllByRole('button', { name: 'Move Up' })[1]);
    expect(reorder).toHaveBeenCalledWith(1, 0);
  });
});
