/**
 * Content Analysis Service
 * 
 * Analyzes TutorialDocument and produces ContentAnalysisResult with:
 * - Statistical analysis (word count, blocks, reading time)
 * - Section hierarchy extraction
 * - Quality indicators (readability, structure, completeness)
 * - Detected elements (headings, paragraphs, code, etc.)
 * - Smart suggestions for improvement
 * - Overall confidence scoring
 * 
 * ARCHITECTURE:
 * - Pure analysis (does NOT modify TutorialDocument)
 * - Deterministic calculations
 * - No database writes
 * - No legacy dependencies
 * 
 * CONFIDENCE SEMANTICS:
 * Confidence values represent deterministic structural-analysis confidence scores
 * based on heuristic rules, NOT statistically calibrated probabilities.
 * 
 * For example, "confidence: 95" means:
 *   "Our deterministic structural rules have very high confidence
 *    that this block represents the detected element."
 * 
 * It does NOT mean:
 *   "There is a 95% statistical probability this is correct."
 * 
 * These are heuristic confidence scores for content analysis,
 * not machine-learning probability estimates.
 * 
 * PROMPT 06 BACKEND IMPLEMENTATION
 */

import type {
  TutorialDocument,
  ContentAnalysisResult,
  AnalysisSection,
  SmartSuggestion,
  QualityStatus,
} from '@quiz/types';

/**
 * Content Analysis Service
 * Analyzes TutorialDocument and produces machine-derived insights
 */
export class ContentAnalysisService {
  /**
   * Analyze TutorialDocument and produce ContentAnalysisResult
   * 
   * @param document - TutorialDocument to analyze
   * @param subtopicId - Optional subtopic context
   * @returns ContentAnalysisResult with complete analysis
   */
  analyzeDocument(
    document: TutorialDocument,
    subtopicId?: string
  ): ContentAnalysisResult {
    // Step 1: Calculate statistics
    const statistics = this.calculateStatistics(document);

    // Step 2: Extract section outline
    const sectionOutline = this.extractSectionOutline(document);

    // Step 3: Analyze quality indicators
    const qualityIndicators = this.analyzeQualityIndicators(document);

    // Step 4: Detect elements
    const detectedElements = this.detectElements(document);

    // Step 5: Generate smart suggestions
    const smartSuggestions = this.generateSmartSuggestions(
      document,
      qualityIndicators,
      detectedElements
    );

    // Step 6: Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(
      qualityIndicators,
      detectedElements,
      statistics
    );

