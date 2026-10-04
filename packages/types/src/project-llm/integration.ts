export interface IntegrationFileChange {
  path: string;
  action: 'ADD' | 'UPDATE' | 'NO_CHANGE';
  reason: string;
  sourceArtifactId?: string;
}

export interface IntegrationPlanRecord {
  integrationPlanId: string;
  candidateId: string;
  files: IntegrationFileChange[];
  registryChanges: string[];
  typeChanges: string[];
  rendererChanges: string[];
  tests: string[];
  evidenceRequired: string[];
  risks: string[];
  humanApprovalRequired: true;
  createdAt: string;
}
