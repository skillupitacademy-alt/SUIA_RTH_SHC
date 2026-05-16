import fs from 'fs';

const filePath = 'd:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin)/tools/prompt-generator/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const assetSpecs = `const ASSET_SPECS: Record<string, Array<{ id: string; label: string; fieldPath: string; width: number; height: number; purpose: string }>> = {
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
};`;

// 1. Inject ASSET_SPECS before the component
if (!content.includes('const ASSET_SPECS')) {
  content = content.replace('function PromptGeneratorContent()', `${assetSpecs}\n\nfunction PromptGeneratorContent()`);
}

// 2. Fix generatePrompt signature and logic
const newGeneratePrompt = `  const generatePrompt = (assetId?: string) => {
    if (!domain.trim() || !subject.trim() || !topic.trim() || !subtopic.trim()) {
      alert('Please fill in all fields: Domain, Subject, Topic, and Subtopic');
      return;
    }
    if (!selectedSection) {
      alert('Please select a section');
      return;
    }

    if (assetId) {
      const assetPrompt = getSvgAssetPromptForSection(
        selectedSection,
        domain,
        subject,
        topic,
        subtopic,
        assetId
      );
      setGeneratedAssetPrompt(assetPrompt);
      setSelectedAssetId(assetId);
      setAssetCopied(false);
      return;
    }

    const prompt = getPromptForSection(selectedSection, domain, subject, topic, subtopic);
    const contract = getTutorialSectionContractByPromptId(selectedSection);
    setGeneratedPrompt(contract ? \`\${buildTutorialSectionSourceNote(contract)}\\n\\n\${prompt}\` : prompt);
    setCopied(false);

    const assetPrompt = getSvgAssetPromptForSection(selectedSection, domain, subject, topic, subtopic);
    setGeneratedAssetPrompt(assetPrompt);
    setSelectedAssetId(null);
    setAssetCopied(false);
  };`;

content = content.replace(/const generatePrompt = \(\) => \{[\s\S]*?setGeneratedAssetPrompt\(getSvgAssetPromptForSection\([\s\S]*?\)\);[\s\S]*?\};/, newGeneratePrompt);

fs.writeFileSync(filePath, content);
console.log('Final syntax audit and fix completed for Prompt Generator.');
