import type { BlockRegistryEntry } from '../types';
import { definitionD1Example } from '../../blocks/definition/D1/definitionD1.examples';

/**
 * Definition Block Registry
 * 
 * Owns metadata for all Definition block versions (D1, D2, D3, ...)
 */
export const definitionRegistry: BlockRegistryEntry = {
  id: 'definition',
  label: 'Definition',
  versions: [
    {
      id: 'v1',
      code: 'D1',
      label: 'D1 - Concept Definition',
      description: 'Authoritative definition with intuition, example & responsive key characteristics',
      getDefaultPayload: () => definitionD1Example,
    },
  ],
};
