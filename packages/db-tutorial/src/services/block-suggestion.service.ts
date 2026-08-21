/**
 * Block Suggestion Service
 * 
 * Generates intelligent block suggestions for TutorialDocument content.
 * 
 * ARCHITECTURE:
 * - Input: TutorialDocument + ContentAnalysisResult
 * - Output: BlockSuggestionResult
 * - Pure analysis (does NOT modify TutorialDocument)
 * - Deterministic (same input → same output for analytical content)
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
 * STATISTICS SEMANTICS:
 * - totalBlocks: All blocks (existing + suggested) for comprehensive count
 * - existingBlocks: Blocks detected from document structure
 * - suggestedBlocks: New intelligent recommendations
 * - Existing blocks have 100% confidence (they exist structurally)
 * - Confidence statistics include ALL blocks for overall quality assessment
 * 
 * DETERMINISM GUARANTEE:
 * - Analytical content IS deterministic: statistics, blocks, sourcePreview, overallConfidence
 * - Metadata is NON-deterministic: generatedAt, processingTimeMs (runtime execution data)
 * - Same input → same analytical results (excluding metadata timestamps)
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
 * V2 MIGRATION: sectionType removed (legacy Tutorial Page column)
 */
export interface SuggestionContext {
  subtopicId?: string;
  brandId?: string;
}

/**
 * Helper function to extract text from block content (CANONICAL STRUCTURE ONLY)
 * Requires nested content structure
 */
function getBlockText(block: any): string {
  if (!block.content) {
    return '';
  }
  return block.content.text || '';
}

/**
 * Helper function to extract level from heading block (CANONICAL STRUCTURE ONLY)
 */
function getHeadingLevel(block: any): number {
  if (!block.content) {
    return 0;
  }
  return block.content.level || 0;
}

/**
 * Helper function to extract style from list block (CANONICAL STRUCTURE ONLY)
 */
function getListStyle(block: any): string {
  if (!block.content) {
    return 'unordered';
  }
  return block.content.style || 'unordered';
}

/**
 * Helper function to extract items from list block (CANONICAL STRUCTURE ONLY)
 */
function getListItems(block: any): any[] {
  if (!block.content) {
    return [];
  }
  return block.content.items || [];
}

/**
 * Helper function to extract language from code block (CANONICAL STRUCTURE ONLY)
 */
function getCodeLanguage(block: any): string {
  if (!block.content) {
    return 'text';
  }
  return block.content.language || 'text';
}

