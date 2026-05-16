import fs from 'fs';

const filePath = 'd:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/content-manager/add-section/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

const newLaymanTransformer = `function transformLaymanSection(content: JsonRecord, subtopicName: string): JsonRecord {
  const simpleOverview = asRecord(content.simpleOverview);
  const everydayAnalogy = asRecord(content.everydayAnalogy);
  const whyItExists = asRecord(content.whyItExists);
  const simpleUseCases = asRecord(content.simpleUseCases);
  const beginnerBreakdown = asRecord(content.beginnerBreakdown);
  const mentalModel = asRecord(content.mentalModel);
  const commonConfusions = asRecord(content.commonConfusions);
  const simpleRecap = asRecord(content.simpleRecap);
  const footerBlock = asRecord(content.footerBlock);

  return {
    simpleOverview: {
      badge: asString(simpleOverview.badge, 'LAYMAN SECTION'),
      headline: asString(simpleOverview.headline, \`What is \${subtopicName}?\`),
      simpleDefinition: asString(simpleOverview.simpleDefinition, \`\${subtopicName} explained simply\`),
      subExplanation: asString(simpleOverview.subExplanation),
      ...(normalizeSvgAsset(simpleOverview.image) ? { image: normalizeSvgAsset(simpleOverview.image) } : {}),
      inShort: asString(simpleOverview.inShort),
    },
    everydayAnalogy: {
      title: asString(everydayAnalogy.title, 'Everyday Analogy'),
      analogyTitle: asString(everydayAnalogy.analogyTitle),
      analogyExplanation: asString(everydayAnalogy.analogyExplanation),
      comparisonPoints: asArray(everydayAnalogy.comparisonPoints),
      analogyInsight: asString(everydayAnalogy.analogyInsight),
      ...(normalizeSvgAsset(everydayAnalogy.image) ? { image: normalizeSvgAsset(everydayAnalogy.image) } : {}),
    },
    whyItExists: {
      sectionTitle: asString(whyItExists.sectionTitle, 'Why It Exists'),
      benefitCards: asArray(whyItExists.benefitCards),
    },
    simpleUseCases: {
      gridTitle: asString(simpleUseCases.gridTitle, 'Simple Use Cases'),
      useCaseCards: asArray(simpleUseCases.useCaseCards),
    },
    beginnerBreakdown: {
      title: asString(beginnerBreakdown.title, 'Beginner Breakdown (How It Works)'),
      steps: asArray(beginnerBreakdown.steps),
    },
    mentalModel: {
      title: asString(mentalModel.title, 'Mental Model (Big Picture)'),
      nodes: asArray(mentalModel.nodes),
      connections: asArray(mentalModel.connections),
      toolsAndServices: asArray(mentalModel.toolsAndServices),
      footerNote: asString(mentalModel.footerNote),
    },
    commonConfusions: {
      title: asString(commonConfusions.title, 'Common Confusions'),
      faqItems: asArray(commonConfusions.faqItems),
    },
    simpleRecap: {
      title: asString(simpleRecap.title, 'Simple Recap'),
      keyTakeaways: asArray(simpleRecap.keyTakeaways),
      rememberThis: asRecord(simpleRecap.rememberThis),
    },
    footerBlock: {
      quote: asString(footerBlock.quote),
      finalNote: asString(footerBlock.finalNote),
    },
  };
}`;

const lines = content.split('\n');
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('function transformLaymanSection')) {
        startIdx = i;
        // Find the matching closing brace for the function
        let braceCount = 0;
        for (let j = i; j < lines.length; j++) {
            braceCount += (lines[j].match(/{/g) || []).length;
            braceCount -= (lines[j].match(/}/g) || []).length;
            if (braceCount === 0 && j > i) {
                endIdx = j;
                break;
            }
        }
        break;
    }
}

if (startIdx !== -1 && endIdx !== -1) {
    lines.splice(startIdx, endIdx - startIdx + 1, newLaymanTransformer);
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`Updated transformLaymanSection (lines \${startIdx + 1} to \${endIdx + 1})`);
} else {
    console.error('Could not find transformLaymanSection');
    process.exit(1);
}