    return {
      subtopicId,
      statistics,
      sectionOutline,
      qualityIndicators,
      detectedElements,
      smartSuggestions,
      overallConfidence,
    };
  }

  /**
   * Calculate statistical metrics
   */
  private calculateStatistics(document: TutorialDocument) {
    const textBlocks = this.getTextContent(document);
    const totalText = textBlocks.join(' ');
    const words = totalText.split(/\s+/).filter((w) => w.length > 0);
    const totalWords = words.length;
    const characters = totalText.length;

    // Reading time: average 200 words per minute
    const readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));

    // Count sections (heading blocks at different levels)
    const headings = document.blocks.filter(
      (block) => block.type === 'heading'
    );
    const sectionsDetected = headings.length;

    // Sections breakdown
    const h1Count = headings.filter((h: any) => (h.content?.level ?? h.level) === 1).length;
    const h2Count = headings.filter((h: any) => (h.content?.level ?? h.level) === 2).length;
    const h3Count = headings.filter((h: any) => (h.content?.level ?? h.level) === 3).length;
    const sectionsBreakdown = `H1: ${h1Count}, H2: ${h2Count}, H3: ${h3Count}`;

    return {
      totalWords,
      characters,
      readingTimeMinutes,
      sectionsDetected,
      totalBlocks: document.blocks.length,
      sectionsBreakdown,
    };
  }

  /**
   * Extract hierarchical section outline from document
   */
  private extractSectionOutline(
    document: TutorialDocument
  ): AnalysisSection[] {
    const outline: AnalysisSection[] = [];
    const blocks = document.blocks;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      if (block.type === 'heading') {
        const heading = block as any;
        const headingText = heading.content?.text || heading.text || '';
        const headingLevel = heading.content?.level || heading.level || 1;
        
        // Get snippet (next paragraph or first 100 chars of next text)
        let snippet = '';
        for (let j = i + 1; j < blocks.length && j < i + 3; j++) {
          const nextBlock = blocks[j] as any;
          if (nextBlock.type === 'paragraph') {
            const paraText = nextBlock.content?.text || nextBlock.text || '';
            snippet = paraText.slice(0, 100);
            break;
          } else if (nextBlock.type === 'heading') {
            break;
          }
        }

        const section: AnalysisSection = {
          id: heading.id,
          level: `h${headingLevel}` as AnalysisSection['level'],
          title: headingText,
          snippet: snippet || 'No preview available',
          confidence: this.calculateSectionConfidence(heading, blocks, i),
          isVerified: true,
        };

        // Build hierarchy
        if (headingLevel === 1) {
          outline.push(section);
        } else if (headingLevel === 2 && outline.length > 0) {
          const parent = outline[outline.length - 1];
          if (!parent.subsections) parent.subsections = [];
          parent.subsections.push(section);
        } else if (headingLevel === 3 && outline.length > 0) {
          const parent = outline[outline.length - 1];
          if (parent.subsections && parent.subsections.length > 0) {
            const subparent = parent.subsections[parent.subsections.length - 1];
            if (!subparent.subsections) subparent.subsections = [];
            subparent.subsections.push(section);
          } else {
            if (!parent.subsections) parent.subsections = [];
            parent.subsections.push(section);
          }
        } else {
          outline.push(section);
        }
      }
    }

    return outline;
  }

  /**
   * Calculate confidence score for a section
   */
  private calculateSectionConfidence(
    heading: any,
    blocks: any[],
    headingIndex: number
  ): number {
    let confidence = 70; // Base confidence

    // Boost if has content after it
    const hasContent = blocks
      .slice(headingIndex + 1, headingIndex + 5)
      .some((b) => b.type === 'paragraph' || b.type === 'list');
    if (hasContent) confidence += 15;

    // Boost if title is well-formed
    const headingText = heading.content?.text || heading.text || '';
    const titleLength = headingText.length;
    if (titleLength >= 10 && titleLength <= 80) confidence += 10;

    // Boost if has code/examples nearby
    const hasCode = blocks
      .slice(headingIndex + 1, headingIndex + 10)
      .some((b) => b.type === 'code' || b.type === 'example');
    if (hasCode) confidence += 5;

    return Math.min(100, confidence);
  }

  /**
   * Analyze quality indicators
   */
  private analyzeQualityIndicators(document: TutorialDocument) {
    const blocks = document.blocks;
    const textContent = this.getTextContent(document).join(' ');
    const words = textContent.split(/\s+/).filter((w) => w.length > 0);

    // Readability
    const avgWordLength =
      words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1);
    const readability: QualityStatus =
      avgWordLength < 6
        ? 'excellent'
        : avgWordLength < 8
        ? 'good'
        : avgWordLength < 10
        ? 'fair'
        : 'poor';

    // Structure (presence of headings)
    const headingCount = blocks.filter((b) => b.type === 'heading').length;
    const structure: QualityStatus =
      headingCount >= 5
        ? 'excellent'
        : headingCount >= 3
        ? 'good'
        : headingCount >= 1
        ? 'fair'
        : 'poor';

    // Completeness (word count)
    const totalWords = words.length;
    const completeness: QualityStatus =
      totalWords >= 1000
        ? 'excellent'
        : totalWords >= 500
        ? 'good'
        : totalWords >= 200
        ? 'fair'
        : 'poor';

    // Examples (explicit example blocks or "for example" mentions)
    const exampleBlocks = blocks.filter((b) => b.type === 'example').length;
    const exampleMentions = (textContent.match(/for example|e\.g\.|such as/gi) || [])
      .length;
    const exampleCount = exampleBlocks + exampleMentions;
    const examples: QualityStatus =
      exampleCount >= 5
        ? 'excellent'
        : exampleCount >= 3
        ? 'good'
        : exampleCount >= 1
        ? 'fair'
        : 'none';

    // Code presence
    const codeBlocks = blocks.filter((b) => b.type === 'code').length;
    const codePresence: QualityStatus =
      codeBlocks >= 5
        ? 'excellent'
        : codeBlocks >= 3
        ? 'good'
        : codeBlocks >= 1
        ? 'fair'
        : 'none';

    // Visual potential (diagrams, images, tables)
    const visualBlocks = blocks.filter(
      (b) =>
        b.type === 'diagram' ||
        b.type === 'image' ||
        b.type === 'table' ||
        b.type === 'comparison'
    ).length;
    const visualPotential: QualityStatus =
      visualBlocks >= 4
        ? 'excellent'
        : visualBlocks >= 2
        ? 'good'
        : visualBlocks >= 1
        ? 'fair'
        : 'none';

    return {
      readability,
      structure,
      completeness,
      examples,
      codePresence,
      visualPotential,
    };
  }

  /**
   * Detect all element types in document
   */
  private detectElements(document: TutorialDocument) {
    const blocks = document.blocks;

    return {
      headings: blocks.filter((b) => b.type === 'heading').length,
      paragraphs: blocks.filter((b) => b.type === 'paragraph').length,
      bulletLists: blocks.filter(
        (b) => b.type === 'list' && !((b as any).content?.ordered ?? (b as any).style === 'numbered')
      ).length,
      numberedLists: blocks.filter(
        (b) => b.type === 'list' && Boolean((b as any).content?.ordered || (b as any).style === 'numbered')
      ).length,
      codeBlocks: blocks.filter((b) => b.type === 'code').length,
      quotes: blocks.filter((b) => b.type === 'quote').length,
      tables: blocks.filter((b) => b.type === 'table').length,
      callouts: blocks.filter((b) => b.type === 'callout').length,
      keyConcepts: blocks.filter((b) => b.type === 'definition').length,
      comparisons: blocks.filter((b) => b.type === 'comparison').length,
      examples: blocks.filter((b) => b.type === 'example').length,
    };
  }

  /**
   * Generate smart suggestions based on analysis
   */
  private generateSmartSuggestions(
    document: TutorialDocument,
    qualityIndicators: any,
    detectedElements: any
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    let suggestionId = 1;

    // Structure suggestions
    if (qualityIndicators.structure === 'poor') {
      suggestions.push({
        id: `suggestion-${suggestionId++}`,
        text: 'Add more section headings to improve document structure',
        type: 'structure',
      });
    }

    // Code suggestions
    if (qualityIndicators.codePresence === 'none') {
      suggestions.push({
        id: `suggestion-${suggestionId++}`,
        text: 'Consider adding code examples to illustrate concepts',
        type: 'component',
      });
    }

    // Visual suggestions
    if (qualityIndicators.visualPotential === 'none') {
      suggestions.push({
        id: `suggestion-${suggestionId++}`,
        text: 'Add diagrams or tables to improve visual learning',
        type: 'component',
      });
    }

    // Example suggestions
    if (qualityIndicators.examples === 'none' || qualityIndicators.examples === 'fair') {
      suggestions.push({
        id: `suggestion-${suggestionId++}`,
        text: 'Include more real-world examples to clarify concepts',
        type: 'general',
      });
    }

    // Callout suggestions
    if (detectedElements.callouts === 0) {
      suggestions.push({
        id: `suggestion-${suggestionId++}`,
        text: 'Use callouts to highlight important tips or warnings',
        type: 'callout',
      });
    }

    // Layout suggestions
    const hasContainers = document.blocks.some(
      (b) =>
        b.type === 'two-column' ||
        b.type === 'three-column' ||
        b.type === 'card-grid'
    );
    if (!hasContainers && document.blocks.length > 10) {
      suggestions.push({
        id: `suggestion-${suggestionId++}`,
        text: 'Consider using two-column layout for comparing concepts',
        type: 'layout',
      });
    }

    // Comparison suggestions
    if (detectedElements.comparisons === 0 && document.blocks.length > 8) {
      suggestions.push({
        id: `suggestion-${suggestionId++}`,
        text: 'Add comparison blocks to show differences between concepts',
        type: 'component',
      });
    }

    return suggestions;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    qualityIndicators: any,
    detectedElements: any,
    statistics: any
  ) {
    // Score based on quality indicators
    const qualityScores: Record<string, number> = {
      excellent: 100,
      high: 90,
      good: 75,
      fair: 50,
      poor: 25,
      none: 0,
    };

    const scores = [
      qualityScores[qualityIndicators.readability as string] ?? 50,
      qualityScores[qualityIndicators.structure as string] ?? 50,
      qualityScores[qualityIndicators.completeness as string] ?? 50,
      qualityScores[qualityIndicators.examples as string] ?? 50,
      qualityScores[qualityIndicators.codePresence as string] ?? 50,
      qualityScores[qualityIndicators.visualPotential as string] ?? 50,
    ];

    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    // Boost for content richness
    const elementBoost = Math.min(
      10,
      (detectedElements.headings +
        detectedElements.codeBlocks +
        detectedElements.tables +
        detectedElements.callouts) /
        2
    );

    const finalScore = Math.min(100, Math.round(avgScore + elementBoost));

    // Determine grade
    let grade: 'Excellent' | 'High' | 'Good' | 'Moderate' | 'Low';
    if (finalScore >= 90) grade = 'Excellent';
    else if (finalScore >= 75) grade = 'High';
    else if (finalScore >= 60) grade = 'Good';
    else if (finalScore >= 40) grade = 'Moderate';
    else grade = 'Low';

    // Description
    const description =
      finalScore >= 90
        ? 'Document is well-structured with excellent content quality'
        : finalScore >= 75
        ? 'Document has good structure and content coverage'
        : finalScore >= 60
        ? 'Document meets basic requirements but could be improved'
        : finalScore >= 40
        ? 'Document needs significant improvement in structure or content'
        : 'Document requires substantial revision';

    return {
      score: finalScore,
      grade,
      description,
    };
  }

  /**
   * Extract text content from all blocks
   */
  private getTextContent(document: TutorialDocument): string[] {
    const texts: string[] = [];

    const extractFromBlock = (block: any): void => {
      const c = block.content || block;
      if (block.type === 'heading' && (c.text || block.text)) {
        texts.push(c.text || block.text);
      } else if (block.type === 'paragraph' && (c.text || block.text)) {
        texts.push(c.text || block.text);
      } else if (block.type === 'list' && (c.items || block.items)) {
        const items = c.items || block.items;
        items.forEach((item: any) => {
          if (typeof item === 'string') texts.push(item);
          else if (item?.text) texts.push(item.text);
        });
      } else if (block.type === 'code' && (c.code || block.code)) {
        texts.push(c.code || block.code);
      } else if (block.type === 'quote' && (c.text || block.text)) {
        texts.push(c.text || block.text);
      } else if (block.type === 'callout' && (c.text || c.content || block.content)) {
        texts.push(c.text || c.content || block.content);
      } else if (block.type === 'definition' && (c.term || block.term)) {
        texts.push((c.term || block.term) + ' ' + (c.definition || block.definition));
      } else if (block.type === 'example' && (c.content || block.content)) {
        texts.push(c.content || block.content);
      } else if (block.type === 'summary' && (c.content || block.content)) {
        texts.push(c.content || block.content);
      }

      // Handle containers recursively
      if (block.type === 'two-column' && block.columns) {
        block.columns.forEach((col: any) => {
          col.blocks?.forEach(extractFromBlock);
        });
      } else if (block.type === 'three-column' && block.columns) {
        block.columns.forEach((col: any) => {
          col.blocks?.forEach(extractFromBlock);
        });
      } else if (block.type === 'card-grid' && block.cards) {
        block.cards.forEach((card: any) => {
          if (card.title) texts.push(card.title);
          if (card.content) texts.push(card.content);
        });
      } else if (block.type === 'timeline' && block.events) {
        block.events.forEach((event: any) => {
          if (event.title) texts.push(event.title);
          if (event.description) texts.push(event.description);
        });
      }
    };

    document.blocks.forEach(extractFromBlock);

    return texts;
  }
}

/**
 * Default service instance
 */
export const contentAnalysisService = new ContentAnalysisService();
