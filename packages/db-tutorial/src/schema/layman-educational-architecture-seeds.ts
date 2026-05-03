/* istanbul ignore file */
/**
 * Layman Section Educational Architecture Seeds
 * Phase 2B.2 - Educational Architecture Framework
 * 
 * Defines how learners experience the Layman section based on their profile
 * Personalized learning paths for different audience types
 */

import { NewEducationalArchitecture } from './educational-architectures';

/**
 * Beginner-First Layman Architecture
 * For absolute beginners and career switchers
 */
export const beginnerLaymanArchitecture: Omit<NewEducationalArchitecture, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Beginner First Layman Architecture',
  description: 'Optimized for absolute beginners with zero prior knowledge. Emphasizes emotional safety, progressive disclosure, and confidence building.',
  
  targetAudience: [
    'absolute_beginner',
    'career_switcher',
    'non_technical',
    'first_time_learner',
  ],
  
  targetDomains: null, // Universal across all domains
  
  sectionSequence: [
    {
      sectionType: 'layman',
      isRequired: true,
      order: 1,
      subsectionDepth: 'deep',
      estimatedTime: 25,
    },
    {
      sectionType: 'notes',
      isRequired: true,
      order: 2,
      subsectionDepth: 'medium',
      estimatedTime: 20,
    },
    {
      sectionType: 'visual',
      isRequired: true,
      order: 3,
      subsectionDepth: 'deep',
      estimatedTime: 15,
    },
    {
      sectionType: 'real_life',
      isRequired: true,
      order: 4,
      subsectionDepth: 'medium',
      estimatedTime: 15,
    },
    {
      sectionType: 'code',
      isRequired: false,
      order: 5,
      subsectionDepth: 'shallow',
      estimatedTime: 20,
    },
  ],
  
  interactivityLevel: 'high',
  visualDensity: 'high',
  
  brandId: 'shared',
  brandVisibility: 'shared_visible',
  brandOverrides: [
    {
      brandId: 'realtutorialhub',
      customName: 'Career-Ready Beginner Path',
      customDescription: 'Beginner-friendly learning with career context',
      interactivityOverride: 'high',
      visualDensityOverride: 'high',
    },
    {
      brandId: 'skillup',
      customName: 'Skill Builder Beginner Path',
      customDescription: 'Beginner-friendly learning with achievement focus',
      interactivityOverride: 'high',
      visualDensityOverride: 'high',
    },
  ],
  
  isActive: true,
  usageCount: 0,
};

/**
 * Visual Learner Layman Architecture
 * For learners who prefer visual and spatial learning
 */
export const visualLearnerLaymanArchitecture: Omit<NewEducationalArchitecture, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Visual Learner Layman Architecture',
  description: 'Optimized for visual and spatial learners. Heavy emphasis on diagrams, mental models, and visual analogies.',
  
  targetAudience: [
    'visual_learner',
    'spatial_thinker',
    'design_oriented',
  ],
  
  targetDomains: null,
  
  sectionSequence: [
    {
      sectionType: 'layman',
      isRequired: true,
      order: 1,
      subsectionDepth: 'deep',
      estimatedTime: 22,
    },
    {
      sectionType: 'visual',
      isRequired: true,
      order: 2,
      subsectionDepth: 'deep',
      estimatedTime: 20,
    },
    {
      sectionType: 'notes',
      isRequired: true,
      order: 3,
      subsectionDepth: 'medium',
      estimatedTime: 15,
    },
    {
      sectionType: 'real_life',
      isRequired: true,
      order: 4,
      subsectionDepth: 'medium',
      estimatedTime: 15,
    },
  ],
  
  interactivityLevel: 'high',
  visualDensity: 'high',
  
  brandId: 'shared',
  brandVisibility: 'shared_visible',
  
  isActive: true,
  usageCount: 0,
};

/**
 * Quick Start Layman Architecture
 * For learners who want rapid understanding before diving deep
 */
