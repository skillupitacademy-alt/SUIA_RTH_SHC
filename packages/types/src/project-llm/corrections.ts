export type CorrectionPriority = 'BLOCKING' | 'REQUIRED' | 'RECOMMENDED';

export interface CorrectionTask {
  correctionId: string;
  findingId: string;
  priority: CorrectionPriority;
  title: string;
  problem: string;
  requiredChange: string;
  acceptanceCriteria: string[];
  prohibitedChanges: string[];
}

export interface CorrectionPackage {
  correctionPackageId: string;
  reviewId: string;
  instructions: CorrectionTask[];
  externalAiPrompt: string;
  humanImplementationNotes: string[];
  createdAt: string;
}
