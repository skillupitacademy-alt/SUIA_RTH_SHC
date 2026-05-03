/* istanbul ignore file */
/**
 * Layman Section Constitutional Configuration
 * Phase 2B.1 - Subsection Taxonomy Classification
 * 
 * Defines the immutable constitutional rules for the Layman Section
 * This serves as the master template for all 11 remaining sections
 */

import { subsectionTypeEnum } from './enums-modular';

/**
 * Layman Section Constitution
 * IMMUTABLE: These rules define what makes a valid Layman section
 */
export const LAYMAN_CONSTITUTION = {
  // Section Identity
  sectionType: 'layman' as const,
  displayName: 'Beginner-Friendly Explanation',
  description: 'Simplifies complex concepts for absolute beginners using analogies and emotional safety',
  
  // Required Subsections (MUST be present)
  requiredSubsections: [
    {
      type: 'concept' as const,
      key: 'simple_overview',
      displayName: 'Simple Overview',
      description: 'Plain-language introduction to the concept',
      orderIndex: 1,
      estimatedReadTime: 2,
    },
    {
      type: 'analogy' as const,
      key: 'everyday_analogy',
      displayName: 'Everyday Analogy',
      description: 'Relatable real-world comparison',
      orderIndex: 2,
      estimatedReadTime: 3,
    },
    {
      type: 'concept' as const,
      key: 'why_it_exists',
      displayName: 'Why It Exists',
      description: 'Motivation and practical context',
      orderIndex: 3,
      estimatedReadTime: 2,
    },
    {
      type: 'example' as const,
      key: 'simple_use_cases',
      displayName: 'Simple Use Cases',
      description: 'Basic practical examples',
      orderIndex: 4,
      estimatedReadTime: 3,
    },
    {
      type: 'concept' as const,
      key: 'beginner_breakdown',
      displayName: 'Beginner-Friendly Breakdown',
      description: 'Step-by-step simplification',
      orderIndex: 5,
      estimatedReadTime: 4,
    },
    {
      type: 'visual' as const,
      key: 'mental_model',
      displayName: 'Visual Mental Model',
      description: 'Easy imagination aid',
      orderIndex: 6,
      estimatedReadTime: 3,
    },
    {
      type: 'pitfall' as const,
      key: 'common_beginner_confusions',
      displayName: 'Common Beginner Confusions',
      description: 'Fear reduction and mistake prevention',
      orderIndex: 7,
      estimatedReadTime: 3,
    },
    {
      type: 'concept' as const,
      key: 'simple_summary',
      displayName: 'Simple Summary',
      description: 'Reinforcement and clarity recap',
      orderIndex: 8,
      estimatedReadTime: 2,
    },
  ],
  
  // Optional Subsections (Domain-specific extensions)
  optionalSubsections: [
    {
      type: 'analogy' as const,
      key: 'domain_specific_simplifier',
      displayName: 'Domain-Specific Simplification',
      description: 'Subject-specific beginner metaphors',
      orderIndex: 9,
      estimatedReadTime: 3,
    },
    {
      type: 'visual' as const,
      key: 'interactive_visual',
      displayName: 'Interactive Visual',
      description: 'Engaging visual learning aid',
      orderIndex: 10,
      estimatedReadTime: 4,
    },
    {
      type: 'example' as const,
      key: 'story_block',
      displayName: 'Story Block',
      description: 'Narrative-driven learning',
      orderIndex: 11,
      estimatedReadTime: 5,
    },
  ],
  
  // Validation Rules (Constitutional Compliance)
  validation: {
    // Minimum required subsections
    minRequiredBlocks: 8,
    
    // Quality thresholds
    minQualityScore: 85,
    maxHallucinationScore: 10,
    
    // Content requirements
    minWordsPerSubsection: 100,
    maxWordsPerSubsection: 500,
    
    // Tone requirements
    requiredTone: 'beginner_friendly',
    forbiddenJargon: true,
    requireAnalogies: true,
    requireEmotionalSafety: true,
  },
  
  // Educational Objectives
  learningObjectives: [
    'Reduce beginner fear and anxiety',
    'Build foundational understanding',
    'Create emotional accessibility',
    'Enable zero-to-one comprehension',
    'Establish trust through simplicity',
  ],
  
  // Target Audience
  targetAudience: [
    'absolute_beginner',
    'career_switcher',
    'non_technical',
    'first_time_learner',
  ],
  
  // Pedagogical Principles
  pedagogicalPrinciples: [
    'Simplification without condescension',
    'Analogy-driven teaching',
    'Fear reduction through clarity',
    'Emotional safety first',
    'Progressive disclosure',
  ],
} as const;

/**
 * Layman Section Metadata
 * Used for analytics and governance
 */
export const LAYMAN_METADATA = {
  // Section characteristics
  averageCompletionTime: 22, // minutes
  complexityLevel: 1, // 1-10 scale
  prerequisiteKnowledge: 'none',
  
  // XP Rewards
  baseXpReward: 50,
  bonusXpForCompletion: 10,
  
  // Analytics tracking
  trackingEvents: [
    'layman_section_started',
    'layman_analogy_viewed',
    'layman_breakdown_completed',
    'layman_confusion_clicked',
    'layman_section_completed',
  ],
} as const;

/**
 * Domain-Specific Layman Extensions
 * Flexible adaptations per domain
 */
export const LAYMAN_DOMAIN_EXTENSIONS = {
  // Full Stack / Programming
  programming: {
    additionalSubsections: ['code_analogy', 'memory_model_simple'],
    preferredAnalogies: ['shopping_list', 'storage_boxes', 'recipe_steps'],
  },
  
  // Data Analytics
  analytics: {
    additionalSubsections: ['dashboard_analogy', 'spreadsheet_comparison'],
    preferredAnalogies: ['report_card', 'scoreboard', 'visual_story'],
  },
  
  // Data Science
  data_science: {
    additionalSubsections: ['prediction_story', 'trend_visual'],
    preferredAnalogies: ['weather_forecast', 'student_grades', 'trend_line'],
  },
  
  // Cloud / DevOps
  cloud: {
    additionalSubsections: ['infrastructure_analogy', 'security_building'],
    preferredAnalogies: ['rented_computer', 'security_guard', 'factory_line'],
  },
  
  // Cybersecurity
  security: {
    additionalSubsections: ['threat_story', 'protection_analogy'],
    preferredAnalogies: ['locked_door', 'id_check', 'security_gate'],
  },
} as const;

/**
 * Type exports for TypeScript
 */
export type LaymanConstitution = typeof LAYMAN_CONSTITUTION;
export type LaymanMetadata = typeof LAYMAN_METADATA;
export type LaymanDomainExtensions = typeof LAYMAN_DOMAIN_EXTENSIONS;
