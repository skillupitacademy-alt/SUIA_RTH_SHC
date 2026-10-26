import type { BlockRegistryEntry } from '../types';
import { definitionD1Example } from '../../blocks/definition/D1/definitionD1.examples';
import { getDefinitionD1Prompt } from '../../blocks/definition/D1/definitionD1.prompt';

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
      getAiPrompt: getDefinitionD1Prompt,
      authoringRules: [
        'Generate 2-4 genuinely distinct properties.',
        'Keep property titles to 2-6 words.',
        'Use 1-3 clear sentences for each property description.',
        'Do not add UI layout metadata; the renderer handles responsive presentation.',
        'Return pure JSON matching the D1 schema with no markdown or system metadata.',
      ],
    },
  ],
};
