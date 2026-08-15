/**
 * Block Suggestion Service
 * 
 * Generates intelligent block suggestions for TutorialDocument content.
 * 
 * ARCHITECTURE:
 * - Input: TutorialDocument + ContentAnalysisResult
 * - Output: BlockSuggestionResult
 * - Pure analysis (does NOT modify TutorialDocument)
 * - Deterministic (same input → same output)
 * - No database writes
 * - No legacy dependencies
 * 
 * SUGGESTION SEMANTICS:
 * - "existing": Blocks detected from content analysis (not suggestions)
 * - "suggested": Intelligent recommendations to improve content presentation
 * 
 * CONFIDENCE SEMANTICS:
 * Confidence values are deterministic structural-analysis confidence scores,
 * NOT statistically calibrated ML probabilities.
 * 
 * Example: confidence: 85 means:
 *   "The deterministic rules found strong evidence for this suggestion"
 * 
 * NOT: "85% statistical probability this is correct"
 * 
 * CONFIDENCE BANDS:
 * - High: ≥80%
 * - Medium: 50-79%
 * - Low: <50%
 * 
 * PROMPT 07B BACKEND IMPLEMENTATION
 */

import type {
  TutorialDocument,
  ContentAnalysisResult,
  BlockSuggestionResult,
  BlockSuggestion,
  BlockSuggestionKind,
  BlockSuggestionType,
  ConfidenceLevel,
} from '@quiz/types';

/**
 * Suggestion context (optional metadata)
 */
export interface SuggestionContext {
  subtopicId?: string;
  sectionType?: string;
  brandId?: string;
}

/**
 * Block Suggestion Service
 * Generates intelligent suggestions for content block improvements
 */
export class BlockSuggestionService {
  /**
   * Generate block suggestions for a TutorialDocument
   * 
   * @param document - TutorialDocument to analyze
   * @param analysis - ContentAnalysisResult (optional, can be recomputed)
   * @param context - Optional context metadata
   * @returns BlockSuggestionResult with suggestions
   */
  generateSuggestions(
    document: TutorialDocument,
    analysis?: ContentAnalysisResult,
    context?: SuggestionContext
  ): BlockSuggestionResult {
    const startTime = Date.now();
    
    // Step 1: Build list of existing detected blocks
    const existingBlocks = this.detectExistingBlocks(document);
    
    // Step 2: Generate intelligent suggestions
    const suggestions = this.generateIntelligentSuggestions(document, analysis);
    
    // Step 3: Remove duplicates
    const deduplicatedSuggestions = this.deduplicateSuggestions(suggestions);
    
    // Step 4: Combine existing + suggested
    const allBlocks = [...existingBlocks, ...deduplicatedSuggestions];
    
    // Step 5: Calculate statistics
    const statistics = this.calculateStatistics(allBlocks);
    
    // Step 6: Generate source preview
    const sourcePreview = this.generateSourcePreview(document);
    
    // Step 7: Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(allBlocks);
    
    const processingTimeMs = Date.now() - startTime;
    
    return {
      subtopicId: context?.subtopicId,
      statistics,
      blocks: allBlocks,
      sourcePreview,
      overallConfidence,
      metadata: {
        analysisVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
        processingTimeMs,
      },
    };
  }

  /**
   * Detect existing blocks from the document
   * These are structural elements, not suggestions
   */
  private detectExistingBlocks(document: TutorialDocument): BlockSuggestion[] {
    const existing: BlockSuggestion[] = [];
    
    document.blocks.forEach((block, index) => {
      let blockType: BlockSuggestionType;
      let title: string;
      let preview: string;
      
      switch (block.type) {
        case 'heading':
          blockType = 'heading';
          title = `Heading ${(block as any).level}`;
          preview = (block as any).text || '';
          break;
        case 'paragraph':
          blockType = 'paragraph';
          title = 'Paragraph';
          preview = ((block as any).text || '').substring(0, 100);
          break;
        case 'list':
          blockType = 'list';
          title = (block as any).style === 'bullet' ? 'Bullet List' : 'Numbered List';
          preview = `${(block as any).items?.length || 0} items`;
          break;
        case 'code':
          blockType = 'code';
          title = 'Code Block';
          preview = `${(block as any).language || 'text'} code`;
          break;
        case 'quote':
          blockType = 'quote';
          title = 'Quote';
          preview = ((block as any).text || '').substring(0, 100);
          break;
        default:
          return; // Skip other block types for existing detection
      }
      
      existing.push({
        id: `existing-${block.id}`,
        kind: 'existing',
        blockType,
        title,
        preview,
        confidence: 100, // Existing blocks have 100% confidence (they exist)
        confidenceLevel: 'high',
        reason: 'Detected from existing content structure',
        sourceBlockIds: [block.id],
        status: 'pending',
      });
    });
    
    return existing;
  }

