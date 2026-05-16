import fs from 'fs';

const filePath = 'd:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin)/tools/prompt-generator/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const imagePlaceholder = "{ type: 'inline_svg', name: 'visual-asset', alt: 'Visual asset', width: 1200, height: 700, dataUri: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' }";

// Update Technical Template
content = content.replace(
  /sections: \[\s+\{ id: 'tech1', title: 'Technical Section', content: 'Detailed technical content\.', diagram: \{ type: 'flow', data: \{ label: 'Flow' \} \}, code: \{ language: 'javascript', code: 'console\.log\("technical"\);', output: 'technical' \}, keyPoints: \['Key point'\], steps: \[\{ id: 'step1', text: 'Step text\.' \}\], highlight: 'Important highlight\.' \},\s+\],/,
  `sections: [
            { id: 'tech1', title: 'Technical Section', content: 'Detailed technical content.', diagramAsset: ${imagePlaceholder}, code: { language: 'javascript', code: 'console.log("technical");', output: 'technical' }, keyPoints: ['Key point'], steps: [{ id: 'step1', text: 'Step text.' }], highlight: 'Important highlight.' },
          ],`
);

// Update Code Template
content = content.replace(
  /outputDemonstration: \{ title: 'Output Demonstration', input: 'Input\.', output: 'Output\.', explanation: 'Explanation\.', visualRepresentation: 'Visual representation\.' \},/,
  `outputDemonstration: { title: 'Output Demonstration', input: 'Input.', output: 'Output.', explanation: 'Explanation.', previewAsset: ${imagePlaceholder} },`
);

// Update Summary Template
content = content.replace(
  /masteryRecapCard: \{ headline: 'What You Should Know Now', recap: 'Recap\.', confidenceSignal: 'Confidence signal\.' \},/,
  `masteryRecapCard: { headline: 'What You Should Know Now', recap: 'Recap.', confidenceSignal: 'Confidence signal.', heroAsset: ${imagePlaceholder} },`
);

// Update Visual Template (Multiple replacements)
content = content.replace(
  /conceptVisualIntro: \{ badge: 'Visual', headline: \`\${subtopicName\} Visually\`, visualDefinition: 'Visual definition\.', heroDiagramPreview: 'Diagram preview\.', importanceBlock: 'Importance\.', progressIndicator: 'Progress note\.' \},/,
  `conceptVisualIntro: { badge: 'Visual', headline: \`\${subtopicName} Visually\`, visualDefinition: 'Visual definition.', image: ${imagePlaceholder}, importanceBlock: 'Importance.', progressIndicator: 'Progress note.' },`
);

content = content.replace(
  /diagrammaticBreakdown: \{ title: 'Diagrammatic Breakdown', diagramTitle: 'Diagram', componentLabels: \[\{ id: 'A', label: 'Part A', description: 'Description\.' \}\], stepMarkers: \['Step marker'\], technicalTooltips: \[\{ id: 'tip1', term: 'Term', explanation: 'Explanation\.' \}\] \},/,
  `diagrammaticBreakdown: { title: 'Diagrammatic Breakdown', diagramTitle: 'Diagram', componentLabels: [{ id: 'A', label: 'Part A', description: 'Description.' }], stepMarkers: ['Step marker'], technicalTooltips: [{ id: 'tip1', term: 'Term', explanation: 'Explanation.' }], image: ${imagePlaceholder} },`
);

content = content.replace(
  /stepByStepVisualFlow: \{ title: 'Step-by-Step Visual Flow', sequenceTitle: 'Flow', steps: \[\{ id: 'step1', stepNumber: 1, title: 'Step', description: 'Description\.', visualCue: 'Cue\.' \}\], phaseExplanations: \['Phase explanation'\] \},/,
  `stepByStepVisualFlow: { title: 'Step-by-Step Visual Flow', sequenceTitle: 'Flow', steps: [{ id: 'step1', stepNumber: 1, title: 'Step', description: 'Description.', visualCue: 'Cue.' }], phaseExplanations: ['Phase explanation'], image: ${imagePlaceholder} },`
);

fs.writeFileSync(filePath, content);
console.log('Successfully updated prompt templates.');