/**
 * Get confidence level band from numeric confidence score
 * 
 * CONFIDENCE BANDS:
 * - High: ≥80%
 * - Medium: 50-79%
 * - Low: <50%
 * 
 * @param confidence - Numeric confidence score (0-100)
 * @returns Confidence level band
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 80) return 'high';
  if (confidence >= 50) return 'medium';
  return 'low';
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
   * @param analysis - ContentAnalysisResult from Prompt 06 (REQUIRED for Summary suggestions)
   * @param context - Optional context metadata
   * @returns BlockSuggestionResult with suggestions
   * 
   * DETERMINISM: The analytical result (statistics, blocks, sourcePreview, overallConfidence)
   * is deterministic. Metadata (generatedAt, processingTimeMs) is intentionally non-deterministic
   * and represents runtime execution metadata.
   */
  generateSuggestions(
    document: TutorialDocument,
    analysis: ContentAnalysisResult,
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
   * 
   * IMPORTANT: ALL canonical TutorialBlock types should be represented as existing blocks
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
          const level = getHeadingLevel(block);
          title = `Heading ${level}`;
          preview = getBlockText(block);
          break;
        case 'paragraph':
          blockType = 'paragraph';
          title = 'Paragraph';
          preview = getBlockText(block).substring(0, 100);
          break;
        case 'list':
          blockType = 'list';
          const listStyle = getListStyle(block);
          title = listStyle === 'unordered' || listStyle === 'bullet' ? 'Bullet List' : 'Numbered List';
          const items = getListItems(block);
          preview = `${items.length} items`;
          break;
        case 'code':
          blockType = 'code';
          title = 'Code Block';
          const language = getCodeLanguage(block);
          preview = `${language} code`;
          break;
        case 'quote':
          blockType = 'quote';
          title = 'Quote';
          preview = getBlockText(block).substring(0, 100);
          break;
        case 'callout':
          blockType = 'callout';
          const variant = (block as any).content?.variant || 'info';
          title = `Callout (${variant})`;
          preview = getBlockText(block).substring(0, 100);
          break;
        case 'definition':
          blockType = 'definition';
          title = 'Definition';
          const term = (block as any).content?.term || '';
          preview = term ? `${term}: ...` : 'Definition';
          break;
        case 'example':
          blockType = 'example';
          title = 'Example';
          preview = 'Example block';
          break;
        case 'summary':
          blockType = 'summary';
          title = 'Summary';
          preview = 'Summary block';
          break;
        case 'diagram':
          blockType = 'diagram';
          title = 'Diagram';
          preview = 'Diagram block';
          break;
        case 'comparison':
          blockType = 'comparison';
          title = 'Comparison';
          preview = 'Comparison block';
          break;
        case 'table':
          blockType = 'table';
          title = 'Table';
          preview = 'Table block';
          break;
        case 'image':
          blockType = 'image';
          title = 'Image';
          preview = 'Image block';
          break;
        default:
          // Container blocks or unknown types - skip
          return;
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
    analysis: ContentAnalysisResult
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
    
    // Rule 6: Summary (section recap) - requires analysis
    suggestions.push(...this.suggestSummary(document, analysis));
    
    // Rule 7: Definition (term explanation)
    suggestions.push(...this.suggestDefinition(document));
    
    // Rule 8: Table (attribute comparison)
    suggestions.push(...this.suggestTable(document));
    
    // Rule 9: Concept Cards (multiple independent concepts)
    suggestions.push(...this.suggestConceptCards(document));
    
    // Rule 10: Timeline (chronological stages) - PRIORITY
    const timelineSuggestions = this.suggestTimeline(document);
    suggestions.push(...timelineSuggestions);
    
    // Get block IDs that received timeline suggestions
    const timelineBlockIds = new Set(
      timelineSuggestions.flatMap(s => s.sourceBlockIds)
    );
    
    // Rule 5: Diagram (process/flow) - but NOT if block already has Timeline
    const diagramSuggestions = this.suggestDiagram(document);
    const filteredDiagramSuggestions = diagramSuggestions.filter(suggestion =>
      !suggestion.sourceBlockIds.some(blockId => timelineBlockIds.has(blockId))
    );
    suggestions.push(...filteredDiagramSuggestions);
    
    return suggestions;
  }

  /**
   * RULE 1: Two Column - Detect parallel concepts
   * 
   * Detects H3 headings that represent parallel concepts, even if they have
   * content blocks between them (within reasonable distance).
   */
  private suggestTwoColumn(document: TutorialDocument): BlockSuggestion[] {
    const suggestions: BlockSuggestion[] = [];
    const blocks = document.blocks;
    
    // Find all H3 headings
    const h3Headings: Array<{ index: number; block: any }> = [];
    blocks.forEach((block, index) => {
      if (block.type === 'heading' && getHeadingLevel(block) === 3) {
        h3Headings.push({ index, block });
      }
    });
    
    // Check consecutive H3 pairs (allowing content between them, max 5 blocks apart)
    for (let i = 0; i < h3Headings.length - 1; i++) {
      const heading1 = h3Headings[i];
      const heading2 = h3Headings[i + 1];
      
      // Only consider headings that are reasonably close (max 5 blocks apart)
      const distance = heading2.index - heading1.index;
      if (distance > 5) continue;
      
      const text1 = getBlockText(heading1.block).toLowerCase();
      const text2 = getBlockText(heading2.block).toLowerCase();
      
      // Check for parallel concept pairs (both must be present)
      const parallelPairs = [
        ['client', 'server'],
        ['frontend', 'backend'],
        ['left', 'right'],
        ['pros', 'cons'],
        ['advantages', 'disadvantages'],
        ['before', 'after'],
      ];
      
      const isParallelPair = parallelPairs.some(([a, b]) =>
        (text1.includes(a) && text2.includes(b)) ||
        (text1.includes(b) && text2.includes(a))
      );
      
      if (isParallelPair) {
        // Collect all blocks between the two headings
        const sectionBlocks = blocks.slice(heading1.index, heading2.index + 1);
        const sourceBlockIds = sectionBlocks.map(b => b.id);
        
        const confidence = 72;
        
        suggestions.push({
          id: `suggestion-twocol-${heading1.index}`,
          kind: 'suggested',
          blockType: 'two-column',
          title: 'Two Column',
          preview: `${getBlockText(heading1.block)} | ${getBlockText(heading2.block)}`,
          confidence,
          confidenceLevel: getConfidenceLevel(confidence),
          reason: 'Parallel concepts detected and suitable for side-by-side presentation',
          sourceBlockIds,
          sourceText: `${getBlockText(heading1.block)}\n${getBlockText(heading2.block)}`,
          status: 'pending',
        });
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
        const text = getBlockText(block).toLowerCase();
        
        const comparisonPatterns = [
          'vs',
          'versus',
          'compared to',
          'difference between',
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
            preview: getBlockText(block).substring(0, 100),
            confidence,
            confidenceLevel: getConfidenceLevel(confidence),
            reason: 'Comparison language detected - content would benefit from side-by-side comparison structure',
            sourceBlockIds: [block.id],
            sourceText: getBlockText(block),
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
        const text = (getBlockText(block) || '').toLowerCase();
        
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
              preview: (getBlockText(block) || '').substring(0, 100),
              confidence,
              confidenceLevel: getConfidenceLevel(confidence),
              reason: `Detected ${pattern} indicator - content should be highlighted as a ${variant} callout`,
              sourceBlockIds: [block.id],
              sourceText: getBlockText(block),
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
        const text = (getBlockText(block) || '').toLowerCase();
        
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
            preview: (getBlockText(block) || '').substring(0, 100),
            confidence,
            confidenceLevel: getConfidenceLevel(confidence),
            reason: 'Example language detected - would be clearer as a dedicated example block',
            sourceBlockIds: [block.id],
            sourceText: getBlockText(block),
            status: 'pending',
          });
        }
      }
    }
    
    return suggestions;
  }

  /**
   * RULE 5: Diagram - Detect process/flow patterns
   * 
   * Uses word-boundary matching to avoid false positives like "processing"
   */
  private suggestDiagram(document: TutorialDocument): BlockSuggestion[] {
    const suggestions: BlockSuggestion[] = [];
    const blocks = document.blocks;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.type === 'paragraph' || block.type === 'list') {
        const text = (getBlockText(block) || getListItems(block)?.map((item: any) => item.text).join(' ') || '').toLowerCase();
        
        // Strong diagram signals (word-boundary aware)
        const strongPatterns = [
          /\bstep 1\b/i,
          /\bstep 2\b/i,
          /\bworkflow\b/i,
          /\barchitecture\b/i,
          /\blifecycle\b/i,
          /\bflow\b/i,
        ];
        
        // Weak signals that need additional context (not enough alone)
        // Removed: 'process', 'then', 'next' - too generic
        
        // Check for strong patterns or arrow notation
        const hasStrongDiagramPattern = 
          strongPatterns.some(pattern => pattern.test(text)) ||
          text.includes('→');
        
        if (hasStrongDiagramPattern) {
          const confidence = 65;
          
          suggestions.push({
            id: `suggestion-diagram-${i}`,
            kind: 'suggested',
            blockType: 'diagram',
            title: 'Diagram',
            preview: 'Process/workflow detected',
            confidence,
            confidenceLevel: getConfidenceLevel(confidence),
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
  private suggestSummary(document: TutorialDocument, analysis: ContentAnalysisResult): BlockSuggestion[] {
    const suggestions: BlockSuggestion[] = [];
    
    // Only suggest if document has sufficient content
    const wordCount = analysis.statistics.totalWords;
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
          confidenceLevel: getConfidenceLevel(confidence),
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
        const text = getBlockText(block) || '';
        
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
              confidenceLevel: getConfidenceLevel(confidence),
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
        const items = getListItems(block) || [];
        
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
            confidenceLevel: getConfidenceLevel(confidence),
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
    
    const checkAndGenerateSuggestion = (headings: any[], index: number) => {
      if (headings.length >= 3 && headings.length <= 6) {
        const confidence = 62;
        
        suggestions.push({
          id: `suggestion-cards-${index}`,
          kind: 'suggested',
          blockType: 'concept-cards',
          title: 'Concept Cards',
          preview: `${headings.length} independent concepts`,
          confidence,
          confidenceLevel: getConfidenceLevel(confidence),
          reason: 'Multiple independent concepts detected - card grid layout would improve scannability',
          sourceBlockIds: headings.map(h => h.id),
          status: 'pending',
        });
      }
    };
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.type === 'heading' && getHeadingLevel(block) === 3) {
        consecutiveHeadings.push(block);
      } else if (consecutiveHeadings.length > 0) {
        checkAndGenerateSuggestion(consecutiveHeadings, i);
        consecutiveHeadings = [];
      }
    }
    
    // Final flush: check any remaining consecutive headings at end of document
    if (consecutiveHeadings.length > 0) {
      checkAndGenerateSuggestion(consecutiveHeadings, blocks.length);
    }
    
    return suggestions;
  }

  /**
   * RULE 10: Timeline - Detect chronological stages
   * 
   * NOTE: Excludes overly generic words like "before", "after" to avoid false positives
   */
  private suggestTimeline(document: TutorialDocument): BlockSuggestion[] {
    const suggestions: BlockSuggestion[] = [];
    const blocks = document.blocks;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.type === 'list') {
        const items = getListItems(block) || [];
        const allText = items.map((item: any) => item.text || '').join(' ').toLowerCase();
        
        // Removed "before", "after" - too generic and cause false positives
        const timelinePatterns = [
          'first',
          'then',
          'later',
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
            confidenceLevel: getConfidenceLevel(confidence),
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
      // Create a key from blockType + sourceBlockIds (immutable sort)
      const key = `${suggestion.blockType}-${[...suggestion.sourceBlockIds].sort().join(',')}`;
      
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
    // Extract raw text from all blocks using canonical helpers
    const getBlockPreviewText = (block: any): string => {
      switch (block.type) {
        case 'heading':
        case 'paragraph':
        case 'quote':
          return getBlockText(block);
        
        case 'code':
          const codeContent = block.content || block;
          return codeContent.code || '';
        
        case 'list':
          return getListItems(block)
            .map((item: any) => item.text || '')
            .join('\n');
        
        default:
          return '';
      }
    };
    
    const raw = document.blocks
      .map(getBlockPreviewText)
      .filter(Boolean)
      .join('\n\n');
    
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
}

/**
 * Default service instance
 */
export const blockSuggestionService = new BlockSuggestionService();

