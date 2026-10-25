import { ObjectiveBlock } from './blocks/ObjectiveO1Block';

export const blockRegistry = {
  // ... existing blocks
  objective: ObjectiveBlock,
};

export type RegisteredBlockType = keyof typeof blockRegistry;
