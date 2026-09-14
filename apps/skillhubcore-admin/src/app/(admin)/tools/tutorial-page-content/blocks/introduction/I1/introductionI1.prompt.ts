/**
 * I1 Introduction Block - AI Generation Prompt Template
 *
 * IMPORTANT:
 * The common Tutorial hierarchy and system-metadata rules are
 * provided by the shared prompt infrastructure.
 *
 * This file owns ONLY the I1-specific content contract.
 */

import type { TutorialPromptContext } from '../../../prompts/tutorialPromptContext';
import { buildTutorialPrompt } from '../../../prompts/tutorialPrompt.shared';

/**
 * Generate the AI prompt for I1 introduction block content generation
 */
export function getIntroductionI1Prompt(
  context: TutorialPromptContext
): string {
  return buildTutorialPrompt(
    context,
    `# OUTPUT REQUIREMENTS (Pure JSON Content Contract)

Return ONLY a valid JSON object matching this exact schema:

{
  "expectedTimeSec": 420,
  "page": {
    "badge": "Introduction Block – ${context.topicName} Edition",
    "title": "${context.navigationNodeName}",
    "subtitle": "Concise 1-2 sentence overview explaining the learning journey ahead (2-3 sentences max).",
    "motto": {
      "lines": [
        "Know",
        "Your Path.",
        "Learn with",
        "Purpose."
      ]
    },
    "learningGoal": "Clear statement of what learners will understand or be able to do after this topic (2-3 sentences).",
    "topic": {
      "title": "What is ${context.navigationNodeName}?",
      "description": "2-3 sentence introduction explaining what this topic is and why it matters.",
      "quote": "Short, memorable quote (1-2 sentences) emphasizing importance or insight."
    },
    "whereFit": {
      "title": "Where Does It Fit?",
      "description": "Explain how this topic connects to broader concepts (1-2 sentences).",
      "flowCards": [
        {
          "title": "Foundation Concept",
          "subtitle": "Brief description (1 sentence)",
          "icon": "book-open"
        },
        {
          "title": "Core Topic",
          "subtitle": "Brief description (1 sentence)",
          "icon": "target"
        },
        {
          "title": "${context.navigationNodeName}",
          "subtitle": "Current learning focus (1 sentence)",
          "icon": "code",
          "highlight": true
        },
        {
          "title": "Advanced Application",
          "subtitle": "Brief description (1 sentence)",
          "icon": "rocket"
        },
        {
          "title": "Real-World Impact",
          "subtitle": "Brief description (1 sentence)",
          "icon": "globe"
        }
      ]
    },
    "solution": {
      "title": "The Solution: ${context.navigationNodeName}",
      "description": "Explain what problem this concept solves and how (2-3 sentences).",
      "code": {
        "language": "JavaScript",
        "code": "// Complete, runnable example (8-15 lines)\\n// Demonstrate the core concept clearly\\nfunction example() {\\n  // Implementation\\n  return result;\\n}"
      }
    },
    "whereUsed": {
      "title": "Where Is It Used?",
      "description": "Explain real-world applications of this concept (1-2 sentences).",
      "useCases": [
        {
          "title": "Use Case 1",
          "description": "Brief practical application (1 sentence)",
          "icon": "wrench"
        },
        {
          "title": "Use Case 2",
          "description": "Brief practical application (1 sentence)",
          "icon": "layers",
          "highlight": true
        },
        {
          "title": "Use Case 3",
          "description": "Brief practical application (1 sentence)",
          "icon": "check-circle"
        },
        {
          "title": "Use Case 4",
          "description": "Brief practical application (1 sentence)",
          "icon": "globe",
          "highlight": true
        }
      ]
    },
    "roadmap": {
      "title": "What Will You Learn?",
      "description": "Outline the learning progression (1-2 sentences).",
      "steps": [
        {
          "title": "Step 1: Fundamentals",
          "subtitle": "Core concepts and basics"
        },
        {
          "title": "Step 2: Core Features",
          "subtitle": "Main functionality"
        },
        {
          "title": "Step 3: Practical Patterns",
          "subtitle": "Common use cases"
        },
        {
          "title": "Step 4: Advanced Techniques",
          "subtitle": "Deep understanding"
        },
        {
          "title": "Step 5: Best Practices",
          "subtitle": "Professional application"
        },
        {
          "title": "Step 6: Real Projects",
          "subtitle": "Hands-on mastery"
        }
      ]
    },
    "whyMatters": {
      "title": "Why This Matters",
      "benefits": [
        {
          "title": "Benefit 1",
          "subtitle": "Key advantage (1-2 sentences)",
          "icon": "lightbulb"
        },
        {
          "title": "Benefit 2",
          "subtitle": "Key advantage (1-2 sentences)",
          "icon": "zap"
        },
        {
          "title": "Benefit 3",
          "subtitle": "Key advantage (1-2 sentences)",
          "icon": "target"
        },
        {
          "title": "Benefit 4",
          "subtitle": "Key advantage (1-2 sentences)",
          "icon": "star"
        }
      ]
    },
    "keyTakeaway": "One powerful closing sentence summarizing the essential learning point and its real-world significance."
  }
}

# IMPORTANT: expectedTimeSec METADATA

- expectedTimeSec is BLOCK METADATA at ROOT level
- It MUST NOT appear inside page
- Use a whole positive number representing estimated completion time in seconds
- Example: 420 means 7 minutes (typical for comprehensive introduction)

# ICON REGISTRY (CONTROLLED VOCABULARY)

Use ONLY these approved Lucide icon keys:

- 'book-open' - Reading, learning, documentation
- 'target' - Goals, objectives, precision
- 'lightbulb' - Ideas, innovation, insight
- 'route' - Journey, path, progression
- 'code' - Programming, technical content
- 'layers' - Architecture, abstraction, structure
- 'check-circle' - Completion, validation, correctness
- 'arrow-right' - Direction, flow, progression
- 'graduation-cap' - Education, mastery, achievement
- 'rocket' - Advanced features, deployment, speed
- 'wrench' - Tools, utilities, configuration
- 'globe' - Web, global reach, real-world
- 'zap' - Performance, efficiency, power
- 'star' - Excellence, quality, favorites
- 'box' - Components, modules, packages

DO NOT invent icon names. Use only icons from the list above.

# MOTTO RULES

The motto.lines MUST be exactly 4 strings forming a short, memorable phrase:
- Each line: 2-8 words maximum
- Total combined: Forms an inspirational learning statement
- Style: Handwritten font, appears in mountain illustration
- Purpose: Set tone and motivate learners

Example patterns:
- ["Know", "Your Path.", "Learn with", "Purpose."]
- ["Master", "The Fundamentals.", "Build", "Real Solutions."]
- ["Start", "Simple.", "Grow", "Strong."]

# FLOW CARDS RULES (WHERE DOES IT FIT?)

Generate 3-7 cards showing conceptual progression:
1. Start with broader/foundational concepts
2. Include ONE card with \`"highlight": true\` for the current topic
3. Progress toward advanced/application concepts
4. Each card title: 2-6 words
5. Each card subtitle: 1 sentence (max 10 words)
6. Use diverse, semantically appropriate icons

The highlighted card represents the CURRENT learning focus.

# USE CASES RULES (WHERE IS IT USED?)

Generate 2-6 realistic practical applications:
- Each title: 2-4 words (e.g., "Web Applications", "Data Processing")
- Each description: 1 concise sentence
- Optionally mark 1-2 cards with \`"highlight": true\` for emphasis
- Icons should match the use case domain
- Focus on real-world, professional scenarios

# ROADMAP RULES (WHAT WILL YOU LEARN?)

Generate 4-10 learning steps showing progression:
- Each title: 2-6 words (e.g., "Step 1: Introduction", "Core Concepts")
- Each subtitle: 2-6 words (e.g., "Understanding the basics")
- Steps should build logically: simple → intermediate → advanced
- Auto-numbered (1, 2, 3...) by renderer, don't include step numbers in titles unless pedagogically meaningful
- Total should feel achievable but comprehensive

# BENEFITS RULES (WHY THIS MATTERS)

Generate 2-6 compelling benefits:
- Each title: 1-3 words (e.g., "Reusability", "Efficiency", "Maintainability")
- Each subtitle: 1-2 sentences explaining the benefit
- Icons should reinforce the benefit concept
- Focus on practical, career-relevant advantages
- Avoid marketing hype; be concrete and honest

# CODE SOLUTION RULES

The solution code MUST:
- Be complete and runnable (no pseudo-code or placeholders)
- Demonstrate the core concept clearly
- Use appropriate language for the topic (JavaScript, Python, etc.)
- Include brief inline comments for clarity
- Be 8-20 lines (focused, not overwhelming)
- Follow language best practices
- Avoid complex dependencies or setup

# CONTENT QUALITY GUIDELINES

1. **Clarity:** Use plain language accessible to beginners
2. **Conciseness:** Respect specified sentence limits
3. **Consistency:** Maintain the same technical depth throughout
4. **Completeness:** Include all required fields
5. **Accuracy:** Ensure technical correctness
6. **Relevance:** Tie everything to the specific topic
7. **Motivation:** Inspire learners without overpromising

# STRICT REQUIREMENTS

- Return ONLY valid JSON
- NO markdown code fences (\`\`\`json)
- NO explanatory text before or after JSON
- NO additional properties beyond the schema
- ALL string fields must be non-empty
- Arrays must contain at least 1 item (max specified in schema)
- Icons MUST come from the approved list
- expectedTimeSec at ROOT level (not inside page)

# TOPIC INTEGRATION

Use the provided context hierarchy to customize content:
- Domain: ${context.domainName}
- Subject: ${context.subjectName}
- Topic: ${context.topicName}
- Subtopic: ${context.subtopicName}
- Navigation Node: ${context.navigationNodeName}

Ensure all sections relate specifically to ${context.navigationNodeName} within the ${context.topicName} context.`
  );
}
