#!/usr/bin/env node

/**
 * Add Subtopic Content Script
 * 
 * This script directly adds a new subtopic to the registry without needing UI automation.
 * It generates the AI prompt, shows you what to paste to AI, then helps you add the response.
 * 
 * Usage: node scripts/add-subtopic-content.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const CONFIG = {
  domain: 'Full Stack Development',
  subject: 'Front End Development',
  topic: 'JavaScript',
  subtopic: 'What is JavaScript?',
  subtopicId: 'whatisjavascript',
  section: 'notes', // Which section to add
  
  // File paths
  registryPath: path.join(__dirname, '../src/share-branding/subtopicContentRegistry.ts'),
  
  // URLs
  baseUrl: 'http://localhost:3003',
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Generate the AI prompt for the Notes section
 */
function generateNotesPrompt() {
  return `Generate content for the NOTES SECTION

**Educational Hierarchy:**
- Domain: ${CONFIG.domain}
- Subject: ${CONFIG.subject}
- Topic: ${CONFIG.topic}
- Subtopic: ${CONFIG.subtopic}

Generate detailed content specifically for the subtopic: "${CONFIG.subtopic}"

This section has 8 templates. Output in this EXACT JSON format:

{
  "notes": {
    "coreDefinition": {
      "badge": "Core Concept",
      "headline": "[What is ${CONFIG.subtopic}?]",
      "definition": "[Technical definition in 1-2 sentences]",
      "simpleExplanation": "[Explain in simple terms, 2-3 sentences]",
      "whyItMatters": "[Why is this important? 2-3 sentences]",
      "keyTakeaway": "[One sentence summary]"
    },
    "conceptExplanation": {
      "title": "Understanding ${CONFIG.subtopic}",
      "introduction": "[2-3 sentences introducing the concept]",
      "mainConcept": "[Detailed explanation, 4-5 sentences]",
      "detailedBreakdown": "[Break down the concept into parts, 4-5 sentences]",
      "visualAnalogy": "[A simple analogy to understand this, 2-3 sentences]"
    },
    "keyComponents": {
      "title": "Key Components of ${CONFIG.subtopic}",
      "components": [
        {
          "id": "comp1",
          "name": "[Component 1 name]",
          "description": "[What it does, 2 sentences]",
          "purpose": "[Why it's needed, 1 sentence]",
          "icon": "Box"
        },
        {
          "id": "comp2",
          "name": "[Component 2 name]",
          "description": "[What it does, 2 sentences]",
          "purpose": "[Why it's needed, 1 sentence]",
          "icon": "Layers"
        },
        {
          "id": "comp3",
          "name": "[Component 3 name]",
          "description": "[What it does, 2 sentences]",
          "purpose": "[Why it's needed, 1 sentence]",
          "icon": "Zap"
        }
      ]
    },
    "syntaxStructure": {
      "title": "Syntax and Structure",
      "syntaxTitle": "Basic Syntax",
      "code": "[Actual code example with \\\\n for newlines]",
      "language": "javascript",
      "explanation": "[Explain the syntax, 3-4 sentences]",
      "breakdown": [
        {
          "line": "[Code line 1]",
          "explanation": "[What this line does]"
        },
        {
          "line": "[Code line 2]",
          "explanation": "[What this line does]"
        },
        {
          "line": "[Code line 3]",
          "explanation": "[What this line does]"
        }
      ]
    },
    "examples": {
      "title": "Practical Examples",
      "exampleCards": [
        {
          "id": "ex1",
          "title": "[Example 1 title]",
          "scenario": "[Real-world scenario, 2 sentences]",
          "code": "[Code example with \\\\n for newlines]",
          "explanation": "[How it works, 2-3 sentences]"
        },
        {
          "id": "ex2",
          "title": "[Example 2 title]",
          "scenario": "[Real-world scenario, 2 sentences]",
          "code": "[Code example with \\\\n for newlines]",
          "explanation": "[How it works, 2-3 sentences]"
        }
      ]
    },
    "bestPractices": {
      "title": "Best Practices",
      "practices": [
        {
          "id": "bp1",
          "title": "[Practice 1 title]",
          "description": "[Why this is important, 2 sentences]",
          "doExample": "[Good example, 1 sentence]",
          "dontExample": "[Bad example to avoid, 1 sentence]"
        },
        {
          "id": "bp2",
          "title": "[Practice 2 title]",
          "description": "[Why this is important, 2 sentences]",
          "doExample": "[Good example, 1 sentence]",
          "dontExample": "[Bad example to avoid, 1 sentence]"
        },
        {
          "id": "bp3",
          "title": "[Practice 3 title]",
          "description": "[Why this is important, 2 sentences]",
          "doExample": "[Good example, 1 sentence]",
          "dontExample": "[Bad example to avoid, 1 sentence]"
        }
      ]
    },
    "commonErrors": {
      "title": "Common Mistakes and FAQs",
      "errors": [
        {
          "id": "err1",
          "error": "[Common mistake 1]",
          "why": "[Why this happens]",
          "fix": "[How to fix it]"
        },
        {
          "id": "err2",
          "error": "[Common mistake 2]",
          "why": "[Why this happens]",
          "fix": "[How to fix it]"
        },
        {
          "id": "err3",
          "error": "[Common mistake 3]",
          "why": "[Why this happens]",
          "fix": "[How to fix it]"
        }
      ],
      "faqItems": [
        {
          "id": "faq1",
          "question": "[Common question 1]",
          "answer": "[Clear answer, 2-3 sentences]"
        },
        {
          "id": "faq2",
          "question": "[Common question 2]",
          "answer": "[Clear answer, 2-3 sentences]"
        },
        {
          "id": "faq3",
          "question": "[Common question 3]",
          "answer": "[Clear answer, 2-3 sentences]"
        }
      ]
    },
    "revisionSummary": {
      "title": "Quick Revision Summary",
      "keyPoints": [
        "[Key point 1]",
        "[Key point 2]",
        "[Key point 3]",
        "[Key point 4]",
        "[Key point 5]"
      ],
      "quickRecap": [
        "[Recap point 1]",
        "[Recap point 2]",
        "[Recap point 3]"
      ],
      "examTips": [
        "[Exam tip 1]",
        "[Exam tip 2]"
      ],
      "rememberThis": "[One memorable sentence to remember this concept]"
    }
  }
}

**IMPORTANT**: 
- Replace ALL [...] placeholders with actual content
- Use \\\\n for newlines in code
- Use \\\\" for quotes in code
- Icon names: Box, Layers, Zap, Code2, CheckCircle, AlertCircle, Lightbulb, Rocket`;
}

