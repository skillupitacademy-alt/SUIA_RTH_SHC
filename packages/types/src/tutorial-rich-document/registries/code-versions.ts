/**
 * Code Block Version Registry
 * 
 * Defines all available Code block versions and their metadata.
 * Only C1 is currently active; C2-C10 are reserved for future pedagogical patterns.
 */

export const CODE_VERSION_REGISTRY = {
  C1: {
    id: 'C1',
    label: 'Basic Syntax',
    status: 'active',
    description: 'Introduces code syntax using the standard Code presentation.',
  },
  C2: {
    id: 'C2',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Code presentation.',
  },
  C3: {
    id: 'C3',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Code presentation.',
  },
  C4: {
    id: 'C4',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Code presentation.',
  },
  C5: {
    id: 'C5',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Code presentation.',
  },
  C6: {
    id: 'C6',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Code presentation.',
  },
  C7: {
    id: 'C7',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Code presentation.',
  },
  C8: {
    id: 'C8',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Code presentation.',
  },
  C9: {
    id: 'C9',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Code presentation.',
  },
  C10: {
    id: 'C10',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Code presentation.',
  },
} as const;

export type CodeVersion = keyof typeof CODE_VERSION_REGISTRY;

export const ACTIVE_CODE_VERSIONS = ['C1'] as const;
