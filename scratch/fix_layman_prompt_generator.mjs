import fs from 'fs';

const filePath = 'd:/onlinewebsites/quiz-platform/apps/skillhubcore-admin/src/app/(admin)/tools/prompt-generator/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update getLaymanPrompt
const newLaymanPromptFunc = `  const getLaymanPrompt = (domainName: string, subjectName: string, topicName: string, subtopicName: string) => \`Generate content for the LAYMAN SECTION

**Educational Hierarchy:**
- Domain: \${domainName}
- Subject: \${subjectName}
- Topic: \${topicName}
- Subtopic: \${subtopicName}

Generate detailed content specifically for the subtopic: "\${subtopicName}"

This section uses the **Universal 8-Template Layman Architecture**. Output in this EXACT JSON format:

{
  "layman": {
    "schemaVersion": 1,
    "sectionType": "layman",
    
    "simpleOverview": {
      "badge": "LAYMAN SECTION",
      "headline": "What is \${subtopicName}?",
      "simpleDefinition": "[Short, bold definition sentence]",
      "subExplanation": "[2-3 sentences explaining what it adds or how it behaves]",
      "image": {
        "type": "inline_svg",
        "name": "overview-visual",
        "alt": "Visual overview of \${subtopicName}",
        "width": 1200,
        "height": 700,
        "dataUri": ""
      },
      "inShort": "[Memorable 1-sentence 'In short' summary]"
    },

    "everydayAnalogy": {
      "title": "Everyday Analogy",
      "analogyTitle": "[Real Life Analogy Name, e.g. The Remote Control]",
      "analogyExplanation": "Think of \${subtopicName} as the [Analogy] of your [Context].",
      "comparisonPoints": [
        { "label": "[Part 1]", "comparison": "[How it relates to \${subtopicName}]" },
        { "label": "[Part 2]", "comparison": "[How it relates to \${subtopicName}]" },
        { "label": "[Part 3]", "comparison": "[How it relates to \${subtopicName}]" }
      ],
      "analogyInsight": "[MEMORABLE INSIGHT: Without the analogy, what happens?]",
      "image": {
        "type": "inline_svg",
        "name": "analogy-visual",
        "alt": "Analogy illustration",
        "width": 600,
        "height": 400,
        "dataUri": ""
      }
    },

    "whyItExists": {
      "sectionTitle": "Why It Exists",
      "benefitCards": [
        { "id": "b1", "title": "[Benefit 1]", "description": "[Short detail]", "icon": "Zap" },
        { "id": "b2", "title": "[Benefit 2]", "description": "[Short detail]", "icon": "Settings" },
        { "id": "b3", "title": "[Benefit 3]", "description": "[Short detail]", "icon": "Rocket" }
      ]
    },

    "simpleUseCases": {
      "gridTitle": "Simple Use Cases",
      "useCaseCards": [
        { "id": "u1", "title": "[Use Case 1]", "description": "[Short description]", "icon": "ShoppingCart" },
        { "id": "u2", "title": "[Use Case 2]", "description": "[Short description]", "icon": "ClipboardList" },
        { "id": "u3", "title": "[Use Case 3]", "description": "[Short description]", "icon": "Moon" },
        { "id": "u4", "title": "[Use Case 4]", "description": "[Short description]", "icon": "Image" },
        { "id": "u5", "title": "[Use Case 5]", "description": "[Short description]", "icon": "MessageCircle" },
        { "id": "u6", "title": "[Use Case 6]", "description": "[Short description]", "icon": "Gamepad2" }
      ]
    },

    "beginnerBreakdown": {
      "title": "Beginner Breakdown (How It Works)",
      "steps": [
        { "id": "s1", "title": "[Step 1 Name]", "description": "[What happens in this step]", "icon": "Terminal" },
        { "id": "s2", "title": "[Step 2 Name]", "description": "[What happens in this step]", "icon": "Cpu" },
        { "id": "s3", "title": "[Step 3 Name]", "description": "[What happens in this step]", "icon": "Settings" },
        { "id": "s4", "title": "[Step 4 Name]", "description": "[What happens in this step]", "icon": "Monitor" }
      ]
    },

    "mentalModel": {
      "title": "Mental Model (Big Picture)",
      "nodes": [
        { "id": "n1", "label": "User", "type": "actor" },
        { "id": "n2", "label": "\${subtopicName}", "type": "concept" },
        { "id": "n3", "label": "Result", "type": "output" }
      ],
      "connections": [
        { "from": "n1", "to": "n2", "label": "Action" },
        { "from": "n2", "to": "n3", "label": "Updates" }
      ],
      "toolsAndServices": [
        { "id": "t1", "label": "[Tool 1]", "icon": "Cloud" },
        { "id": "t2", "label": "[Tool 2]", "icon": "Database" },
        { "id": "t3", "label": "[Tool 3]", "icon": "Settings" }
      ],
      "footerNote": "[\${subtopicName} is the connector between you and the result!]"
    },

    "commonConfusions": {
      "title": "Common Confusions",
      "faqItems": [
        { "id": "f1", "question": "[Common Question 1]?", "answer": "[Clear answer]" },
        { "id": "f2", "question": "[Common Question 2]?", "answer": "[Clear answer]" }
      ]
    },

    "simpleRecap": {
      "title": "Simple Recap",
      "keyTakeaways": [
        "[Recap Point 1]",
        "[Recap Point 2]",
        "[Recap Point 3]"
      ],
      "rememberThis": {
        "title": "Remember This!",
        "concept": "\${subtopicName}",
        "formula": "[Part A] + [Part B] = [Success]",
        "summary": "[Final catchy summary sentence]"
      }
    },

    "footerBlock": {
      "quote": "[\${subtopicName} turns 'static' ideas into 'interactive' experiences!]",
      "finalNote": "[Final tagline for the subtopic]"
    }
  }
}

**STRICT RULES**: 
- Replace ALL [...] placeholders with actual content.
- Icon names: Zap, Settings, Rocket, ShoppingCart, ClipboardList, Moon, Image, MessageCircle, Gamepad2, Terminal, Cpu, Monitor, Cloud, Database.
- Output valid JSON only.\`;`;

