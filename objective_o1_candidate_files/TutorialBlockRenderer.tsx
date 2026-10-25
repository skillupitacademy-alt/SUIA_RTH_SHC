import React from 'react';
import type { BlockComponentProps, TutorialBlock } from './types';
import { ObjectiveBlock } from './blocks/ObjectiveO1Block';

export function TutorialBlockRenderer(props: BlockComponentProps<TutorialBlock>) {
  const { block } = props;

  switch (block.type) {
    case 'objective':
      return <ObjectiveBlock {...props} />;
    default:
      return <div>Unsupported block type: {block.type}</div>;
  }
}