/**
 * Transform AI JSON to Registry format
 */
function transformAIJsonToRegistry(aiJson) {
  const notes = aiJson.notes;
  
  return {
    simpleWords: `${CONFIG.subtopic} in ${CONFIG.topic}`,
    
    // Template 1: Core Definition Block
    definitionBlock: {
      badge: notes.coreDefinition.badge,
      headline: notes.coreDefinition.headline,
      definitionText: notes.coreDefinition.definition,
      importanceCallout: notes.coreDefinition.whyItMatters,
      quickSummary: [
        notes.coreDefinition.simpleExplanation,
        notes.coreDefinition.keyTakeaway
      ]
    },
    
    // Template 2: Concept Explanation (sections array)
    sections: [
      {
        id: 's1',
        title: notes.conceptExplanation.title,
        content: `${notes.conceptExplanation.introduction}\n\n${notes.conceptExplanation.mainConcept}\n\n${notes.conceptExplanation.detailedBreakdown}`,
        keyPoint: notes.conceptExplanation.visualAnalogy
      }
    ],
    
    // Template 3: Component Grid
    componentGrid: {
      gridTitle: notes.keyComponents.title,
      componentCards: notes.keyComponents.components.map(comp => ({
        id: comp.id,
        title: comp.name,
        description: comp.description,
        icon: comp.icon,
        subcomponents: [comp.purpose] // Simplified
      }))
    },
    
    // Template 4: Example Panel (combining syntax and examples)
    examplePanel: {
      exampleTitle: notes.syntaxStructure.title,
      scenarios: [
        {
          id: 'sc1',
          title: notes.syntaxStructure.syntaxTitle,
          scenarioDescription: notes.syntaxStructure.explanation,
          practicalSolution: notes.syntaxStructure.code,
          industryContext: 'Basic syntax pattern used in all modern applications'
        },
        ...notes.examples.exampleCards.map((ex, idx) => ({
          id: `sc${idx + 2}`,
          title: ex.title,
          scenarioDescription: ex.scenario,
          practicalSolution: ex.code,
          industryContext: ex.explanation
        }))
      ]
    },
    
    // Template 5: Practice Card (Best Practices)
    practiceCard: {
      bestPracticeTitle: notes.bestPractices.title,
      recommendations: notes.bestPractices.practices.map(bp => ({
        id: bp.id,
        title: bp.title,
        description: `${bp.description} Do: ${bp.doExample} Don't: ${bp.dontExample}`
      })),
      optimizationTips: ['Follow industry standards', 'Write clean, maintainable code'],
      industryStandards: ['Use consistent naming conventions', 'Follow best practices']
    },
    
    // Template 6: Warning/FAQ Card
    warningFaq: {
      commonErrors: notes.commonErrors.errors.map(err => ({
        id: err.id,
        error: err.error,
        solution: `${err.why} ${err.fix}`
      })),
      faqItems: notes.commonErrors.faqItems,
      misconceptionAlerts: ['Review common mistakes carefully', 'Practice to avoid errors']
    },
    
    // Template 7: Summary Card
    summaryCard: {
      summaryTitle: notes.revisionSummary.title,
      keyTakeaways: notes.revisionSummary.keyPoints,
      revisionChecklist: notes.revisionSummary.quickRecap.map((item, idx) => ({
        id: `rc${idx + 1}`,
        item: item,
        checked: false
      })),
      memoryReinforcement: notes.revisionSummary.rememberThis,
      examTips: notes.revisionSummary.examTips
    }
  };
}

