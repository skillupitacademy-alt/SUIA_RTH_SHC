import fs from 'fs';

const filePath = 'd:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin)/tools/prompt-generator/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update getNotesPrompt
const newNotesPromptFunc = `  const getNotesPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => \`Generate content for the NOTES SECTION

**Educational Hierarchy:**
- Domain: \${domainName}
- Subject: \${subjectName}
- Topic: \${topicName}
- Subtopic: \${subtopicName}

Generate detailed content specifically for the subtopic: "\${subtopicName}"

This section uses the **Universal 8-Template Visual Architecture**. Output in this EXACT JSON format:

{
  "notes": {
    "schemaVersion": 1,
    "sectionType": "notes",
    "simpleWords": "[Explain \${subtopicName} in one simple sentence for a beginner]",
    
    "summaryHeroInfographic": {
      "summaryTitle": "[A catchy, premium headline for the subtopic]",
      "image": {
        "type": "inline_svg",
        "name": "hero-infographic",
        "alt": "Visual representation of \${subtopicName}",
        "width": 1200,
        "height": 700,
        "dataUri": ""
      },
      "examTips": ["[Critical exam tip 1]", "[Critical exam tip 2]"],
      "howItWorks": "[1-2 sentence high-level explanation of the mechanism]"
    },

    "conceptMemoryMap": {
      "nodes": [
        { "id": "n1", "label": "[Core Concept]", "description": "[Short detail]" },
        { "id": "n2", "label": "[Supporting Concept 1]", "description": "[Short detail]" },
        { "id": "n3", "label": "[Supporting Concept 2]", "description": "[Short detail]" }
      ],
      "connections": [
        { "from": "n1", "to": "n2", "label": "defines" },
        { "from": "n1", "to": "n3", "label": "enables" }
      ]
    },

    "definitionBlock": {
      "badge": "Core Concept",
      "headline": "What is \${subtopicName}?",
      "definitionText": "[Precise technical definition in 1-2 sentences]",
      "importanceCallout": "[Why this concept is fundamental to \${topicName}]",
      "quickSummary": ["[Key point 1]", "[Key point 2]", "[Key point 3]"]
    },

    "componentGrid": {
      "gridTitle": "Key Components of \${subtopicName}",
      "componentCards": [
        { "id": "c1", "title": "[Part 1]", "description": "[Detailed description]", "icon": "Box", "subcomponents": ["[Sub-part A]", "[Sub-part B]"] },
        { "id": "c2", "title": "[Part 2]", "description": "[Detailed description]", "icon": "Layers", "subcomponents": ["[Sub-part C]"] },
        { "id": "c3", "title": "[Part 3]", "description": "[Detailed description]", "icon": "Zap", "subcomponents": ["[Sub-part D]"] }
      ]
    },

    "syntaxBlock": {
      "title": "SYNTAX BLOCK",
      "subtitle": "[Language/Pattern] Syntax",
      "code": "[Clean, formatted code snippet using \\\\\\\\n for newlines]",
      "language": "javascript",
      "explanations": [
        { "id": "s1", "term": "[Keyword/Symbol]", "explanation": "[What it does]" },
        { "id": "s2", "term": "[Keyword/Symbol]", "explanation": "[What it does]" }
      ]
    },

    "examplePanel": {
      "exampleTitle": "Practical Scenarios",
      "scenarios": [
        { "id": "ex1", "title": "[Scenario 1]", "scenarioDescription": "[Problem context]", "practicalSolution": "[The code/approach used]", "industryContext": "[How this is used in real companies]" },
        { "id": "ex2", "title": "[Scenario 2]", "scenarioDescription": "[Problem context]", "practicalSolution": "[The code/approach used]", "industryContext": "[How this is used in real companies]" }
      ]
    },

    "practiceCard": {
      "bestPracticeTitle": "Best Practices & Optimization",
      "recommendations": [
        { "id": "p1", "title": "[Standard Practice]", "description": "[Explanation of why]" }
      ],
      "optimizationTips": ["[Performance tip 1]", "[Readability tip 1]"],
      "industryStandards": ["[Standard 1 (e.g. SOLID, DRY)]"]
    },

    "warningFaq": {
      "commonErrors": [
        { "id": "err1", "error": "[Common mistake]", "solution": "[How to fix it]" }
      ],
      "faqItems": [
        { "id": "faq1", "question": "[Top learner question?]", "answer": "[Clear answer]" }
      ],
      "misconceptionAlerts": ["[Common myth to avoid]"]
    },

    "summaryCard": {
      "summaryTitle": "Revision Dashboard",
      "keyTakeaways": ["[Recap 1]", "[Recap 2]"],
      "revisionChecklist": [
        { "id": "ch1", "item": "[Concept to verify]", "checked": false }
      ],
      "memoryReinforcement": "[One sentence memory hook]",
      "examTips": ["[High-yield exam tip]"]
    },

    "footerBlock": {
      "finalNote": "[Final encouraging note about \${subtopicName}]",
      "nextStepLabel": "[Title of the next logical subtopic]",
      "nextStepTarget": "[URL slug of next subtopic]"
    }
  }
}

**IMPORTANT**: 
- Replace ALL [...] placeholders with actual content
- Use \\\\\\\\n for newlines in code
- Use \\\\\\\\" for quotes in code
- Icon names: Box, Layers, Zap, Code2, CheckCircle, AlertCircle, Lightbulb, Rocket\`;`;

