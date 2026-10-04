export type EvidenceType =
  | 'TYPESCRIPT'
  | 'UNIT_TEST'
  | 'COMPONENT_TEST'
  | 'COMPOSER'
  | 'TUTORIAL_DOCUMENT'
  | 'TUTORIAL_PAGE'
  | 'UBRC'
  | 'ILS'
  | 'LSNB'
  | 'RSSB'
  | 'SKILLUP'
  | 'RTH'
  | 'ACCESSIBILITY'
  | 'SECURITY';

export interface EvidenceRecord {
  evidenceId: string;
  type: EvidenceType;
  status: 'PASS' | 'FAIL' | 'MISSING' | 'WAIVED';
  command?: string;
  output?: string;
  artifactPath?: string;
  notes?: string;
  collectedAt: string;
}

export interface EvidencePackage {
  evidencePackageId: string;
  candidateId: string;
  integrationPlanId: string;
  records: EvidenceRecord[];
  blockingFailures: string[];
  certificationReady: boolean;
  frozenAt?: string;
  createdAt: string;
}
