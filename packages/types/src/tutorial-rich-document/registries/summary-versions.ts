/**
 * Summary Block Version Registry
 * 
 * Defines all available Summary block versions and their metadata.
 * Only S1 is currently active; S2-S6 are reserved for future pedagogical patterns.
 */

export const SUMMARY_VERSION_REGISTRY = {
  S1: {
    id: 'S1',
    label: 'Basic Summary',
    status: 'active',
    description: 'Introduces summary using standard bullet-point presentation.',
  },
  S2: {
    id: 'S2',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Summary presentation.',
  },
  S3: {
    id: 'S3',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Summary presentation.',
  },
  S4: {
    id: 'S4',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Summary presentation.',
  },
  S5: {
    id: 'S5',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Summary presentation.',
  },
  S6: {
    id: 'S6',
    label: 'Planned',
    status: 'planned',
    description: 'Reserved for future Summary presentation.',
  },
} as const;

export type SummaryVersion = keyof typeof SUMMARY_VERSION_REGISTRY;

export const ACTIVE_SUMMARY_VERSIONS = ['S1'] as const;
