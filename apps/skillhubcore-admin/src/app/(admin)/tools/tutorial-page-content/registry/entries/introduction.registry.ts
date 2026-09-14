import type { BlockRegistryEntry } from '../types';
import { introductionI1Example } from '../../blocks/introduction/I1/introductionI1.examples';

/**
 * Introduction Block Registry
 * 
 * Owns metadata for all Introduction block versions (I1, I2, I3, ...)
 */
export const introductionRegistry: BlockRegistryEntry = {
  id: 'introduction',
  label: 'Introduction',
  versions: [
    {
      id: 'v1',
      code: 'I1',
      label: 'I1 - Roadmap Overview',
      description: 'Comprehensive roadmap-style overview with hero, learning path, and visual elements',
      getDefaultPayload: () => introductionI1Example,
    },
  ],
};
