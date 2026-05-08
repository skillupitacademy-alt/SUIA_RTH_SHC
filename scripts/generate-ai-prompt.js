#!/usr/bin/env node

/**
 * Generate AI Prompt for Content Creation
 * 
 * Simple script that generates the AI prompt for any section.
 * Just run it and copy the output to your AI tool.
 * 
 * Usage: node scripts/generate-ai-prompt.js
 */

// Configuration - EDIT THESE VALUES
const CONFIG = {
  domain: 'Full Stack Development',
  subject: 'Front End Development',
  topic: 'JavaScript',
  subtopic: 'What is JavaScript?',
  section: 'notes' // Options: notes, layman, reallife, technical, code, assignment, project, quiz, visual, practice
};

/**
 * Generate prompt for Notes section
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
 * Main function
 */
function main() {
  console.log('\n📝 AI Prompt Generator');
  console.log('======================\n');
  console.log(`Domain: ${CONFIG.domain}`);
  console.log(`Subject: ${CONFIG.subject}`);
  console.log(`Topic: ${CONFIG.topic}`);
  console.log(`Subtopic: ${CONFIG.subtopic}`);
  console.log(`Section: ${CONFIG.section}\n`);
  console.log('Copy the prompt below and paste it to your AI:\n');
  console.log('─'.repeat(80));
  console.log(generateNotesPrompt());
  console.log('─'.repeat(80));
  console.log('\n✅ Prompt generated! Copy and paste to ChatGPT/Claude/etc.\n');
}

main();
