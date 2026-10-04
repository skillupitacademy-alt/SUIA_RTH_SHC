export type CandidateArtifactType =
  | 'HTML'
  | 'CSS'
  | 'JAVASCRIPT'
  | 'JSON'
  | 'REACT_TYPESCRIPT'
  | 'ASSET'
  | 'OTHER';

export interface CandidateArtifact {
  artifactId: string;
  path: string;
  type: CandidateArtifactType;
  content: string;
}

export interface CandidatePackage {
  candidateId: string;
  requestId: string;
  briefId: string;
  handoffId: string;
  targetFamilyId: string;
  targetVersionId: string;
  guiApproved: boolean;
  artifacts: CandidateArtifact[];
  metadata: {
    externalProvider?: string;
    submittedAt: string;
    notes?: string;
  };
}

export interface CandidateIntakeFinding {
  code: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  artifactPath?: string;
}
