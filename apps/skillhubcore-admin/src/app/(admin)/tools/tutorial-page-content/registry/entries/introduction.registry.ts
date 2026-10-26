import type { BlockRegistryEntry } from '../types';
import { introductionI1Example } from '../../blocks/introduction/I1/introductionI1.examples';
import { getIntroductionI1Prompt } from '../../blocks/introduction/I1/introductionI1.prompt';

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
      getAiPrompt: getIntroductionI1Prompt,
      authoringRules: [
        'Include Hero, Learning Goal, Topic, Where Fit, Solution, Where Used, Roadmap, Why Matters, and Key Takeaway.',
        'Use only approved Lucide icon names.',
        'Mark at most two flow or use-case cards as highlights.',
        'Use exactly four short motto lines.',
        'Keep solution code complete and executable, never pseudo-code.',
        'Return pure JSON matching the I1 schema with no markdown or system metadata.',
      ],
    },
  ],
};
