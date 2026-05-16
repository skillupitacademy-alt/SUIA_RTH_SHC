export interface AssetSpec {
  id: string;
  label: string;
  fieldPath: string;
  width: number;
  height: number;
  purpose: string;
}

export const ASSET_SPECS: Record<string, AssetSpec[]> = {
  layman: [
    {
      id: 'layman-analogy',
      label: 'Everyday Analogy',
      fieldPath: 'everydayAnalogy.image',
      width: 1200,
      height: 700,
      purpose: 'Create a clean educational analogy illustration that visually explains the everyday comparison for this subtopic.',
    },
    {
      id: 'layman-overview',
      label: 'Concept Overview',
      fieldPath: 'simpleOverview.image',
      width: 1200,
      height: 700,
      purpose: 'Create a simple, welcoming visual that introduces the concept to a complete beginner.',
    },
  ],
  notes: [
    {
      id: 'notes-summary',
      label: 'Revision Summary',
      fieldPath: 'summaryCard.image',
      width: 1200,
      height: 700,
      purpose: 'Create a summary infographic that visually reinforces the core idea, memory hook, and revision intent of the Notes section.',
    },
    {
      id: 'notes-hero',
      label: 'Hero Infographic',
      fieldPath: 'summaryHeroInfographic.image',
      width: 1440,
      height: 800,
      purpose: 'A large, premium hero infographic that explains "How it Works" at a glance for this subtopic.',
    },
    {
      id: 'notes-memory-map',
      label: 'Concept Memory Map',
      fieldPath: 'conceptMemoryMap.image',
      width: 1200,
      height: 900,
      purpose: 'A node-and-connection diagram showing the relationships between different parts of the concept.',
    },
    {
      id: 'notes-syntax',
      label: 'Syntax Diagram',
      fieldPath: 'syntaxBlock.image',
      width: 1200,
      height: 600,
      purpose: 'A visual diagram that points out and explains specific parts of the code syntax.',
    },
  ],
  code: [
    {
      id: 'code-preview',
      label: 'Output Preview',
      fieldPath: 'outputDemonstration.previewAsset',
      width: 1280,
      height: 720,
      purpose: 'Create a UI-style output preview showing before/after or result-state for the code example.',
    },
  ],
  technical: [
    {
      id: 'tech-architecture',
      label: 'System Architecture',
      fieldPath: 'sections.0.diagramAsset',
      width: 1440,
      height: 900,
      purpose: 'Create a system or runtime architecture diagram suitable for an advanced technical explanation of the subtopic.',
    },
  ],
  summary: [
    {
      id: 'summary-mastery',
      label: 'Mastery Recap',
      fieldPath: 'masteryRecapCard.heroAsset',
      width: 1200,
      height: 700,
      purpose: 'Create a celebratory recap graphic that visually summarizes the concept and completion state.',
    },
  ],
};
