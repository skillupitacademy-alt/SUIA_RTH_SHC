import type { BlockRegistryEntry } from '../types';
import { summaryS1Example } from '../../blocks/summary/S1/summaryS1.examples';

/**
 * Summary Block Registry
 * 
 * Owns metadata for all Summary block versions (S1, S2, S3, ...)
 */
export const summaryRegistry: BlockRegistryEntry = {
  id: 'summary',
  label: 'Summary',
  versions: [
    {
      id: 'v1',
      code: 'S1',
      label: 'S1 - Revision Table',
      description: 'Quick revision table with key points, remember cards and takeaways',
      getDefaultPayload: () => summaryS1Example,
    },
  ],
};
