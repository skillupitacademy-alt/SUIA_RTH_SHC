/**
 * Presentation Ideas Service
 * PROMPT 14B: Generates intelligent presentation recommendations for tutorial content
 * 
 * ARCHITECTURE:
 * - PURE DETERMINISTIC (no database writes, no side effects)
 * - Input: TutorialDocument + ContentAnalysisResult + BlockSuggestionResult
 * - Output: PresentationIdeasResult
 * - Stable IDs (same input → same IDs)
 * - concept-cards recommendations map to canonical card-grid block type
 * 
 * RESPONSIBILITIES:
 * - Analyze content structure and suggest presentation improvements
 * - Detect opportunities for two-column, comparison, card-grid, timeline layouts
 * - Recommend callouts for important content
 * - Suggest code examples and diagrams
 * - Provide best practices guidance
 * - Generate deterministic, stable recommendation IDs
 * 
 * CONSTRAINTS:
 * - NO database mutations
 * - NO random IDs (use deterministic hashing)
 * - Respects BLOCK_REGISTRY (17 canonical types only)
 * - Never creates 'concept-cards' block type (uses 'card-grid' instead)
 */

import type {
  TutorialDocument,
  ContentAnalysisResult,
  BlockSuggestionResult,
  PresentationIdeasResult,
  PresentationIdea,
  PresentationImpact,
  PresentationIdeaType,
  WireframeType,
  PresentationConfig,
  PresentationIdeasStatistics,
  ContextOutline,
  BestPractice,
  BlockSuggestion,
} from '@quiz/types';

/**
 * Presentation Ideas Service Context
 */
export interface PresentationIdeasContext {
  subtopicId?: string;
  sectionType?: string;
  brandId?: string;
}

/**
 * Presentation Ideas Service
 */