const lines = content.split('\n');
let funcStart = -1;
let funcEnd = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const getNotesPrompt =')) {
        funcStart = i;
        // Find end of function (the backtick close)
        for (let j = i; j < lines.length; j++) {
            if (lines[j].includes('Rocket`;')) {
                funcEnd = j;
                break;
            }
        }
        break;
    }
}

if (funcStart !== -1 && funcEnd !== -1) {
    lines.splice(funcStart, funcEnd - funcStart + 1, newNotesPromptFunc);
    console.log(`Updated getNotesPrompt (lines \${funcStart + 1} to \${funcEnd + 1})`);
} else {
    console.error('Could not find getNotesPrompt function');
    process.exit(1);
}

// 2. Update Strict Template for Notes
const newStrictTemplate = `      notes: {
        notes: {
          ...base,
          simpleWords: \`Simple explanation of \${subtopicName}.\`,
          summaryHeroInfographic: {
            summaryTitle: subtopicName,
            image: { type: 'inline_svg', name: 'hero', alt: 'Hero', width: 1200, height: 700, dataUri: '' },
            examTips: ['Tip 1'],
            howItWorks: 'Mechanism description.'
          },
          conceptMemoryMap: {
            nodes: [{ id: 'n1', label: 'Core', description: 'Detail' }],
            connections: [{ from: 'n1', to: 'n1', label: 'links' }]
          },
          definitionBlock: {
            badge: 'Core Concept',
            headline: \`What is \${subtopicName}?\`,
            definitionText: 'Precise definition.',
            importanceCallout: 'Why it matters.',
            quickSummary: ['Summary point 1'],
          },
          componentGrid: {
            gridTitle: 'Key Components',
            componentCards: [
              { id: 'comp1', title: 'Component 1', description: 'Description.', icon: 'Box', subcomponents: ['Part 1'] },
            ],
          },
          syntaxBlock: {
            title: 'SYNTAX BLOCK',
            subtitle: 'Syntax',
            code: 'const x = 1;',
            language: 'javascript',
            explanations: [{ id: 's1', term: 'const', explanation: 'variable' }]
          },
          examplePanel: {
            exampleTitle: 'Practical Examples',
            scenarios: [
              { id: 'ex1', title: 'Example 1', scenarioDescription: 'Scenario.', practicalSolution: 'Solution.', industryContext: 'Industry context.' },
            ],
          },
          practiceCard: {
            bestPracticeTitle: 'Best Practices',
            recommendations: [{ id: 'bp1', title: 'Practice 1', description: 'Description.' }],
            optimizationTips: ['Tip 1'],
            industryStandards: ['Standard 1'],
          },
          warningFaq: {
            commonErrors: [{ id: 'err1', error: 'Mistake.', solution: 'Fix.' }],
            faqItems: [{ id: 'faq1', question: 'Question?', answer: 'Answer.' }],
            misconceptionAlerts: ['Misconception to avoid.'],
          },
          summaryCard: {
            summaryTitle: 'Quick Revision Summary',
            keyTakeaways: ['Takeaway 1'],
            revisionChecklist: [{ id: 'check1', item: 'Review item.', checked: false }],
            memoryReinforcement: 'Memory hook.',
            examTips: ['Exam tip 1'],
          },
          footerBlock: {
            finalNote: 'Final note.',
            nextStepLabel: 'Next Step',
            nextStepTarget: '/next'
          }
        },
      },`;

let strictStart = -1;
let strictEnd = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'notes: {' && lines[i+1]?.trim() === 'notes: {') {
        strictStart = i;
        // Find closing brace of notes section in templates object
        let openBraces = 0;
        for (let j = i; j < lines.length; j++) {
            if (lines[j].includes('{')) openBraces += (lines[j].match(/{/g) || []).length;
            if (lines[j].includes('}')) openBraces -= (lines[j].match(/}/g) || []).length;
            if (openBraces === 0) {
                strictEnd = j;
                break;
            }
        }
        break;
    }
}

if (strictStart !== -1 && strictEnd !== -1) {
    lines.splice(strictStart, strictEnd - strictStart + 1, newStrictTemplate);
    console.log(`Updated Strict Template for Notes (lines \${strictStart + 1} to \${strictEnd + 1})`);
} else {
    console.error('Could not find strict template for notes');
    process.exit(1);
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log('Prompt Generator updated successfully');
