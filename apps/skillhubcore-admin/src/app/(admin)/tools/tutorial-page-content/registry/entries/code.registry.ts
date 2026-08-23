import type { BlockRegistryEntry } from '../types';
import { codeC1Example } from '../../blocks/code/C1/codeC1.examples';

/**
 * Code Block Registry
 * 
 * Owns metadata for all Code block versions (C1, C2, C3, ...)
 */
export const codeRegistry: BlockRegistryEntry = {
  id: 'code',
  label: 'Code',
  versions: [
    {
      id: 'v1',
      code: 'C1',
      label: 'C1 - Basic Example',
      description: 'Step-by-step code explanation with optional output and practice hint',
      getDefaultPayload: () => codeC1Example,
    },
  ],
};