export class PresentationIdeasService {
  /**
   * Generate presentation ideas for tutorial content
   * 
   * @param document - TutorialDocument to analyze
   * @param analysis - ContentAnalysisResult (required for context)
   * @param blockSuggestions - BlockSuggestionResult (required for suggestions)
   * @param context - Optional context metadata
   * @returns PresentationIdeasResult with recommendations
   */
  generatePresentationIdeas(
    document: TutorialDocument,
    analysis: ContentAnalysisResult,
    blockSuggestions: BlockSuggestionResult,
    context?: PresentationIdeasContext
  ): PresentationIdeasResult {
    const startTime = Date.now();
    
    // Generate presentation ideas from multiple sources
    const ideas: PresentationIdea[] = [];
    
    // 1. Extract ideas from block suggestions (concept-cards, two-column, comparison, etc.)
    const suggestionIdeas = this.extractIdeasFromSuggestions(blockSuggestions);
    ideas.push(...suggestionIdeas);
    
    // 2. Analyze content structure for additional opportunities
    const structureIdeas = this.analyzeContentStructure(document, analysis);
    ideas.push(...structureIdeas);
    
    // 3. Detect callout opportunities
    const calloutIdeas = this.detectCalloutOpportunities(document, analysis);
    ideas.push(...calloutIdeas);
    
    // 4. Suggest timeline for chronological content
    const timelineIdeas = this.suggestTimelines(document, analysis);
    ideas.push(...timelineIdeas);
    
    // 5. Remove duplicates (de-duplicate based on sourceBlockIds)
    const uniqueIdeas = this.deduplicateIdeas(ideas);
    
    // Calculate statistics
    const statistics = this.calculateStatistics(uniqueIdeas);
    
    // Build context outline
    const contextOutline = this.buildContextOutline(document, analysis);
    
    // Generate best practices
    const bestPractices = this.generateBestPractices(document, analysis, uniqueIdeas);
    
    const processingTimeMs = Date.now() - startTime;
    
    return {
      ideas: uniqueIdeas,
      statistics,
      contextOutline,
      bestPractices,
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTimeMs,
        documentVersion: document.schemaVersion,
      },
    };
  }
  
  /**
   * Extract presentation ideas from block suggestions
   * Maps concept-cards → card-grid
   */
  private extractIdeasFromSuggestions(
    blockSuggestions: BlockSuggestionResult
  ): PresentationIdea[] {
    const ideas: PresentationIdea[] = [];
    
    // Only process 'suggested' blocks (not 'existing' detected blocks)
    const suggestedBlocks = blockSuggestions.blocks.filter(
      (block: BlockSuggestion) => block.kind === 'suggested'
    );
    
    for (const suggestion of suggestedBlocks) {
      let idea: PresentationIdea | null = null;
      
      switch (suggestion.blockType) {
        case 'concept-cards':
          // CRITICAL: Map concept-cards suggestion → card-grid block type
          idea = {
            id: this.generateStableId('card-grid', suggestion.sourceBlockIds),
            title: 'Concept Cards Grid',
            description: 'Display related concepts as interactive cards in a grid layout',
            type: 'card-grid',
            impact: this.determineImpact(suggestion.confidence),
            appliesToSection: undefined,
            sourceBlockIds: suggestion.sourceBlockIds,
            targetBlockType: 'card-grid', // NOT concept-cards
            wireframeType: 'concept-cards-grid',
            reason: suggestion.reason || 'Multiple independent concepts detected',
            presentationConfig: {
              targetBlockType: 'card-grid',
              columns: this.calculateCardGridColumns(suggestion.sourceBlockIds.length),
              gap: 'normal',
            },
            isSelected: false,
            status: 'pending',
          };
          break;
        
        case 'two-column':
          idea = {
            id: this.generateStableId('two-column', suggestion.sourceBlockIds),
            title: 'Two-Column Layout',
            description: 'Present related content side-by-side for easy comparison',
            type: 'layout',
            impact: this.determineImpact(suggestion.confidence),
            sourceBlockIds: suggestion.sourceBlockIds,
            targetBlockType: 'two-column',
            wireframeType: this.determineTwoColumnWireframe(suggestion),
            reason: suggestion.reason || 'Parallel concepts detected',
            presentationConfig: {
              targetBlockType: 'two-column',
              ratio: '50-50',
              gap: 'normal',
            },
            isSelected: false,
            status: 'pending',
          };
          break;
        
        case 'three-column':
          idea = {
            id: this.generateStableId('three-column', suggestion.sourceBlockIds),
            title: 'Three-Column Layout',
            description: 'Organize content into three balanced columns',
            type: 'layout',
            impact: this.determineImpact(suggestion.confidence),
            sourceBlockIds: suggestion.sourceBlockIds,
            targetBlockType: 'three-column',
            wireframeType: 'three-column',
            reason: suggestion.reason || 'Three parallel sections detected',
            presentationConfig: {
              targetBlockType: 'three-column',
              gap: 'normal',
            },
            isSelected: false,
            status: 'pending',
          };
          break;
        
        case 'comparison':
          idea = {
            id: this.generateStableId('comparison', suggestion.sourceBlockIds),
            title: 'Comparison Table',
            description: 'Highlight differences and similarities in a structured table',
            type: 'comparison',
            impact: this.determineImpact(suggestion.confidence),
            sourceBlockIds: suggestion.sourceBlockIds,
            targetBlockType: 'comparison',
            wireframeType: 'comparison-table',
            reason: suggestion.reason || 'Contrasting concepts detected',
            presentationConfig: {
              targetBlockType: 'comparison',
              hasHeader: true,
            },
            isSelected: false,
            status: 'pending',
          };
          break;
        
        case 'callout':
          idea = {
            id: this.generateStableId('callout', suggestion.sourceBlockIds),
            title: 'Important Callout',
            description: 'Emphasize key information with a callout box',
            type: 'callout',
            impact: this.determineImpact(suggestion.confidence),
            sourceBlockIds: suggestion.sourceBlockIds,
            targetBlockType: 'callout',
            wireframeType: 'callout-info',
            reason: suggestion.reason || 'Important concept detected',
            presentationConfig: {
              targetBlockType: 'callout',
              variant: 'info',
            },
            isSelected: false,
            status: 'pending',
          };
          break;
        
        case 'timeline':
          idea = {
            id: this.generateStableId('timeline', suggestion.sourceBlockIds),
            title: 'Timeline Visualization',
            description: 'Display chronological or sequential content as a timeline',
            type: 'timeline',
            impact: this.determineImpact(suggestion.confidence),
            sourceBlockIds: suggestion.sourceBlockIds,
            targetBlockType: 'timeline',
            wireframeType: 'timeline-vertical',
            reason: suggestion.reason || 'Sequential content detected',
            presentationConfig: {
              targetBlockType: 'timeline',
              orientation: 'vertical',
            },
            isSelected: false,
            status: 'pending',
          };
          break;

        case 'table':
          idea = {
            id: this.generateStableId('table', suggestion.sourceBlockIds),
            title: 'Structured Table Layout',
            description: 'Present data in a clean, structured table format',
            type: 'comparison',
            impact: this.determineImpact(suggestion.confidence),
            sourceBlockIds: suggestion.sourceBlockIds,
            targetBlockType: 'table',
            wireframeType: 'comparison-table',
            reason: suggestion.reason || 'Tabular information detected',
            isSelected: false,
            status: 'pending',
          };
          break;

        case 'definition':
          idea = {
            id: this.generateStableId('definition', suggestion.sourceBlockIds),
            title: 'Key Term Definition Box',
            description: 'Highlight key terms with dedicated definition styling',
            type: 'callout',
            impact: this.determineImpact(suggestion.confidence),
            sourceBlockIds: suggestion.sourceBlockIds,
            targetBlockType: 'definition',
            wireframeType: 'callout-info',
            reason: suggestion.reason || 'Term definition pattern detected',
            isSelected: false,
            status: 'pending',
          };
          break;

        case 'summary':
          idea = {
            id: this.generateStableId('summary', suggestion.sourceBlockIds),
            title: 'Summary Box',
            description: 'Conclude the section with a high-impact summary callout',
            type: 'callout',
            impact: this.determineImpact(suggestion.confidence),
            sourceBlockIds: suggestion.sourceBlockIds,
            targetBlockType: 'summary',
            wireframeType: 'callout-tip',
            reason: suggestion.reason || 'Key takeaway points detected',
            isSelected: false,
            status: 'pending',
          };
          break;

        case 'example':
          idea = {
            id: this.generateStableId('example', suggestion.sourceBlockIds),
            title: 'Practical Example Card',
            description: 'Showcase concrete usage in an emphasized example block',
            type: 'code-example',
            impact: this.determineImpact(suggestion.confidence),
            sourceBlockIds: suggestion.sourceBlockIds,
            targetBlockType: 'example',
            wireframeType: 'code-with-explanation',
            reason: suggestion.reason || 'Example or practical scenario detected',
            isSelected: false,
            status: 'pending',
          };
          break;

        case 'diagram':
          idea = {
            id: this.generateStableId('diagram', suggestion.sourceBlockIds),
            title: 'Flowchart / Architecture Diagram',
            description: 'Visualize relationships or flow with an interactive diagram',
            type: 'visual',
            impact: this.determineImpact(suggestion.confidence),
            sourceBlockIds: suggestion.sourceBlockIds,
            targetBlockType: 'diagram',
            wireframeType: 'diagram-flowchart',
            reason: suggestion.reason || 'Process or relationship structure detected',
            isSelected: false,
            status: 'pending',
          };
          break;
      }
      
      if (idea) {
        ideas.push(idea);
      }
    }
    
    return ideas;
  }
  
  /**
   * Analyze content structure for additional presentation opportunities
   */
  private analyzeContentStructure(
    document: TutorialDocument,
    analysis: ContentAnalysisResult
  ): PresentationIdea[] {
    const ideas: PresentationIdea[] = [];
    
    // Look for code blocks that could benefit from example formatting
    const codeBlocks = document.blocks.filter(block => block.type === 'code');
    if (codeBlocks.length > 0 && analysis.detectedElements.codeBlocks > 0) {
      const sourceBlockIds = codeBlocks.slice(0, 3).map(b => b.id);
      ideas.push({
        id: this.generateStableId('code-example', sourceBlockIds),
        title: 'Enhanced Code Examples',
        description: 'Present code with step-by-step explanations',
        type: 'code-example',
        impact: 'medium',
        sourceBlockIds,
        targetBlockType: 'example',
        wireframeType: 'code-with-explanation',
        reason: 'Code blocks detected that could benefit from structured examples',
        presentationConfig: {
          targetBlockType: 'example',
        },
        isSelected: false,
        status: 'pending',
      });
    }
    
    return ideas;
  }
  
  /**
   * Detect callout opportunities from content analysis
   */
  private detectCalloutOpportunities(
    document: TutorialDocument,
    analysis: ContentAnalysisResult
  ): PresentationIdea[] {
    const ideas: PresentationIdea[] = [];
    
    // Check if quality indicators suggest missing callouts
    if (analysis.qualityIndicators.structure === 'good' || analysis.qualityIndicators.structure === 'excellent') {
      // Look for important keywords in smart suggestions
      const importantSuggestions = analysis.smartSuggestions.filter(
        s => s.type === 'callout'
      );
      
      for (const suggestion of importantSuggestions) {
        ideas.push({
          id: this.generateStableId('callout', [suggestion.id]),
          title: 'Add Important Callout',
          description: suggestion.text,
          type: 'callout',
          impact: 'medium',
          sourceBlockIds: suggestion.targetSectionId ? [suggestion.targetSectionId] : [],
          targetBlockType: 'callout',
          wireframeType: 'callout-tip',
          reason: 'Important information identified in content analysis',
          presentationConfig: {
            targetBlockType: 'callout',
            variant: 'tip',
          },
          isSelected: false,
          status: 'pending',
        });
      }
    }
    
    return ideas;
  }
  
  /**
   * Suggest timeline for chronological/process content
   */
  private suggestTimelines(
    document: TutorialDocument,
    analysis: ContentAnalysisResult
  ): PresentationIdea[] {
    const ideas: PresentationIdea[] = [];
    
    // Look for numbered lists that could be timelines
    const numberedLists = document.blocks.filter(
      block => block.type === 'list' && (block.content as any)?.style === 'ordered'
    );
    
    if (numberedLists.length > 0 && analysis.detectedElements.numberedLists >= 1) {
      const sourceBlockIds = numberedLists.slice(0, 2).map(b => b.id);
      ideas.push({
        id: this.generateStableId('timeline', sourceBlockIds),
        title: 'Process Timeline',
        description: 'Visualize sequential steps as an interactive timeline',
        type: 'timeline',
        impact: 'medium',
        sourceBlockIds,
        targetBlockType: 'timeline',
        wireframeType: 'timeline-vertical',
        reason: 'Sequential numbered lists detected',
        presentationConfig: {
          targetBlockType: 'timeline',
          orientation: 'vertical',
        },
        isSelected: false,
        status: 'pending',
      });
    }
    
    return ideas;
  }
  
  /**
   * De-duplicate ideas based on sourceBlockIds overlap
   */
  private deduplicateIdeas(ideas: PresentationIdea[]): PresentationIdea[] {
    const uniqueMap = new Map<string, PresentationIdea>();
    
    for (const idea of ideas) {
      // Use stable ID as deduplication key
      if (!uniqueMap.has(idea.id)) {
        uniqueMap.set(idea.id, idea);
      }
    }
    
    return Array.from(uniqueMap.values());
  }
  
  /**
   * Calculate statistics for presentation ideas
   */
  private calculateStatistics(ideas: PresentationIdea[]): PresentationIdeasStatistics {
    const high = ideas.filter(i => i.impact === 'high').length;
    const medium = ideas.filter(i => i.impact === 'medium').length;
    const low = ideas.filter(i => i.impact === 'low').length;
    
    const byType: Record<string, number> = {};
    for (const idea of ideas) {
      byType[idea.type] = (byType[idea.type] || 0) + 1;
    }
    
    return {
      total: ideas.length,
      high,
      medium,
      low,
      byType,
      enhancementTips: high + medium, // Count actionable tips
    };
  }
  
  /**
   * Build context outline from document and analysis
   */
  private buildContextOutline(
    document: TutorialDocument,
    analysis: ContentAnalysisResult
  ): ContextOutline {
    return {
      totalSections: analysis.sectionOutline.length,
      totalBlocks: document.blocks.length,
      totalWords: analysis.statistics.totalWords,
      readingTimeMinutes: analysis.statistics.readingTimeMinutes,
      mainSections: analysis.sectionOutline.slice(0, 5).map(section => ({
        title: section.title,
        level: section.level,
        wordCount: Math.floor(analysis.statistics.totalWords / Math.max(analysis.sectionOutline.length, 1)),
      })),
    };
  }
  
  /**
   * Generate best practices guidance
   */
  private generateBestPractices(
    document: TutorialDocument,
    analysis: ContentAnalysisResult,
    ideas: PresentationIdea[]
  ): BestPractice[] {
    const practices: BestPractice[] = [];
    
    // Visual guidance
    if (ideas.some(i => i.type === 'card-grid' || i.type === 'layout')) {
      practices.push({
        id: 'bp-visual-hierarchy',
        category: 'visual',
        title: 'Use Visual Hierarchy',
        description: 'Break up dense text with layouts and cards to improve scanability',
        priority: 'high',
      });
    }
    
    // Structure guidance
    if (analysis.qualityIndicators.structure !== 'excellent') {
      practices.push({
        id: 'bp-clear-structure',
        category: 'structure',
        title: 'Maintain Clear Structure',
        description: 'Use consistent heading levels and logical content organization',
        priority: 'high',
      });
    }
    
    // Engagement guidance
    if (ideas.some(i => i.type === 'callout')) {
      practices.push({
        id: 'bp-highlight-key-points',
        category: 'engagement',
        title: 'Highlight Key Points',
        description: 'Use callouts to emphasize important concepts and warnings',
        priority: 'medium',
      });
    }
    
    // Accessibility guidance
    practices.push({
      id: 'bp-accessibility',
      category: 'accessibility',
      title: 'Ensure Accessibility',
      description: 'All layouts and visuals should be keyboard-navigable and screen-reader friendly',
      priority: 'high',
    });
    
    return practices;
  }
  
  /**
   * Generate stable, deterministic ID for presentation idea
   * Same sourceBlockIds + type → same ID
   */
  private generateStableId(type: string, sourceBlockIds: string[]): string {
    // Sort block IDs for determinism
    const sorted = [...sourceBlockIds].sort();
    const combined = `${type}-${sorted.join('-')}`;
    
    // Simple hash for short ID (not cryptographic, just deterministic)
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `pres-${type}-${Math.abs(hash).toString(36)}`;
  }
  
  /**
   * Determine impact level from confidence score
   */
  private determineImpact(confidence: number): PresentationImpact {
    if (confidence >= 80) return 'high';
    if (confidence >= 50) return 'medium';
    return 'low';
  }
  
  /**
   * Determine two-column wireframe variant
   */
  private determineTwoColumnWireframe(suggestion: BlockSuggestion): WireframeType {
    // Default to 50-50, could be enhanced with more sophisticated logic
    return 'two-column-50-50';
  }
  
  /**
   * Calculate optimal card grid columns based on number of cards
   */
  private calculateCardGridColumns(cardCount: number): 1 | 2 | 3 | 4 {
    if (cardCount <= 2) return 2;
    if (cardCount <= 4) return 2;
    if (cardCount <= 6) return 3;
    return 4;
  }
}

/**
 * Singleton instance
 */
export const presentationIdeasService = new PresentationIdeasService();
