/**
 * Layman Section Validator
 * Phase 2B - Backend Service Layer
 * ---------------------------------
 * Constitutional compliance and validation logic
 */

import type {
  LaymanSectionContent,
  LaymanValidationResult,
  LaymanSectionWithArchitectures,
} from '../types/layman.types';

/**
 * Layman Validator
 * Enforces constitutional framework compliance
 */
export class LaymanValidator {
  /**
   * Required subsections per Layman Master Template
   */
  static readonly REQUIRED_SUBSECTIONS = [
    'analogy',
    'beginnerBreakdown',
    'mentalModel',
    'useCase',
    'faq',
    'summary',
  ] as const;

  /**
   * Minimum content lengths (words)
   */
  static readonly MIN_CONTENT_LENGTHS = {
    analogy: 50,
    beginnerBreakdown: 100,
    mentalModel: 50,
    useCase: 75,
    summary: 30,
  };

  /**
   * Maximum content lengths (words)
   */
  static readonly MAX_CONTENT_LENGTHS = {
    analogy: 300,
    beginnerBreakdown: 800,
    mentalModel: 200,
    useCase: 400,
    summary: 150,
  };

  /**
   * Validate subsection completeness
   */
  validateSubsections(content: LaymanSectionContent): LaymanValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingSubsections: string[] = [];

    const subsections = content.subsections;

    // Check required subsections
    for (const required of LaymanValidator.REQUIRED_SUBSECTIONS) {
      const value = subsections[required];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingSubsections.push(required);
        errors.push(`Missing required subsection: ${required}`);
      }
    }

    // Validate content lengths
    if (subsections.analogy) {
      const wordCount = this.countWords(subsections.analogy);
      if (wordCount < LaymanValidator.MIN_CONTENT_LENGTHS.analogy) {
        warnings.push(
          `Analogy is too short (${wordCount} words, minimum ${LaymanValidator.MIN_CONTENT_LENGTHS.analogy})`
        );
      }
      if (wordCount > LaymanValidator.MAX_CONTENT_LENGTHS.analogy) {
        warnings.push(
          `Analogy is too long (${wordCount} words, maximum ${LaymanValidator.MAX_CONTENT_LENGTHS.analogy})`
        );
      }
    }

    if (subsections.beginnerBreakdown) {
      const wordCount = this.countWords(subsections.beginnerBreakdown);
      if (wordCount < LaymanValidator.MIN_CONTENT_LENGTHS.beginnerBreakdown) {
        warnings.push(
          `Beginner breakdown is too short (${wordCount} words, minimum ${LaymanValidator.MIN_CONTENT_LENGTHS.beginnerBreakdown})`
        );
      }
      if (wordCount > LaymanValidator.MAX_CONTENT_LENGTHS.beginnerBreakdown) {
        warnings.push(
          `Beginner breakdown is too long (${wordCount} words, maximum ${LaymanValidator.MAX_CONTENT_LENGTHS.beginnerBreakdown})`
        );
      }
    }

    // Validate FAQ structure
    if (subsections.faq) {
      if (!Array.isArray(subsections.faq)) {
        errors.push('FAQ must be an array of question-answer pairs');
      } else if (subsections.faq.length === 0) {
        warnings.push('FAQ section is empty');
      } else {
        subsections.faq.forEach((item, index) => {
          if (!item.question || !item.answer) {
            errors.push(`FAQ item ${index + 1} is missing question or answer`);
          }
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingSubsections: missingSubsections.length > 0 ? missingSubsections : undefined,
    };
  }

  /**
   * Validate architecture references
   */
  validateArchitecture(section: LaymanSectionWithArchitectures): LaymanValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const architectureIssues: string[] = [];

    // Check educational architecture
    if (!section.educationalArchitectureId) {
      errors.push('Missing educational architecture reference');
      architectureIssues.push('educationalArchitectureId');
    }

    // Check UI architecture
    if (!section.uiArchitectureId) {
      errors.push('Missing UI architecture reference');
      architectureIssues.push('uiArchitectureId');
    }

    // Validate section type
    if (section.sectionType !== 'layman') {
      errors.push(`Invalid section type: ${section.sectionType} (expected: layman)`);
    }

    // Validate brand
    if (!section.brandId) {
      errors.push('Missing brand ID');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      architectureIssues: architectureIssues.length > 0 ? architectureIssues : undefined,
    };
  }

  /**
   * Validate prompt template compatibility
   */
  validatePromptTemplate(
    templateName: string,
    allowedTemplates: string[] = [
      'Layman Master Template v1',
      'Layman Career Switcher Template v1',
      'Layman Fast-Track Template v1',
    ]
  ): LaymanValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!allowedTemplates.includes(templateName)) {
      errors.push(
        `Invalid prompt template: ${templateName}. Allowed: ${allowedTemplates.join(', ')}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate brand safety
   */
  validateBrandSafety(
    brandId: string,
    allowedBrands: string[] = ['shared', 'realtutorialhub', 'skillup']
  ): LaymanValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!allowedBrands.includes(brandId)) {
      errors.push(`Invalid brand ID: ${brandId}. Allowed: ${allowedBrands.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate deployment readiness
   */
  validateDeploymentReadiness(section: LaymanSectionWithArchitectures): LaymanValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check status
    if (section.status !== 'approved') {
      errors.push(`Section must be approved before deployment (current status: ${section.status})`);
    }

    // Check content exists
    if (!section.content || Object.keys(section.content).length === 0) {
      errors.push('Section content is empty');
    }

    // Validate subsections
    if (section.content) {
      const subsectionValidation = this.validateSubsections(section.content as LaymanSectionContent);
      errors.push(...subsectionValidation.errors);
      warnings.push(...subsectionValidation.warnings);
    }

    // Validate architecture
    const archValidation = this.validateArchitecture(section);
    errors.push(...archValidation.errors);
    warnings.push(...archValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Comprehensive validation
   */
  validateComplete(section: LaymanSectionWithArchitectures): LaymanValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Architecture validation
    const archResult = this.validateArchitecture(section);
    allErrors.push(...archResult.errors);
    allWarnings.push(...archResult.warnings);

    // Brand validation
    const brandResult = this.validateBrandSafety(section.brandId);
    allErrors.push(...brandResult.errors);
    allWarnings.push(...brandResult.warnings);

    // Content validation
    if (section.content) {
      const contentResult = this.validateSubsections(section.content as LaymanSectionContent);
      allErrors.push(...contentResult.errors);
      allWarnings.push(...contentResult.warnings);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  /**
   * Helper: Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }
}