  /**
   * Generate intelligent suggestions based on content patterns
   */
  private generateIntelligentSuggestions(
    document: TutorialDocument,
    analysis?: ContentAnalysisResult
  ): BlockSuggestion[] {
    const suggestions: BlockSuggestion[] = [];
    
    // Rule 1: Two Column (parallel concepts)
    suggestions.push(...this.suggestTwoColumn(document));
    
    // Rule 2: Comparison (A vs B)
    suggestions.push(...this.suggestComparison(document));
    
    // Rule 3: Callout (important/warning/tip)
    suggestions.push(...this.suggestCallout(document));
    
    // Rule 4: Example (real-world use case)
    suggestions.push(...this.suggestExample(document));
    
    // Rule 5: Diagram (process/flow)
    suggestions.push(...this.suggestDiagram(document));
    
    // Rule 6: Summary (section recap)
    suggestions.push(...this.suggestSummary(document, analysis));
    
    // Rule 7: Definition (term explanation)
    suggestions.push(...this.suggestDefinition(document));
    
    // Rule 8: Table (attribute comparison)
    suggestions.push(...this.suggestTable(document));
    
    // Rule 9: Concept Cards (multiple independent concepts)
    suggestions.push(...this.suggestConceptCards(document));
    
    // Rule 10: Timeline (chronological stages)
    suggestions.push(...this.suggestTimeline(document));
    
    return suggestions;
  }

  /**
   * RULE 1: Two Column - Detect parallel concepts
   */
  private suggestTwoColumn(document: TutorialDocument): BlockSuggestion[] {
    const suggestions: BlockSuggestion[] = [];
    const blocks = document.blocks;
    
    for (let i = 0; i < blocks.length - 1; i++) {
      const block1 = blocks[i];
      const block2 = blocks[i + 1];
      
      if (block1.type === 'heading' && (block1 as any).level === 3 &&
          block2.type === 'heading' && (block2 as any).level === 3) {
        
        const text1 = (block1 as any).text?.toLowerCase() || '';
        const text2 = (block2 as any).text?.toLowerCase() || '';
        
        // Check for parallel concept indicators
        const parallelIndicators = [
          'client', 'server',
          'frontend', 'backend',
          'left', 'right',
          'pros', 'cons',
          'advantages', 'disadvantages',
          'before', 'after',
        ];
        
        const hasParallelConcept = parallelIndicators.some(indicator =>
          text1.includes(indicator) || text2.includes(indicator)
        );
        
        if (hasParallelConcept) {
          const confidence = 72;
          
          suggestions.push({
            id: `suggestion-twocol-${i}`,
            kind: 'suggested',
            blockType: 'two-column',
            title: 'Two Column',
            preview: `${(block1 as any).text} | ${(block2 as any).text}`,
            confidence,
            confidenceLevel: this.getConfidenceLevel(confidence),
            reason: 'Parallel concepts detected and suitable for side-by-side presentation',
            sourceBlockIds: [block1.id, block2.id],
            sourceText: `${(block1 as any).text}\n${(block2 as any).text}`,
            status: 'pending',
          });
        }
      }
    }
    
    return suggestions;
  }

