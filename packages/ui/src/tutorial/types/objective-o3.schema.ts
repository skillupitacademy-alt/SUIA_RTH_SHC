/**
 * TypeScript Type Contract for ObjectiveBlock Version O3 (Skill-Based Objectives)
 * Proposed Output Path: packages/types/src/tutorial-rich-document/schemas/objective-o3.schema.ts
 */
export type ObjectiveO3SkillVerbContract = 'Identify' | 'Explain' | 'Compare' | 'Create' | 'Implement' | 'Use' | 'Modify' | 'Debug' | 'Analyze' | 'Optimize' | 'Design' | 'Test' | 'Evaluate' | 'Integrate' | 'Deploy' | 'Access' | string;
export interface ObjectiveO3ObjectiveItemContract {
  id: string;
  text: string;
  label?: ObjectiveO3SkillVerbContract;
  verb?: ObjectiveO3SkillVerbContract;
  description?: string;
  expectedResult?: string;
  [key: string]: unknown;
}
export interface ObjectiveO3SkillEntryContract {
  id: string;
  label: ObjectiveO3SkillVerbContract;
  description: string;
  expectedResult?: string;
  [key: string]: unknown;
}
export interface ObjectiveO3ContentPayload {
  eyebrow?: string;
  title?: string;
  introduction?: string;
  objectives: Array<ObjectiveO3ObjectiveItemContract>;
  skills?: Array<ObjectiveO3SkillEntryContract>;
  [key: string]: unknown;
}
export interface ObjectiveO3BlockContract {
  id: string;
  type: 'objective';
  version: 'O3';
  content: ObjectiveO3ContentPayload;
  [key: string]: unknown;
}
