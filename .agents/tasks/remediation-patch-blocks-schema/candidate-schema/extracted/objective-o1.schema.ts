export interface ObjectiveO1BlockContract {
  id: string;
  type: 'objective';
  version: 'O1';
  content: {
    title: string;
    objectives: Array<{ id: string; text: string; [key: string]: unknown }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
