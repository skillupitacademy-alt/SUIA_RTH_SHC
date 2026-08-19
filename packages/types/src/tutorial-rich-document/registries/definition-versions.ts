/**
 * Definition Block Version Registry
 * 
 * Defines all available Definition block versions and their metadata.
 * Only D1 is currently active; D2-D6 are reserved for future pedagogical patterns.
 */

export const DEFINITION_VERSION_REGISTRY = {
  D1: {
    id: 'D1',
    label: 'Simple Orientation',
    status: 'active',
    description: 'Introduces a concept using the standard Definition presentation.',
  },
  D2: {
    id: 'D2',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Definition presentation.',
  },
  D3: {
    id: 'D3',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Definition presentation.',
  },
  D4: {
    id: 'D4',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Definition presentation.',
  },
  D5: {
    id: 'D5',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Definition presentation.',
  },
  D6: {
    id: 'D6',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Definition presentation.',
  },
} as const;

export type DefinitionVersion = keyof typeof DEFINITION_VERSION_REGISTRY;

export const ACTIVE_DEFINITION_VERSIONS = ['D1'] as const;
