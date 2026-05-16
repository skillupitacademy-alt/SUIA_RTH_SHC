import fs from 'fs';

const filePath = 'd:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/api/content-manager/add-section/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Update Technical Section
content = content.replace(
  /function transformTechnicalSection\(content: JsonRecord, subtopicName: string\): JsonRecord \{[\s\S]*?sections: asArray\(content\.sections\),[\s\S]*?\};[\s\S]*?\}/,
  `function transformTechnicalSection(content: JsonRecord, subtopicName: string): JsonRecord {
  return {
    title: asString(content.title, \`Technical Deep Dive: \${subtopicName}\`),
    badge: asString(content.badge, 'Advanced'),
    intro: asString(content.intro),
    sections: asArray<JsonRecord>(content.sections).map((section) => ({
      ...section,
      steps: asArray(section.steps),
      keyPoints: asArray(section.keyPoints),
      ...(normalizeSvgAsset(section.diagramAsset) ? { diagramAsset: normalizeSvgAsset(section.diagramAsset) } : {}),
    })),
  };
}`
);

// Update Code Section
content = content.replace(
  /function transformCodeSection\(content: JsonRecord\): JsonRecord \{[\s\S]*?codeSummary: \{[\s\S]*?nextSteps: asArray\(codeSummary\.nextSteps\),[\s\S]*?\},[\s\S]*?\};[\s\S]*?\}/,
  `function transformCodeSection(content: JsonRecord): JsonRecord {
  const problemContext = asRecord(content.problemContext);
  const lineByLineExplanation = asRecord(content.lineByLineExplanation);
  const outputDemonstration = asRecord(content.outputDemonstration);
  const bestPracticeVersion = asRecord(content.bestPracticeVersion);
  const commonMistakes = asRecord(content.commonMistakes);
  const realWorldImplementation = asRecord(content.realWorldImplementation);
  const codeSummary = asRecord(content.codeSummary);

  return {
    ...content,
    problemContext: {
      ...problemContext,
      requirements: asArray(problemContext.requirements),
    },
    lineByLineExplanation: {
      ...lineByLineExplanation,
      lines: asArray(lineByLineExplanation.lines),
    },
    outputDemonstration: {
      ...outputDemonstration,
      ...(normalizeSvgAsset(outputDemonstration.previewAsset) ? { previewAsset: normalizeSvgAsset(outputDemonstration.previewAsset) } : {}),
    },
    bestPracticeVersion: {
      ...bestPracticeVersion,
      improvements: asArray(bestPracticeVersion.improvements),
      benefits: asArray(bestPracticeVersion.benefits),
    },
    commonMistakes: {
      ...commonMistakes,
      mistakes: asArray(commonMistakes.mistakes),
    },
    realWorldImplementation: {
      ...realWorldImplementation,
      features: asArray(realWorldImplementation.features),
    },
    codeSummary: {
      ...codeSummary,
      keyTakeaways: asArray(codeSummary.keyTakeaways),
      nextSteps: asArray(codeSummary.nextSteps),
    },
  };
}`
);