export const quickStartLaymanArchitecture: Omit<NewEducationalArchitecture, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Quick Start Layman Architecture',
  description: 'Condensed beginner-friendly introduction for learners who want to grasp basics quickly.',
  
  targetAudience: [
    'time_constrained',
    'overview_seeker',
    'experienced_adjacent',
  ],
  
  targetDomains: null,
  
  sectionSequence: [
    {
      sectionType: 'layman',
      isRequired: true,
      order: 1,
      subsectionDepth: 'shallow',
      estimatedTime: 12,
    },
    {
      sectionType: 'notes',
      isRequired: true,
      order: 2,
      subsectionDepth: 'medium',
      estimatedTime: 15,
    },
    {
      sectionType: 'code',
      isRequired: true,
      order: 3,
      subsectionDepth: 'medium',
      estimatedTime: 20,
    },
  ],
  
  interactivityLevel: 'medium',
  visualDensity: 'medium',
  
  brandId: 'shared',
  brandVisibility: 'shared_visible',
  
  isActive: true,
  usageCount: 0,
};

/**
 * Non-Technical Professional Layman Architecture
 * For business professionals, managers, and non-technical stakeholders
 */
export const nonTechnicalLaymanArchitecture: Omit<NewEducationalArchitecture, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Non-Technical Professional Architecture',
  description: 'Designed for business professionals who need conceptual understanding without implementation details.',
  
  targetAudience: [
    'business_professional',
    'manager',
    'stakeholder',
    'non_technical',
  ],
  
  targetDomains: null,
  
  sectionSequence: [
    {
      sectionType: 'layman',
      isRequired: true,
      order: 1,
      subsectionDepth: 'deep',
      estimatedTime: 25,
    },
    {
      sectionType: 'real_life',
      isRequired: true,
      order: 2,
      subsectionDepth: 'deep',
      estimatedTime: 20,
    },
    {
      sectionType: 'visual',
      isRequired: true,
      order: 3,
      subsectionDepth: 'medium',
      estimatedTime: 15,
    },
    {
      sectionType: 'notes',
      isRequired: false,
      order: 4,
      subsectionDepth: 'shallow',
      estimatedTime: 10,
    },
  ],
  
  interactivityLevel: 'medium',
  visualDensity: 'high',
  
  brandId: 'shared',
  brandVisibility: 'shared_visible',
  
  isActive: true,
  usageCount: 0,
};

/**
 * Accessibility-First Layman Architecture
 * Optimized for screen readers and accessibility tools
 */
export const accessibilityLaymanArchitecture: Omit<NewEducationalArchitecture, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Accessibility-First Layman Architecture',
  description: 'Optimized for learners using screen readers and assistive technologies. Clear structure, descriptive text, minimal visual dependency.',
  
  targetAudience: [
    'screen_reader_user',
    'visually_impaired',
    'accessibility_dependent',
  ],
  
  targetDomains: null,
  
  sectionSequence: [
    {
      sectionType: 'layman',
      isRequired: true,
      order: 1,
      subsectionDepth: 'deep',
      estimatedTime: 25,
    },
    {
      sectionType: 'notes',
      isRequired: true,
      order: 2,
      subsectionDepth: 'deep',
      estimatedTime: 20,
    },
    {
      sectionType: 'code',
      isRequired: true,
      order: 3,
      subsectionDepth: 'medium',
      estimatedTime: 20,
    },
    {
      sectionType: 'real_life',
      isRequired: true,
      order: 4,
      subsectionDepth: 'medium',
      estimatedTime: 15,
    },
  ],
  
  interactivityLevel: 'low',
  visualDensity: 'low',
  
  brandId: 'shared',
  brandVisibility: 'shared_visible',
  
  isActive: true,
  usageCount: 0,
};

/**
 * Seed data array for database insertion
 */
export const laymanEducationalArchitectureSeeds = [
  beginnerLaymanArchitecture,
  visualLearnerLaymanArchitecture,
  quickStartLaymanArchitecture,
  nonTechnicalLaymanArchitecture,
  accessibilityLaymanArchitecture,
];
