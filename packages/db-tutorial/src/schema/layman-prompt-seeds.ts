/* istanbul ignore file */
/**
 * Layman Section Prompt Template Seeds
 * Phase 2B.4 - AI Prompt Orchestration System
 * 
 * Defines AI generation templates for Layman section content
 * These prompts ensure consistent beginner-friendly educational quality
 */

import { NewPromptTemplate } from './prompt-templates';

/**
 * Master Layman Prompt Template
 * Version 1.0 - Beginner Foundation
 */
export const laymanMasterPromptTemplate: Omit<NewPromptTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
  sectionType: 'layman',
  subsectionType: null, // Master template for entire section
  name: 'Layman Section Master Template v1',
  version: 1,
  
  systemPrompt: `You are an expert educational content creator specializing in beginner-friendly explanations.

Your mission:
- Simplify complex concepts without being condescending
- Use relatable analogies from everyday life
- Reduce fear and anxiety in learners
- Preserve technical correctness while maximizing accessibility
- Create emotional safety through clear, supportive language

Core principles:
1. Assume ZERO prior knowledge
2. Use simple, conversational language
3. Avoid jargon unless absolutely necessary (then explain it)
4. Connect abstract concepts to concrete, familiar experiences
5. Anticipate and address common beginner confusions
6. Build confidence through progressive understanding

Tone: Warm, supportive, patient, encouraging, never condescending.`,

  userPromptTemplate: `Generate a beginner-friendly Layman section for the following topic:

**Topic**: {{topicName}}
**Subtopic**: {{subtopicName}}
**Domain**: {{domainName}}
**Difficulty**: {{difficulty}}
**Target Audience**: {{targetAudience}}

Create content for these subsections:
1. Simple Overview - Explain what this is in plain language
2. Everyday Analogy - Provide a relatable real-world comparison
3. Why It Exists - Explain why this concept matters
4. Simple Use Cases - Show basic practical examples
5. Beginner Breakdown - Break the concept into easy steps
6. Mental Model - Create an intuitive visual reasoning aid
7. Common Beginner Confusions - List mistakes beginners make
8. Simple Summary - Reinforce key understanding

Requirements:
- Use conversational, supportive language
- Include at least 2 relatable analogies
- Anticipate beginner questions
- Avoid technical jargon (or explain it immediately)
- Keep each subsection focused and digestible
- Build confidence progressively

Output as structured JSON matching the schema.`,

  variables: [
    'topicName',
    'subtopicName',
    'domainName',
    'difficulty',
    'targetAudience',
  ],
  
  outputSchema: {
    type: 'object',
    required: ['simple_overview', 'everyday_analogy', 'why_it_exists', 'simple_use_cases', 'beginner_breakdown', 'mental_model', 'common_beginner_confusions', 'simple_summary'],
    properties: {
      simple_overview: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          keyPoints: { type: 'array', items: { type: 'string' } },
        },
      },
      everyday_analogy: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          analogy: { type: 'string' },
          explanation: { type: 'string' },
          visualSuggestion: { type: 'string' },
        },
      },
      why_it_exists: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          motivation: { type: 'string' },
          realWorldRelevance: { type: 'string' },
        },
      },
      simple_use_cases: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          examples: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                scenario: { type: 'string' },
                explanation: { type: 'string' },
              },
            },
          },
        },
      },
      beginner_breakdown: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                stepNumber: { type: 'number' },
                title: { type: 'string' },
                explanation: { type: 'string' },
              },
            },
          },
        },
      },
      mental_model: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          visualDescription: { type: 'string' },
          thinkOfItAs: { type: 'string' },
        },
      },
      common_beginner_confusions: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          confusions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                confusion: { type: 'string' },
                clarification: { type: 'string' },
              },
            },
          },
        },
      },
      simple_summary: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          recap: { type: 'string' },
          keyTakeaways: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
  
  validationRules: [
    { rule: 'min_words_per_subsection', value: 100, required: true },
    { rule: 'max_words_per_subsection', value: 500, required: true },
    { rule: 'contains_analogy', required: true },
    { rule: 'no_unexplained_jargon', required: true },
    { rule: 'supportive_tone', required: true },
  ],
  
  successCriteria: {
    qualityScore: { min: 85 },
    hallucinationScore: { max: 10 },
  },
  
  modelName: 'gpt-4',
  temperature: 70,
  maxTokens: 4000,
  
  brandId: 'shared',
  brandVisibility: 'shared_visible',
  brandVariants: [
    {
      brandId: 'realtutorialhub',
      customTone: 'Professional yet approachable',
      customGuidelines: [
        'Emphasize real-world career applications',
        'Use industry-relevant examples',
      ],
    },
    {
      brandId: 'skillup',
      customTone: 'Energetic and motivational',
      customGuidelines: [
        'Emphasize skill-building and growth',
        'Use achievement-oriented language',
      ],
    },
  ],
  
  isActive: true,
  usageCount: 0,
  successRate: 0,
};

