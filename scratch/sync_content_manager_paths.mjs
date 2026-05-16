import fs from 'fs';

const filePath = 'd:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin)/tools/content-manager/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update getDefaultAssetFieldPath
content = content.replace(
  /function getDefaultAssetFieldPath\(section: SectionType\) \{[\s\S]*?switch \(section\) \{[\s\S]*?case 'layman':[\s\S]*?return 'everydayAnalogy\.image';[\s\S]*?case 'notes':[\s\S]*?return 'summaryCard\.image';[\s\S]*?case 'code':[\s\S]*?return 'outputDemonstration\.previewAsset';[\s\S]*?case 'technical':[\s\S]*?return 'sections\.0\.diagramAsset';[\s\S]*?case 'summary':[\s\S]*?return 'masteryRecapCard\.heroAsset';[\s\S]*?default:[\s\S]*?return '';[\s\S]*?\}[\s\S]*?\}/,
  `function getDefaultAssetFieldPath(section: SectionType) {
  switch (section) {
    case 'layman':
      return 'everydayAnalogy.image';
    case 'notes':
      return 'summaryCard.image';
    case 'code':
      return 'outputDemonstration.previewAsset';
    case 'technical':
      return 'sections.0.diagramAsset';
    case 'summary':
      return 'masteryRecapCard.heroAsset';
    case 'visual':
      return 'conceptVisualIntro.image';
    default:
      return '';
  }
}`
);

// Update getAllowedAssetFieldPaths
content = content.replace(
  /function getAllowedAssetFieldPaths\(section: SectionType\) \{[\s\S]*?switch \(section\) \{[\s\S]*?case 'layman':[\s\S]*?return \['everydayAnalogy\.image'\];[\s\S]*?case 'notes':[\s\S]*?return \['summaryCard\.image'\];[\s\S]*?case 'code':[\s\S]*?return \['outputDemonstration\.previewAsset'\];[\s\S]*?case 'technical':[\s\S]*?return \['sections\.0\.diagramAsset'\];[\s\S]*?case 'summary':[\s\S]*?return \['masteryRecapCard\.heroAsset'\];[\s\S]*?default:[\s\S]*?return \[\] as string\[\];[\s\S]*?\}[\s\S]*?\}/,
  `function getAllowedAssetFieldPaths(section: SectionType) {
  switch (section) {
    case 'layman':
      return ['everydayAnalogy.image', 'simpleOverview.image'];
    case 'notes':
      return ['summaryCard.image', 'summaryHeroInfographic.image', 'conceptMemoryMap.image', 'syntaxBlock.image'];
    case 'code':
      return ['outputDemonstration.previewAsset'];
    case 'technical':
      return ['sections.0.diagramAsset'];
    case 'summary':
      return ['masteryRecapCard.heroAsset'];
    case 'visual':
      return [
        'conceptVisualIntro.image',
        'diagrammaticBreakdown.image',
        'stepByStepVisualFlow.image',
        'comparativeVisualization.image',
        'mentalModelVisualization.image',
        'realWorldVisualMapping.image',
        'commonConfusionVisualization.image',
        'visualSummary.image'
      ];
    default:
      return [] as string[];
  }
}`
);

fs.writeFileSync(filePath, content);
console.log('Successfully synchronized Content Manager asset paths with Prompt Generator.');
