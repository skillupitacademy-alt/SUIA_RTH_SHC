/* istanbul ignore file */
/**
 * Layman Section - Complete Constitutional Foundation
 * Phase 2B - Subsection Taxonomy + Educational + UI Architecture
 * 
 * Central export point for all Layman section configuration
 * This serves as the master template for all 11 remaining sections
 */

// Constitutional Configuration
export {
  LAYMAN_CONSTITUTION,
  LAYMAN_METADATA,
  LAYMAN_DOMAIN_EXTENSIONS,
  type LaymanConstitution,
  type LaymanMetadata,
  type LaymanDomainExtensions,
} from './layman-section-config';

// AI Prompt Templates
export {
  laymanMasterPromptTemplate,
  laymanAnalogyPromptTemplate,
  laymanProgrammingPromptVariant,
  laymanPromptSeeds,
} from './layman-prompt-seeds';

// Educational Architectures
export {
  beginnerLaymanArchitecture,
  visualLearnerLaymanArchitecture,
  quickStartLaymanArchitecture,
  nonTechnicalLaymanArchitecture,
  accessibilityLaymanArchitecture,
  laymanEducationalArchitectureSeeds,
} from './layman-educational-architecture-seeds';

// UI Architectures
export {
  universalLaymanUIArchitecture,
  accessibilityLaymanUIArchitecture,
  mobileLaymanUIArchitecture,
  highContrastLaymanUIArchitecture,
  laymanUIArchitectureSeeds,
  laymanSubsectionRenderers,
} from './layman-ui-architecture-seeds';

// Import for internal use
import {
  LAYMAN_CONSTITUTION,
  LAYMAN_METADATA,
  LAYMAN_DOMAIN_EXTENSIONS,
} from './layman-section-config';

import { laymanPromptSeeds } from './layman-prompt-seeds';
import { laymanEducationalArchitectureSeeds } from './layman-educational-architecture-seeds';
import { laymanUIArchitectureSeeds, laymanSubsectionRenderers } from './layman-ui-architecture-seeds';

/**
 * Complete Layman Section Seed Package
 * Use this for full database initialization
 */
export const LAYMAN_COMPLETE_SEED_PACKAGE = {
  constitution: LAYMAN_CONSTITUTION,
  metadata: LAYMAN_METADATA,
  domainExtensions: LAYMAN_DOMAIN_EXTENSIONS,
  promptTemplates: laymanPromptSeeds,
  educationalArchitectures: laymanEducationalArchitectureSeeds,
  uiArchitectures: laymanUIArchitectureSeeds,
  subsectionRenderers: laymanSubsectionRenderers,
} as const;

/**
 * Validation Helper
 * Validates if a section conforms to Layman constitution
 */
export function validateLaymanSection(section: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check section type
  if (section.sectionType !== 'layman') {
    errors.push('Section type must be "layman"');
  }
  
  // Check required subsections
  const requiredKeys = LAYMAN_CONSTITUTION.requiredSubsections.map((s: any) => s.key);
  const missingSubsections = requiredKeys.filter(
    (key: string) => !section.content || !section.content[key]
  );
  
  if (missingSubsections.length > 0) {
    errors.push(`Missing required subsections: ${missingSubsections.join(', ')}`);
  }
  
  // Check quality thresholds
  if (section.qualityScore && section.qualityScore < LAYMAN_CONSTITUTION.validation.minQualityScore) {
    errors.push(`Quality score ${section.qualityScore} below minimum ${LAYMAN_CONSTITUTION.validation.minQualityScore}`);
  }
  
  if (section.hallucinationScore && section.hallucinationScore > LAYMAN_CONSTITUTION.validation.maxHallucinationScore) {
    errors.push(`Hallucination score ${section.hallucinationScore} above maximum ${LAYMAN_CONSTITUTION.validation.maxHallucinationScore}`);
  }
  
  // Warnings for optional improvements
  const optionalKeys = LAYMAN_CONSTITUTION.optionalSubsections.map((s: any) => s.key);
  const missingOptional = optionalKeys.filter(
    (key: string) => !section.content || !section.content[key]
  );
  
  if (missingOptional.length > 0) {
    warnings.push(`Consider adding optional subsections: ${missingOptional.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Helper to get subsection configuration by key
 */
export function getLaymanSubsectionConfig(key: string) {
  const required = LAYMAN_CONSTITUTION.requiredSubsections.find((s: any) => s.key === key);
  if (required) return required;
  
  const optional = LAYMAN_CONSTITUTION.optionalSubsections.find((s: any) => s.key === key);
  return optional;
}

/**
 * Helper to get total estimated time for Layman section
 */
export function getLaymanEstimatedTime(includeOptional: boolean = false): number {
  let total = LAYMAN_CONSTITUTION.requiredSubsections.reduce(
    (sum: number, sub: any) => sum + sub.estimatedReadTime,
    0
  );
  
  if (includeOptional) {
    total += LAYMAN_CONSTITUTION.optionalSubsections.reduce(
      (sum: number, sub: any) => sum + sub.estimatedReadTime,
      0
    );
  }
  
  return total;
}