/**
 * Subsection-Specific Prompt Templates
 * Fine-grained control for individual subsections
 */

export const laymanAnalogyPromptTemplate: Omit<NewPromptTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
  sectionType: 'layman',
  subsectionType: 'analogy',
  name: 'Layman Analogy Generator v1',
  version: 1,
  
  systemPrompt: `You are an expert at creating relatable analogies for complex technical concepts.

Your goal: Make abstract ideas concrete through everyday comparisons.

Principles:
- Use universally familiar experiences
- Avoid analogies that require specialized knowledge
- Make the connection explicit and clear
- Acknowledge where the analogy breaks down
- Keep it simple and memorable`,

  userPromptTemplate: `Create a beginner-friendly analogy for:

**Concept**: {{conceptName}}
**Domain**: {{domainName}}
**Target Audience**: {{targetAudience}}

Provide:
1. A clear, relatable analogy from everyday life
2. Explanation of how the analogy maps to the concept
3. Visual description to help learners picture it
4. Note any limitations of the analogy

Keep it simple, memorable, and universally relatable.`,

  variables: ['conceptName', 'domainName', 'targetAudience'],
  
  outputSchema: {
    type: 'object',
    required: ['analogy', 'explanation', 'visualSuggestion'],
    properties: {
      analogy: { type: 'string' },
      explanation: { type: 'string' },
      visualSuggestion: { type: 'string' },
      limitations: { type: 'string' },
    },
  },
  
  validationRules: [
    { rule: 'contains_everyday_reference', required: true },
    { rule: 'clear_mapping', required: true },
  ],
  
  successCriteria: {
    qualityScore: { min: 85 },
    hallucinationScore: { max: 10 },
  },
  
  modelName: 'gpt-4',
  temperature: 75,
  maxTokens: 800,
  
  brandId: 'shared',
  brandVisibility: 'shared_visible',
  isActive: true,
  usageCount: 0,
  successRate: 0,
};

/**
 * Domain-Specific Prompt Variants
 * Specialized prompts for different technical domains
 */

export const laymanProgrammingPromptVariant: Omit<NewPromptTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
  sectionType: 'layman',
  subsectionType: null,
  name: 'Layman Programming Variant v1',
  version: 1,
  
  systemPrompt: `You are an expert at teaching programming concepts to absolute beginners.

Special focus:
- Use physical world analogies (boxes, containers, recipes)
- Explain code behavior without showing code initially
- Build mental models before syntax
- Address common "why does this work?" questions
- Reduce intimidation around technical terms`,

  userPromptTemplate: `Generate beginner-friendly programming explanation for:

**Programming Concept**: {{conceptName}}
**Language**: {{programmingLanguage}}
**Target Audience**: Complete beginners with no coding experience

Use analogies like:
- Variables as labeled boxes
- Functions as recipes or machines
- Arrays as shopping lists or rows of seats
- Objects as real-world things with properties

Make it approachable and build confidence.`,

  variables: ['conceptName', 'programmingLanguage'],
  
  outputSchema: {
    type: 'object',
    required: ['simple_overview', 'everyday_analogy', 'beginner_breakdown'],
    properties: {
      simple_overview: { type: 'object' },
      everyday_analogy: { type: 'object' },
      beginner_breakdown: { type: 'object' },
    },
  },
  
  validationRules: [
    { rule: 'no_code_in_layman', required: true },
    { rule: 'physical_world_analogy', required: true },
  ],
  
  successCriteria: {
    qualityScore: { min: 85 },
    hallucinationScore: { max: 10 },
  },
  
  modelName: 'gpt-4',
  temperature: 70,
  maxTokens: 4000,
  
  brandId: 'shared',
  brandVisibility: 'shared_visible',
  isActive: true,
  usageCount: 0,
  successRate: 0,
};

/**
 * Seed data array for database insertion
 */
export const laymanPromptSeeds = [
  laymanMasterPromptTemplate,
  laymanAnalogyPromptTemplate,
  laymanProgrammingPromptVariant,
];
