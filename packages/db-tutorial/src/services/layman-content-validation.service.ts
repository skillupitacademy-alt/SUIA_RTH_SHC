/**
 * Layman Content Validation Service
 * Phase 2B Week 2 - Human-in-the-Loop AI Governance
 * --------------------------------------------------
 * Validates parsed AI content against constitutional requirements
 */

import { LaymanValidator } from '../validators/layman.validator';
import type {
  ParsedLaymanContent,
  ContentValidationResult,
} from '../types/layman-prompt.types';
import type { LaymanSectionContent } from '../types/layman.types';

/**
 * Content Validation Error
 */
export class ContentValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ContentValidationError';
  }
}

/**
 * Layman Content Validation Service
 * Validates content quality, completeness, and constitutional compliance
 */
export class LaymanContentValidationService {
  constructor(private validator: LaymanValidator = new LaymanValidator()) {}

  /**
   * Validate parsed content
   */
  validateParsedContent(parsed: ParsedLaymanContent): ContentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingSubsections: string[] = [];

    // Check required subsections
    const required = ['analogy', 'beginnerBreakdown', 'mentalModel', 'useCase', 'faq', 'summary'];
    for (const section of required) {
      if (!parsed[section as keyof ParsedLaymanContent]) {
        missingSubsections.push(section);
        errors.push(`Missing required subsection: ${section}`);
      }
    }

    // Validate content structure
    const sectionContent: LaymanSectionContent = {
      subsections: {
        analogy: parsed.analogy,
        beginnerBreakdown: parsed.beginnerBreakdown,
        mentalModel: parsed.mentalModel,
        useCase: parsed.useCase,
        faq: parsed.faq,
        summary: parsed.summary,
        motivation: parsed.motivation,
      },
    };

    // Use existing validator
    const validationResult = this.validator.validateSubsections(sectionContent);
    errors.push(...validationResult.errors);
    warnings.push(...validationResult.warnings);

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(parsed);

    // Calculate hallucination risk (rule-based)
    const hallucinationRisk = this.calculateHallucinationRisk(parsed);

    // Calculate completeness score
    const completenessScore = this.calculateCompletenessScore(parsed);

    // Determine governance status
    let governanceStatus: ContentValidationResult['governanceStatus'] = 'draft';
    if (errors.length > 0) {
      governanceStatus = 'revision_required';
    } else if (qualityScore >= 85 && hallucinationRisk <= 10 && completenessScore >= 90) {
      governanceStatus = 'pending_review';
    } else if (qualityScore >= 70) {
      governanceStatus = 'draft';
    } else {
      governanceStatus = 'revision_required';
    }

    return {
      isValid: errors.length === 0 && qualityScore >= 70,
      qualityScore,
      hallucinationRisk,
      completenessScore,
      errors,
      warnings,
      missingSubsections,
      governanceStatus,
    };
  }

  /**
   * Calculate quality score (0-100)
   */
  private calculateQualityScore(parsed: ParsedLaymanContent): number {
    let score = 0;
    let maxScore = 0;

    // Analogy quality (20 points)
    maxScore += 20;
    if (parsed.analogy) {
      const wordCount = this.countWords(parsed.analogy);
      if (wordCount >= 50 && wordCount <= 300) {
        score += 20;
      } else if (wordCount >= 30) {
        score += 10;
      }
    }

    // Beginner breakdown quality (25 points)
    maxScore += 25;
    if (parsed.beginnerBreakdown) {
      const wordCount = this.countWords(parsed.beginnerBreakdown);
      if (wordCount >= 100 && wordCount <= 800) {
        score += 25;
      } else if (wordCount >= 50) {
        score += 15;
      }
    }

    // Mental model quality (15 points)
    maxScore += 15;
    if (parsed.mentalModel) {
      const wordCount = this.countWords(parsed.mentalModel);
      if (wordCount >= 50 && wordCount <= 200) {
        score += 15;
      } else if (wordCount >= 30) {
        score += 10;
      }
    }

    // Use case quality (15 points)
    maxScore += 15;
    if (parsed.useCase) {
      const wordCount = this.countWords(parsed.useCase);
      if (wordCount >= 75 && wordCount <= 400) {
        score += 15;
      } else if (wordCount >= 40) {
        score += 10;
      }
    }

    // FAQ quality (15 points)
    maxScore += 15;
    if (parsed.faq && Array.isArray(parsed.faq)) {
      if (parsed.faq.length >= 3) {
        score += 15;
      } else if (parsed.faq.length >= 1) {
        score += 10;
      }
    }

    // Summary quality (10 points)
    maxScore += 10;
    if (parsed.summary) {
      const wordCount = this.countWords(parsed.summary);
      if (wordCount >= 30 && wordCount <= 150) {
        score += 10;
      } else if (wordCount >= 20) {
        score += 5;
      }
    }

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Calculate hallucination risk (0-100, lower is better)
   */
  private calculateHallucinationRisk(parsed: ParsedLaymanContent): number {
    let riskScore = 0;

    // Check for common hallucination indicators
    const allText = Object.values(parsed)
      .filter((v) => typeof v === 'string')
      .join(' ')
      .toLowerCase();

    // Suspicious patterns
    const suspiciousPatterns = [
      /according to (recent )?studies/gi,
      /research shows/gi,
      /scientists (have )?discovered/gi,
      /\d{4} study/gi, // Year references
      /university of/gi,
      /professor .+ said/gi,
    ];

    for (const pattern of suspiciousPatterns) {
      const matches = allText.match(pattern);
      if (matches) {
        riskScore += matches.length * 5;
      }
    }

    // Check for overly specific claims
    if (/\d+(\.\d+)?%/.test(allText)) {
      riskScore += 10; // Specific percentages
    }

    // Cap at 100
    return Math.min(riskScore, 100);
  }

  /**
   * Calculate completeness score (0-100)
   */
  private calculateCompletenessScore(parsed: ParsedLaymanContent): number {
    const required = ['analogy', 'beginnerBreakdown', 'mentalModel', 'useCase', 'faq', 'summary'];
    let present = 0;

    for (const section of required) {
      const content = parsed[section as keyof ParsedLaymanContent];
      if (content) {
        if (typeof content === 'string' && content.length > 50) {
          present++;
        } else if (Array.isArray(content) && content.length > 0) {
          present++;
        }
      }
    }

    return Math.round((present / required.length) * 100);
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  /**
   * Validate brand compliance
   */
  validateBrandCompliance(parsed: ParsedLaymanContent, brandId: string): {
    isCompliant: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Brand-specific validation rules
    // This is a placeholder - implement actual brand rules
    if (brandId === 'realtutorialhub') {
      // Check for RTH-specific requirements
    } else if (brandId === 'skillup') {
      // Check for SkillUp-specific requirements
    }

    return {
      isCompliant: issues.length === 0,
      issues,
    };
  }
}