let lines = content.split('\n');
let funcStart = -1;
let funcEnd = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const getLaymanPrompt =')) {
        funcStart = i;
        for (let j = i; j < lines.length; j++) {
            if (lines[j].includes('ShoppingCart, Heart, Lightbulb`;')) {
                funcEnd = j;
                break;
            }
        }
        break;
    }
}

if (funcStart !== -1 && funcEnd !== -1) {
    lines.splice(funcStart, funcEnd - funcStart + 1, newLaymanPromptFunc);
    console.log(`Updated getLaymanPrompt (lines \${funcStart + 1} to \${funcEnd + 1})`);
} else {
    console.error('Could not find getLaymanPrompt function');
    process.exit(1);
}

// 2. Update Strict Template for Layman
const newStrictTemplate = `      layman: {
        layman: {
          ...base,
          simpleOverview: {
            badge: 'LAYMAN SECTION',
            headline: \`What is \${subtopicName}?\`,
            simpleDefinition: 'Simple definition.',
            subExplanation: 'Sub explanation.',
            image: { type: 'inline_svg', name: 'overview', alt: 'Overview', width: 1200, height: 700, dataUri: '' },
            inShort: 'In short summary.'
          },
          everydayAnalogy: {
            title: 'Everyday Analogy',
            analogyTitle: 'Remote Control',
            analogyExplanation: 'Think of it as a remote control.',
            comparisonPoints: [{ label: 'TV', comparison: 'Hardware' }],
            analogyInsight: 'Memory hook.',
            image: { type: 'inline_svg', name: 'analogy', alt: 'Analogy', width: 600, height: 400, dataUri: '' }
          },
          whyItExists: {
            sectionTitle: 'Why It Exists',
            benefitCards: [{ id: 'b1', title: 'Benefit', description: 'Detail', icon: 'Zap' }]
          },
          simpleUseCases: {
            gridTitle: 'Simple Use Cases',
            useCaseCards: [{ id: 'u1', title: 'Case 1', description: 'Detail', icon: 'ShoppingCart' }]
          },
          beginnerBreakdown: {
            title: 'Beginner Breakdown',
            steps: [{ id: 's1', title: 'Step 1', description: 'Detail', icon: 'Terminal' }]
          },
          mentalModel: {
            title: 'Mental Model',
            nodes: [{ id: 'n1', label: 'User', type: 'actor' }],
            connections: [{ from: 'n1', to: 'n1', label: 'Action' }],
            toolsAndServices: [{ id: 't1', label: 'Cloud', icon: 'Cloud' }],
            footerNote: 'Connector note.'
          },
          commonConfusions: {
            title: 'Common Confusions',
            faqItems: [{ id: 'f1', question: 'Question?', answer: 'Answer.' }]
          },
          simpleRecap: {
            title: 'Simple Recap',
            keyTakeaways: ['Takeaway 1'],
            rememberThis: { title: 'Remember This!', concept: subtopicName, formula: 'A+B=C', summary: 'Summary.' }
          },
          footerBlock: {
            quote: 'Quote.',
            finalNote: 'Final tagline.'
          }
        },
      },`;

let strictStart = -1;
let strictEnd = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'layman: {' && lines[i+1]?.trim() === 'layman: {') {
        strictStart = i;
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
    console.log(`Updated Strict Template for Layman (lines \${strictStart + 1} to \${strictEnd + 1})`);
} else {
    console.error('Could not find strict template for layman');
    process.exit(1);
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log('Layman Prompt Generator updated successfully');
