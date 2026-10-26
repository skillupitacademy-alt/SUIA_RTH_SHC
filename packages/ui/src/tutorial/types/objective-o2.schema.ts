export type ObjectiveO2CognitiveStageKey = 'know' | 'understand' | 'apply';

export interface ObjectiveO2ItemContract {
  id: string;
  text: string;
  stage?: ObjectiveO2CognitiveStageKey;
  verb?: string;
  [key: string]: unknown;
}

export interface ObjectiveO2StageContract {
  label?: string;
  description?: string;
  items: Array<string | ObjectiveO2ItemContract>;
}

export interface ObjectiveO2StagesMapContract {
  know?: ObjectiveO2StageContract;
  understand?: ObjectiveO2StageContract;
  apply?: ObjectiveO2StageContract;
}

export interface ObjectiveO2ContentPayload {
  eyebrow?: string;
  title?: string;
  introduction?: string;
  stages?: ObjectiveO2StagesMapContract;
  objectives: Array<ObjectiveO2ItemContract>;
  [key: string]: unknown;
}

export interface ObjectiveO2BlockContract {
  id: string;
  type: 'objective';
  version: 'O2';
  content: ObjectiveO2ContentPayload;
  [key: string]: unknown;
}
