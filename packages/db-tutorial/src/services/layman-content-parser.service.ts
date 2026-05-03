/**
 * Layman Content Parser Service
 * Phase 2B Week 2 - Human-in-the-Loop AI Governance
 * --------------------------------------------------
 * Parses AI-generated responses into structured content
 */

import { LaymanContentSanitizationService } from './layman-content-sanitization.service';
import type { ParsedLaymanContent } from '../types/layman-prompt.types';

/**
 * Content Parser Error
 */
export class ContentParserError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ContentParserError';
  }
}

/**
 * Layman Content Parser Service
 * Parses raw AI responses into constitutional subsection structure
 */
export class LaymanContentParserService {
  constructor(
    private sanitizationService: LaymanContentSanitizationService = new LaymanContentSanitizationService()
  ) {}

  /**
   * Parse raw AI response into structured content
   */
  parseRawAIResponse(rawText: string, sanitize: boolean = true): ParsedLaymanContent {
    if (!rawText || rawText.trim().length < 100) {
      throw new ContentParserError(
        'AI response is too short or empty',
        'INVALID_RESPONSE',
        400
      );
    }

    // Sanitize if requested
    let processedText = rawText;
    if (sanitize) {
      const sanitizationResult = this.sanitizationService.fullSanitize(rawText);
      processedText = sanitizationResult.sanitized;
      
      if (!sanitizationResult.safe) {
        console.warn('[ContentParser] Security issues detected:', sanitizationResult.warnings);
      }
    }

    // Normalize text
    const normalizedText = this.normalizeText(processedText);

    // Extract sections
    const parsed: ParsedLaymanContent = {
      analogy: this.extractSection(normalizedText, ['Analogy', 'Analogy:', '## Analogy', '### Analogy']),
      beginnerBreakdown: this.extractSection(normalizedText, [
        'Beginner Breakdown',
        'Beginner Breakdown:',
        '## Beginner Breakdown',
        'For Beginners',
      ]),
      mentalModel: this.extractSection(normalizedText, [
        'Mental Model',
        'Mental Model:',
        '## Mental Model',
        'Thinking Framework',
      ]),
      useCase: this.extractSection(normalizedText, [
        'Use Case',
        'Use Case:',
        '## Use Case',
        'Real-World Application',
        'Practical Example',
      ]),
      faq: this.extractFAQ(normalizedText),
      summary: this.extractSection(normalizedText, [
        'Summary',
        'Summary:',
        '## Summary',
        'Key Takeaways',
        'In Summary',
      ]),
      motivation: this.extractSection(normalizedText, [
        'Motivation',
        'Motivation:',
        '## Motivation',
        'Why Learn This',
      ]),
    };

    return parsed;
  }

  /**
   * Normalize text (remove extra whitespace, fix encoding)
   */
  private normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .trim();
  }

  /**
   * Extract section content by header patterns
   */
  private extractSection(text: string, headers: string[]): string | undefined {
    for (const header of headers) {
      // Try different regex patterns
      const patterns = [
        // Markdown headers
        new RegExp(`#{1,3}\\s*${this.escapeRegex(header)}\\s*\\n([\\s\\S]*?)(?=\\n#{1,3}\\s|$)`, 'i'),
        // Bold headers
        new RegExp(`\\*\\*${this.escapeRegex(header)}\\*\\*\\s*\\n([\\s\\S]*?)(?=\\n\\*\\*|$)`, 'i'),
        // Plain headers with colon
        new RegExp(`${this.escapeRegex(header)}\\s*\\n([\\s\\S]*?)(?=\\n[A-Z][A-Za-z ]+:|$)`, 'i'),
        // Headers with separator
        new RegExp(`${this.escapeRegex(header)}\\s*\\n[-=]+\\s*\\n([\\s\\S]*?)(?=\\n[A-Z]|$)`, 'i'),
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }

    return undefined;
  }

  /**
   * Extract FAQ section
   */
  private extractFAQ(text: string): Array<{ question: string; answer: string }> | undefined {
    const faqSection = this.extractSection(text, ['FAQ', 'FAQ:', '## FAQ', 'Frequently Asked Questions']);

    if (!faqSection) {
      return undefined;
    }

    const faqItems: Array<{ question: string; answer: string }> = [];

    // Pattern 1: Q: ... A: ...
    const qaPattern = /Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)/gis;
    let match;
    while ((match = qaPattern.exec(faqSection)) !== null) {
      faqItems.push({
        question: match[1].trim(),
        answer: match[2].trim(),
      });
    }

    // Pattern 2: **Q:** ... **A:** ...
    if (faqItems.length === 0) {
      const boldQAPattern = /\*\*Q:\*\*\s*(.+?)\s*\*\*A:\*\*\s*(.+?)(?=\*\*Q:|$)/gis;
      while ((match = boldQAPattern.exec(faqSection)) !== null) {
        faqItems.push({
          question: match[1].trim(),
          answer: match[2].trim(),
        });
      }
    }

    // Pattern 3: Numbered questions
    if (faqItems.length === 0) {
      const numberedPattern = /\d+\.\s*(.+?)\n\s*-?\s*(.+?)(?=\n\d+\.|$)/gis;
      while ((match = numberedPattern.exec(faqSection)) !== null) {
        faqItems.push({
          question: match[1].trim(),
          answer: match[2].trim(),
        });
      }
    }

    return faqItems.length > 0 ? faqItems : undefined;
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Detect missing sections
   */
  detectMissingSections(parsed: ParsedLaymanContent): string[] {
    const required = ['analogy', 'beginnerBreakdown', 'mentalModel', 'useCase', 'faq', 'summary'];
    const missing: string[] = [];

    for (const section of required) {
      if (!parsed[section as keyof ParsedLaymanContent]) {
        missing.push(section);
      }
    }

    return missing;
  }

  /**
   * Calculate completeness score
   */
  calculateCompletenessScore(parsed: ParsedLaymanContent): number {
    const required = ['analogy', 'beginnerBreakdown', 'mentalModel', 'useCase', 'faq', 'summary'];
    let score = 0;

    for (const section of required) {
      const content = parsed[section as keyof ParsedLaymanContent];
      if (content) {
        if (typeof content === 'string' && content.length > 50) {
          score += 100 / required.length;
        } else if (Array.isArray(content) && content.length > 0) {
          score += 100 / required.length;
        }
      }
    }

    return Math.round(score);
  }
}