/**
 * Generate TypeScript code for the registry entry
 */
function generateRegistryCode(transformedData) {
  return `
  '${CONFIG.subtopicId}': ${JSON.stringify(transformedData, null, 4).replace(/"([^"]+)":/g, '$1:')},`;
}

/**
 * Main workflow
 */
async function main() {
  console.log('\n🚀 Subtopic Content Addition Tool');
  console.log('=====================================\n');
  console.log(`Domain: ${CONFIG.domain}`);
  console.log(`Subject: ${CONFIG.subject}`);
  console.log(`Topic: ${CONFIG.topic}`);
  console.log(`Subtopic: ${CONFIG.subtopic}`);
  console.log(`Subtopic ID: ${CONFIG.subtopicId}`);
  console.log(`Section: ${CONFIG.section}\n`);
  
  // Step 1: Generate and show the AI prompt
  console.log('📝 Step 1: AI Prompt Generated\n');
  console.log('Copy the prompt below and paste it to your AI (ChatGPT, Claude, etc.):\n');
  console.log('─'.repeat(80));
  console.log(generateNotesPrompt());
  console.log('─'.repeat(80));
  console.log('\n');
  
  // Step 2: Get AI response from user
  console.log('📥 Step 2: Paste AI Response\n');
  console.log('After getting the AI response, paste the JSON here.');
  console.log('Paste the complete JSON and press Enter, then type "END" on a new line:\n');
  
  let jsonInput = '';
  let line;
  
  while ((line = await question('')) !== 'END') {
    jsonInput += line + '\n';
  }
  
  console.log('\n✓ JSON received\n');
  
  // Step 3: Parse and transform
  console.log('🔄 Step 3: Transforming JSON...\n');
  
  let aiJson;
  try {
    aiJson = JSON.parse(jsonInput);
    console.log('✓ JSON parsed successfully');
  } catch (error) {
    console.error('✗ Invalid JSON:', error.message);
    rl.close();
    process.exit(1);
  }
  
  const transformedData = transformAIJsonToRegistry(aiJson);
  console.log('✓ JSON transformed to registry format\n');
  
  // Step 4: Show the code to add
  console.log('📋 Step 4: Registry Code Generated\n');
  console.log('Add this code to subtopicContentRegistry.ts:\n');
  console.log('─'.repeat(80));
  console.log(generateRegistryCode(transformedData));
  console.log('─'.repeat(80));
  console.log('\n');
  
  // Step 5: Offer to write to file
  const shouldWrite = await question('Would you like me to add this to the registry file automatically? (yes/no): ');
  
  if (shouldWrite.toLowerCase() === 'yes' || shouldWrite.toLowerCase() === 'y') {
    console.log('\n📝 Writing to registry file...\n');
    
    try {
      const registryContent = fs.readFileSync(CONFIG.registryPath, 'utf8');
      
      // Find the closing brace of the registry
      const insertPosition = registryContent.lastIndexOf('};');
      
      if (insertPosition === -1) {
        throw new Error('Could not find insertion point in registry file');
      }
      
      const newContent = 
        registryContent.slice(0, insertPosition) +
        generateRegistryCode(transformedData) +
        '\n' +
        registryContent.slice(insertPosition);
      
      fs.writeFileSync(CONFIG.registryPath, newContent, 'utf8');
      
      console.log('✓ Registry file updated successfully!\n');
    } catch (error) {
      console.error('✗ Error writing to file:', error.message);
      console.log('\nPlease add the code manually to the registry file.\n');
    }
  } else {
    console.log('\n→ Please add the code manually to the registry file.\n');
  }
  
  // Step 6: Show the URL
  const pageUrl = `${CONFIG.baseUrl}/start-learning/subtopic/${CONFIG.subtopicId}`;
  console.log('🌐 Step 5: View Your Page\n');
  console.log(`URL: ${pageUrl}\n`);
  console.log('✅ Done! Open the URL above to view your subtopic page.\n');
  
  rl.close();
}

// Run
main().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
