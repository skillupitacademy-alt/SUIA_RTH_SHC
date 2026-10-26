export type ObjectiveO2StageKey = 'know' | 'understand' | 'apply';
export type ObjectiveO2CognitiveStageKey = ObjectiveO2StageKey;

export interface ObjectiveO2Item {
  id: string;
  text: string;
  stage?: ObjectiveO2StageKey;
  verb?: string;
  [key: string]: unknown;
}
export type ObjectiveO2ItemContract = ObjectiveO2Item;

export interface ObjectiveO2Stage {
  label?: string;
  description?: string;
  items: Array<string | ObjectiveO2Item>;
}
export type ObjectiveO2StageContract = ObjectiveO2Stage;

export interface ObjectiveO2StagesMap {
  know?: ObjectiveO2Stage;
  understand?: ObjectiveO2Stage;
  apply?: ObjectiveO2Stage;
}
export type ObjectiveO2StagesMapContract = ObjectiveO2StagesMap;

export interface ObjectiveO2ContentPayload {
  eyebrow?: string;
  title?: string;
  introduction?: string;
  stages?: ObjectiveO2StagesMap;
  objectives?: Array<ObjectiveO2Item>;
  [key: string]: unknown;
}

export interface ObjectiveO2BlockData {
  id: string;
  type: string;
  version?: string;
  content?: ObjectiveO2ContentPayload;
  [key: string]: unknown;
}

export interface ObjectiveO2BlockContract extends ObjectiveO2BlockData {
  type: 'objective';
  version: 'O2';
  content: ObjectiveO2ContentPayload;
}