// Update Visual Section
content = content.replace(
  /function transformVisualSection\(content: JsonRecord\): JsonRecord \{[\s\S]*?visualSummary: \{[\s\S]*?examVisualChecklist: asArray\(visualSummary\.examVisualChecklist\),[\s\S]*?\},[\s\S]*?\};[\s\S]*?\}/,
  `function transformVisualSection(content: JsonRecord): JsonRecord {
  const conceptVisualIntro = asRecord(content.conceptVisualIntro);
  const diagrammaticBreakdown = asRecord(content.diagrammaticBreakdown);
  const stepByStepVisualFlow = asRecord(content.stepByStepVisualFlow);
  const comparativeVisualization = asRecord(content.comparativeVisualization);
  const mentalModelVisualization = asRecord(content.mentalModelVisualization);
  const realWorldVisualMapping = asRecord(content.realWorldVisualMapping);
  const commonConfusionVisualization = asRecord(content.commonConfusionVisualization);
  const visualSummary = asRecord(content.visualSummary);

  return {
    ...content,
    conceptVisualIntro: {
      ...conceptVisualIntro,
      ...(normalizeSvgAsset(conceptVisualIntro.image) ? { image: normalizeSvgAsset(conceptVisualIntro.image) } : {}),
    },
    diagrammaticBreakdown: {
      ...diagrammaticBreakdown,
      componentLabels: asArray(diagrammaticBreakdown.componentLabels),
      stepMarkers: asArray(diagrammaticBreakdown.stepMarkers),
      technicalTooltips: asArray(diagrammaticBreakdown.technicalTooltips),
      ...(normalizeSvgAsset(diagrammaticBreakdown.image) ? { image: normalizeSvgAsset(diagrammaticBreakdown.image) } : {}),
    },
    stepByStepVisualFlow: {
      ...stepByStepVisualFlow,
      steps: asArray(stepByStepVisualFlow.steps),
      phaseExplanations: asArray(stepByStepVisualFlow.phaseExplanations),
      ...(normalizeSvgAsset(stepByStepVisualFlow.image) ? { image: normalizeSvgAsset(stepByStepVisualFlow.image) } : {}),
    },
    comparativeVisualization: {
      ...comparativeVisualization,
      differenceHighlights: asArray(comparativeVisualization.differenceHighlights),
      ...(normalizeSvgAsset(comparativeVisualization.image) ? { image: normalizeSvgAsset(comparativeVisualization.image) } : {}),
    },
    mentalModelVisualization: {
      ...mentalModelVisualization,
      nodes: asArray(asRecord(mentalModelVisualization.frameworkMap).nodes),
      connections: asArray(asRecord(mentalModelVisualization.frameworkMap).connections),
      ...(normalizeSvgAsset(mentalModelVisualization.image) ? { image: normalizeSvgAsset(mentalModelVisualization.image) } : {}),
    },
    realWorldVisualMapping: {
      ...realWorldVisualMapping,
      practicalScenarios: asArray(realWorldVisualMapping.practicalScenarios),
      ...(normalizeSvgAsset(realWorldVisualMapping.image) ? { image: normalizeSvgAsset(realWorldVisualMapping.image) } : {}),
    },
    commonConfusionVisualization: {
      ...commonConfusionVisualization,
      confusionItems: asArray(commonConfusionVisualization.confusionItems),
      faqItems: asArray(commonConfusionVisualization.faqItems),
      ...(normalizeSvgAsset(commonConfusionVisualization.image) ? { image: normalizeSvgAsset(commonConfusionVisualization.image) } : {}),
    },
    visualSummary: {
      ...visualSummary,
      keyVisualTakeaways: asArray(visualSummary.keyVisualTakeaways),
      examVisualChecklist: asArray(visualSummary.examVisualChecklist),
      ...(normalizeSvgAsset(visualSummary.image) ? { image: normalizeSvgAsset(visualSummary.image) } : {}),
    },
  };
}`
);

// Update Summary Section
content = content.replace(
  /function transformSummarySection\(content: JsonRecord, subtopicName: string\): JsonRecord \{[\s\S]*?masteryRecapCard: content\.masteryRecapCard ?? content\.mastery_recap_card ?? \{\},[\s\S]*?nextStepPanel: content\.nextStepPanel ?? content\.next_step_panel ?? \{\},[\s\S]*?\}/,
  `function transformSummarySection(content: JsonRecord, subtopicName: string): JsonRecord {
  const masteryRecapCard = asRecord(content.masteryRecapCard ?? content.mastery_recap_card);
  const nextStepPanel = asRecord(content.nextStepPanel ?? content.next_step_panel);

  return {
    title: asString(content.title, \`\${subtopicName} Summary\`),
    description: asString(content.description, \`Review the most important points about \${subtopicName}.\`),
    masteryRecapCard: {
      ...masteryRecapCard,
      ...(normalizeSvgAsset(masteryRecapCard.heroAsset) ? { heroAsset: normalizeSvgAsset(masteryRecapCard.heroAsset) } : {}),
    },
    keyTakeawayGrid: asArray(content.keyTakeawayGrid ?? content.key_takeaway_grid),
    revisionChecklist: asArray(content.revisionChecklist ?? content.revision_checklist),
    nextStepPanel: {
      ...nextStepPanel,
      actions: asArray(nextStepPanel.actions),
    },
  };
}`
);

fs.writeFileSync(filePath, content);
console.log('Successfully updated transformers.');