  /**
   * RULE 2: Comparison - Detect A vs B patterns
   */
  private suggestComparison(document: TutorialDocument): BlockSuggestion[] {
    const suggestions: BlockSuggestion[] = [];
    const blocks = document.blocks;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.type === 'paragraph' || block.type === 'heading') {
        const text = ((block as any).text || '').toLowerCase();
        
        const comparisonPatterns = [
          'vs',
          'versus',
          'compared to',
          'difference between',
          'while',
          'whereas',
          'on the other hand',
        ];
        
        const hasComparison = comparisonPatterns.some(pattern => text.includes(pattern));
        
        if (hasComparison) {
          const confidence = 75;
          
          suggestions.push({
            id: `suggestion-comparison-${i}`,
            kind: 'suggested',
            blockType: 'comparison',
            title: 'Comparison Block',
            preview: ((block as any).text || '').substring(0, 100),
            confidence,
            confidenceLevel: this.getConfidenceLevel(confidence),
            reason: 'Comparison language detected - content would benefit from side-by-side comparison structure',
            sourceBlockIds: [block.id],
            sourceText: (block as any).text,
            status: 'pending',
          });
        }
      }
    }
    
    return suggestions;
  }

  /**
   * RULE 3: Callout - Detect important/warning/tip patterns
   */
  private suggestCallout(document: TutorialDocument): BlockSuggestion[] {
    const suggestions: BlockSuggestion[] = [];
    const blocks = document.blocks;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.type === 'paragraph') {
        const text = ((block as any).text || '').toLowerCase();
        
        const calloutPatterns = [
          { pattern: 'important', variant: 'warning', confidence: 85 },
          { pattern: 'note:', variant: 'info', confidence: 90 },
          { pattern: 'warning', variant: 'warning', confidence: 95 },
          { pattern: 'caution', variant: 'warning', confidence: 90 },
          { pattern: 'tip:', variant: 'tip', confidence: 90 },
          { pattern: 'remember', variant: 'info', confidence: 80 },
          { pattern: 'key point', variant: 'info', confidence: 85 },
        ];
        
        for (const { pattern, variant, confidence } of calloutPatterns) {
          if (text.includes(pattern)) {
            suggestions.push({
              id: `suggestion-callout-${i}`,
              kind: 'suggested',
              blockType: 'callout',
              title: `Callout (${variant})`,
              preview: ((block as any).text || '').substring(0, 100),
              confidence,
              confidenceLevel: this.getConfidenceLevel(confidence),
              reason: `Detected ${pattern} indicator - content should be highlighted as a ${variant} callout`,
              sourceBlockIds: [block.id],
              sourceText: (block as any).text,
              status: 'pending',
            });
            break;
          }
        }
      }
    }
    
    return suggestions;
  }

  /**
   * RULE 4: Example - Detect real-world examples
   */
  private suggestExample(document: TutorialDocument): BlockSuggestion[] {
    const suggestions: BlockSuggestion[] = [];
    const blocks = document.blocks;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.type === 'paragraph') {
        const text = ((block as any).text || '').toLowerCase();
        
        const examplePatterns = [
          'for example',
          'for instance',
          'real-world example',
          'use case',
          'scenario',
          'let\'s say',
          'imagine',
        ];
        
        const hasExample = examplePatterns.some(pattern => text.includes(pattern));
        
        if (hasExample) {
          const confidence = 78;
          
          suggestions.push({
            id: `suggestion-example-${i}`,
            kind: 'suggested',
            blockType: 'example',
            title: 'Example Block',
            preview: ((block as any).text || '').substring(0, 100),
            confidence,
            confidenceLevel: this.getConfidenceLevel(confidence),
            reason: 'Example language detected - would be clearer as a dedicated example block',
            sourceBlockIds: [block.id],
            sourceText: (block as any).text,
            status: 'pending',
          });
        }
      }
    }
    
    return suggestions;
  }

  /**
   * RULE 5: Diagram - Detect process/flow patterns
   */
  private suggestDiagram(document: TutorialDocument): BlockSuggestion[] {
    const suggestions: BlockSuggestion[] = [];
    const blocks = document.blocks;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.type === 'paragraph' || block.type === 'list') {
        const text = ((block as any).text || (block as any).items?.map((item: any) => item.text).join(' ') || '').toLowerCase();
        
        const diagramPatterns = [
          'step 1',
          'step 2',
          'workflow',
          'process',
          'lifecycle',
          'architecture',
          'flow',
          '→',
          'then',
          'next',
        ];
        
        const hasDiagramPattern = diagramPatterns.some(pattern => text.includes(pattern));
        
        if (hasDiagramPattern) {
          const confidence = 65;
          
          suggestions.push({
            id: `suggestion-diagram-${i}`,
            kind: 'suggested',
            blockType: 'diagram',
            title: 'Diagram',
            preview: 'Process/workflow detected',
            confidence,
            confidenceLevel: this.getConfidenceLevel(confidence),
            reason: 'Process or workflow language detected - visual diagram would improve understanding',
            sourceBlockIds: [block.id],
            status: 'pending',
          });
        }
      }
    }
    
    return suggestions;
  }

  /**
   * RULE 6: Summary - Suggest for substantial sections
   */
  private suggestSummary(document: TutorialDocument, analysis?: ContentAnalysisResult): BlockSuggestion[] {
    const suggestions: BlockSuggestion[] = [];
    
    // Only suggest if document has sufficient content
    const wordCount = analysis?.statistics?.totalWords || 0;
    const hasEnoughContent = wordCount >= 500;
    
    if (hasEnoughContent) {
      // Check if summary already exists
      const hasSummary = document.blocks.some(b => b.type === 'summary');
      
      if (!hasSummary) {
        const confidence = 70;
        
        suggestions.push({
          id: 'suggestion-summary',
          kind: 'suggested',
          blockType: 'summary',
          title: 'Summary Block',
          preview: 'End-of-section summary',
          confidence,
          confidenceLevel: this.getConfidenceLevel(confidence),
          reason: 'Document has substantial content but lacks a concluding summary',
          sourceBlockIds: [], // Document-level suggestion
          status: 'pending',
        });
      }
    }
    
    return suggestions;
  }

  /**
   * RULE 7: Definition - Detect term definitions
   */
  private suggestDefinition(document: TutorialDocument): BlockSuggestion[] {
    const suggestions: BlockSuggestion[] = [];
    const blocks = document.blocks;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.type === 'paragraph') {
        const text = (block as any).text || '';
        
        const definitionPatterns = [
          /(\w+) is (a|an) /i,
          /(\w+) refers to /i,
          /(\w+) means /i,
          /(\w+) is defined as /i,
        ];
        
        for (const pattern of definitionPatterns) {
          if (pattern.test(text)) {
            const confidence = 82;
            
            suggestions.push({
              id: `suggestion-definition-${i}`,
              kind: 'suggested',
              blockType: 'definition',
              title: 'Definition Block',
              preview: text.substring(0, 100),
              confidence,
              confidenceLevel: this.getConfidenceLevel(confidence),
              reason: 'Definition pattern detected - would be clearer as a dedicated definition block',
              sourceBlockIds: [block.id],
              sourceText: text,
              status: 'pending',
            });
            break;
          }
        }
      }
    }
    
    return suggestions;
  }

  /**
   * RULE 8: Table - Detect attribute comparisons
   */
  private suggestTable(document: TutorialDocument): BlockSuggestion[] {
    const suggestions: BlockSuggestion[] = [];
    const blocks = document.blocks;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.type === 'list') {
        const items = (block as any).items || [];
        
        // Check if list items have consistent structure suggesting tabular data
        const hasColonPattern = items.filter((item: any) => 
          (item.text || '').includes(':')
        ).length;
        
        if (hasColonPattern >= 3 && hasColonPattern === items.length) {
          const confidence = 68;
          
          suggestions.push({
            id: `suggestion-table-${i}`,
            kind: 'suggested',
            blockType: 'table',
            title: 'Table',
            preview: `${items.length} rows with structured attributes`,
            confidence,
            confidenceLevel: this.getConfidenceLevel(confidence),
            reason: 'List contains structured attribute data that would be clearer as a table',
            sourceBlockIds: [block.id],
            status: 'pending',
          });
        }
      }
    }
    
    return suggestions;
  }

  /**
   * RULE 9: Concept Cards - Detect multiple independent concepts
   */
  private suggestConceptCards(document: TutorialDocument): BlockSuggestion[] {
    const suggestions: BlockSuggestion[] = [];
    const blocks = document.blocks;
    
    // Look for 3-6 consecutive headings at the same level
    let consecutiveHeadings: any[] = [];
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.type === 'heading' && (block as any).level === 3) {
        consecutiveHeadings.push(block);
      } else if (consecutiveHeadings.length > 0) {
        if (consecutiveHeadings.length >= 3 && consecutiveHeadings.length <= 6) {
          const confidence = 62;
          
          suggestions.push({
            id: `suggestion-cards-${i}`,
            kind: 'suggested',
            blockType: 'concept-cards',
            title: 'Concept Cards',
            preview: `${consecutiveHeadings.length} independent concepts`,
            confidence,
            confidenceLevel: this.getConfidenceLevel(confidence),
            reason: 'Multiple independent concepts detected - card grid layout would improve scannability',
            sourceBlockIds: consecutiveHeadings.map(h => h.id),
            status: 'pending',
          });
        }
        consecutiveHeadings = [];
      }
    }
    
    return suggestions;
  }

  /**
   * RULE 10: Timeline - Detect chronological stages
   */
  private suggestTimeline(document: TutorialDocument): BlockSuggestion[] {
    const suggestions: BlockSuggestion[] = [];
    const blocks = document.blocks;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.type === 'list') {
        const items = (block as any).items || [];
        const allText = items.map((item: any) => item.text || '').join(' ').toLowerCase();
        
        const timelinePatterns = [
          'first',
          'then',
          'later',
          'before',
          'after',
          'phase 1',
          'phase 2',
          'step 1',
          'step 2',
          'history',
          'evolution',
        ];
        
        const hasTimelinePattern = timelinePatterns.filter(pattern => 
          allText.includes(pattern)
        ).length >= 2;
        
        if (hasTimelinePattern && items.length >= 3) {
          const confidence = 64;
          
          suggestions.push({
            id: `suggestion-timeline-${i}`,
            kind: 'suggested',
            blockType: 'timeline',
            title: 'Timeline',
            preview: `${items.length} chronological stages`,
            confidence,
            confidenceLevel: this.getConfidenceLevel(confidence),
            reason: 'Chronological progression detected - timeline visualization would clarify sequence',
            sourceBlockIds: [block.id],
            status: 'pending',
          });
        }
      }
    }
    
    return suggestions;
  }

  /**
   * Remove duplicate suggestions
   */
  private deduplicateSuggestions(suggestions: BlockSuggestion[]): BlockSuggestion[] {
    const seen = new Set<string>();
    const deduplicated: BlockSuggestion[] = [];
    
    for (const suggestion of suggestions) {
      // Create a key from blockType + sourceBlockIds
      const key = `${suggestion.blockType}-${suggestion.sourceBlockIds.sort().join(',')}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(suggestion);
      }
    }
    
    return deduplicated;
  }

  /**
   * Calculate statistics
   */
  private calculateStatistics(blocks: BlockSuggestion[]) {
    const existing = blocks.filter(b => b.kind === 'existing');
    const suggested = blocks.filter(b => b.kind === 'suggested');
    
    const highConfidence = blocks.filter(b => b.confidenceLevel === 'high').length;
    const mediumConfidence = blocks.filter(b => b.confidenceLevel === 'medium').length;
    const lowConfidence = blocks.filter(b => b.confidenceLevel === 'low').length;
    
    const sectionsDetected = blocks.filter(b => 
      b.blockType === 'heading' && b.kind === 'existing'
    ).length;
    
    const byType: Record<string, number> = {};
    blocks.forEach(b => {
      byType[b.blockType] = (byType[b.blockType] || 0) + 1;
    });
    
    return {
      totalBlocks: blocks.length,
      existingBlocks: existing.length,
      suggestedBlocks: suggested.length,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      sectionsDetected,
      byType,
    };
  }

  /**
   * Generate source preview
   */
  private generateSourcePreview(document: TutorialDocument) {
    // Extract raw text from all blocks
    const extractText = (block: any): string => {
      if (block.text) return block.text;
      if (block.content) return block.content;
      if (block.items) return block.items.map((item: any) => item.text || '').join('\n');
      if (block.code) return block.code;
      return '';
    };
    
    const raw = document.blocks.map(extractText).join('\n\n');
    
    return {
      raw: raw.substring(0, 5000), // Limit to 5000 chars
    };
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(blocks: BlockSuggestion[]): number {
    const suggested = blocks.filter(b => b.kind === 'suggested');
    
    if (suggested.length === 0) return 100;
    
    const avgConfidence = suggested.reduce((sum, b) => sum + b.confidence, 0) / suggested.length;
    return Math.round(avgConfidence);
  }

  /**
   * Get confidence level band
   */
  private getConfidenceLevel(confidence: number): ConfidenceLevel {
    if (confidence >= 80) return 'high';
    if (confidence >= 50) return 'medium';
    return 'low';
  }
}

/**
 * Default service instance
 */
export const blockSuggestionService = new BlockSuggestionService();
