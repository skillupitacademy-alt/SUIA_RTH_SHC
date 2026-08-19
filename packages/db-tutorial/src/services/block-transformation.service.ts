/**
 * Block Transformation Service
 * 
 * Transforms BlockSuggestions into canonical TutorialBlocks and applies them to TutorialDocuments.
 * 
 * ARCHITECTURE:
 * - Input: TutorialDocument + verified BlockSuggestion (from Phase B)
 * - Output: New TutorialDocument with suggestion applied
 * - Immutable transformations (never mutates input document)
 * - All output blocks use BLOCK_REGISTRY types only
 * - Validates final document against TutorialDocumentSchema
 * 
 * PHASE C RESPONSIBILITY:
 * "HOW does that authenticated suggestion become a canonical TutorialBlock?"
 * 
 * IMPORTANT:
 * - BlockSuggestion CANNOT be cast to TutorialBlock
 * - All 10 suggestion rules require canonical block construction
 * - Only Rule 9 (concept-cards → card-grid) requires type conversion
 * - Never trust client-provided suggestedContent
 * - Operates only on server-generated suggestions from Phase B
 */

import type {
  TutorialDocument,
  BlockSuggestion,
  TutorialBlock,
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  CalloutBlock,
  DefinitionBlock,
  ExampleBlock,
  DiagramBlock,
  SummaryBlock,
  TableBlock,
  ComparisonBlock,
  TwoColumnBlock,
  CardGridBlock,
  TimelineBlock,
  Card,
  TimelineItem,
  TableColumn,
  TableRow,
  TableCell,
  ComparisonFeature,
} from '@quiz/types';
import { TutorialDocumentSchema } from '@quiz/types';
import { InvalidSuggestionError, InvalidTransformationError } from '@quiz/types';

/**
 * Helper to get block text from canonical structure
 */
function getBlockText(block: TutorialBlock): string {
  if ('content' in block && block.content && typeof block.content === 'object') {
    const content = block.content as any;
    return content.text || '';
  }
  return '';
}

/**
 * Helper to get heading level from canonical structure
 */
function getHeadingLevel(block: TutorialBlock): number {
  if (block.type === 'heading' && 'content' in block && block.content) {
    const content = block.content as any;
    return content.level || 0;
  }
  return 0;
}

/**
 * Helper to get list items from canonical structure
 */
function getListItems(block: TutorialBlock): any[] {
  if (block.type === 'list' && 'content' in block && block.content) {
    const content = block.content as any;
    return content.items || [];
  }
  return [];
}

/**
 * Helper to get list style from canonical structure
 */
function getListStyle(block: TutorialBlock): string {
  if (block.type === 'list' && 'content' in block && block.content) {
    const content = block.content as any;
    return content.style || 'unordered';
  }
  return 'unordered';
}

/**
 * Block Transformation Service
 */
export class BlockTransformationService {
  /**
   * Transform a BlockSuggestion into a canonical TutorialBlock and apply to document
   * 
   * @param document - Current TutorialDocument
   * @param suggestion - Verified BlockSuggestion from Phase B
   * @returns New TutorialDocument with transformation applied
   * 
   * IMMUTABILITY: Never mutates input document
   * VALIDATION: Final document validated against TutorialDocumentSchema
   * SECURITY: Never trusts client-provided suggestedContent
   */
  transform(
    document: TutorialDocument,
    suggestion: BlockSuggestion
  ): TutorialDocument {
    // Validate input
    if (suggestion.kind !== 'suggested') {
      throw new InvalidSuggestionError(
        'Cannot transform existing blocks - only suggested blocks can be applied'
      );
    }

    // Create immutable copy
    const nextDocument = structuredClone(document);

    // Dispatch to type-specific transformer
    let transformedDocument: TutorialDocument;

    switch (suggestion.blockType) {
      case 'two-column':
        transformedDocument = this.transformTwoColumn(nextDocument, suggestion);
        break;
      case 'comparison':
        transformedDocument = this.transformComparison(nextDocument, suggestion);
        break;
      case 'callout':
        transformedDocument = this.transformCallout(nextDocument, suggestion);
        break;
      case 'example':
        transformedDocument = this.transformExample(nextDocument, suggestion);
        break;
      case 'diagram':
        transformedDocument = this.transformDiagram(nextDocument, suggestion);
        break;
      case 'summary':
        transformedDocument = this.transformSummary(nextDocument, suggestion);
        break;
      case 'definition':
        transformedDocument = this.transformDefinition(nextDocument, suggestion);
        break;
      case 'table':
        transformedDocument = this.transformTable(nextDocument, suggestion);
        break;
      case 'concept-cards':
        // TYPE CONVERSION: concept-cards → card-grid
        transformedDocument = this.transformConceptCards(nextDocument, suggestion);
        break;
      case 'timeline':
        transformedDocument = this.transformTimeline(nextDocument, suggestion);
        break;
      default:
        throw new InvalidSuggestionError(
          `Unsupported suggestion type: ${suggestion.blockType}`
        );
    }

    // Validate final document
    const validated = TutorialDocumentSchema.parse(transformedDocument);
    return validated;
  }

  /**
   * RULE 1: Transform two-column suggestion
   * 
   * Source: 2 H3 headings with content between them
   * Output: TwoColumnBlock with left/right partitioning
   */
  private transformTwoColumn(
    document: TutorialDocument,
    suggestion: BlockSuggestion
  ): TutorialDocument {
    const sourceBlocks = this.getSourceBlocks(document, suggestion.sourceBlockIds);

    // Find the two H3 headings
    const headings = sourceBlocks.filter(
      (block) => block.type === 'heading' && getHeadingLevel(block) === 3
    );

    if (headings.length !== 2) {
      throw new InvalidTransformationError(
        'Two-column transformation requires exactly 2 H3 headings'
      );
    }

    // Find indices of the two headings in the document
    const firstHeadingIndex = document.blocks.findIndex((b) => b.id === headings[0].id);
    const secondHeadingIndex = document.blocks.findIndex((b) => b.id === headings[1].id);

    if (firstHeadingIndex === -1 || secondHeadingIndex === -1) {
      throw new InvalidTransformationError('Cannot find heading blocks in document');
    }

    // Partition blocks: left column = first heading + content until second heading
    // right column = second heading + content after it
    const leftBlocks = sourceBlocks.slice(
      0,
      sourceBlocks.findIndex((b) => b.id === headings[1].id)
    );
    const rightBlocks = sourceBlocks.slice(
      sourceBlocks.findIndex((b) => b.id === headings[1].id)
    );

    // Create canonical TwoColumnBlock
    const twoColumnBlock: TwoColumnBlock = {
      id: crypto.randomUUID(),
      type: 'two-column',
      content: {
        left: {
          blocks: leftBlocks,
        },
        right: {
          blocks: rightBlocks,
        },
      },
      presentation: {
        ratio: '50-50',
        gap: 'normal',
      },
    };

    // Replace source blocks with new block
    return this.replaceBlocks(document, suggestion.sourceBlockIds, twoColumnBlock);
  }

  /**
   * RULE 2: Transform comparison suggestion
   * 
   * Source: Paragraph with comparison language
   * Output: ComparisonBlock with entities and features
   */
  private transformComparison(
    document: TutorialDocument,
    suggestion: BlockSuggestion
  ): TutorialDocument {
    const sourceBlocks = this.getSourceBlocks(document, suggestion.sourceBlockIds);

    if (sourceBlocks.length !== 1) {
      throw new InvalidTransformationError(
        'Comparison transformation requires exactly 1 source block'
      );
    }

    const sourceBlock = sourceBlocks[0];
    const text = getBlockText(sourceBlock);

    // Extract entities from comparison patterns
    const entities = this.extractComparisonEntities(text);
    const features = this.extractComparisonFeatures(text, entities);

    // Create canonical ComparisonBlock
    const comparisonBlock: ComparisonBlock = {
      id: crypto.randomUUID(),
      type: 'comparison',
      content: {
        title: suggestion.title || 'Comparison',
        entities,
        features,
      },
    };

    // Replace source block
    return this.replaceBlocks(document, suggestion.sourceBlockIds, comparisonBlock);
  }

  /**
   * RULE 3: Transform callout suggestion
   * 
   * Source: Paragraph with callout indicators
   * Output: CalloutBlock with variant and text
   */
  private transformCallout(
    document: TutorialDocument,
    suggestion: BlockSuggestion
  ): TutorialDocument {
    const sourceBlocks = this.getSourceBlocks(document, suggestion.sourceBlockIds);

    if (sourceBlocks.length !== 1) {
      throw new InvalidTransformationError(
        'Callout transformation requires exactly 1 source block'
      );
    }

    const sourceBlock = sourceBlocks[0];
    const text = getBlockText(sourceBlock);

    // Determine variant from text patterns
    const variant = this.detectCalloutVariant(text);

    // Remove callout indicator prefix if present
    const cleanText = text
      .replace(/^(note:|tip:|warning:|important:|caution:)\s*/i, '')
      .trim();

    // Create canonical CalloutBlock
    const calloutBlock: CalloutBlock = {
      id: crypto.randomUUID(),
      type: 'callout',
      content: {
        variant,
        text: cleanText,
      },
    };

    // Replace source block
    return this.replaceBlocks(document, suggestion.sourceBlockIds, calloutBlock);
  }

  /**
   * RULE 4: Transform example suggestion
   * 
   * Source: Paragraph with example language
   * Output: ExampleBlock with explanation
   */
  private transformExample(
    document: TutorialDocument,
    suggestion: BlockSuggestion
  ): TutorialDocument {
    const sourceBlocks = this.getSourceBlocks(document, suggestion.sourceBlockIds);

    if (sourceBlocks.length !== 1) {
      throw new InvalidTransformationError(
        'Example transformation requires exactly 1 source block'
      );
    }

    const sourceBlock = sourceBlocks[0];
    const text = getBlockText(sourceBlock);

    // Remove example indicator prefix if present
    const cleanText = text
      .replace(/^(for example|for instance|real-world example|use case|scenario)[:.]?\s*/i, '')
      .trim();

    // Create canonical ExampleBlock
    const exampleBlock: ExampleBlock = {
      id: crypto.randomUUID(),
      type: 'example',
      content: {
        title: 'Example',
        explanation: cleanText,
      },
    };

    // Replace source block
    return this.replaceBlocks(document, suggestion.sourceBlockIds, exampleBlock);
  }

  /**
   * RULE 5: Transform diagram suggestion
   * 
   * Source: Paragraph/list with process language
   * Output: DiagramBlock with Mermaid placeholder
   */
  private transformDiagram(
    document: TutorialDocument,
    suggestion: BlockSuggestion
  ): TutorialDocument {
    const sourceBlocks = this.getSourceBlocks(document, suggestion.sourceBlockIds);

    if (sourceBlocks.length !== 1) {
      throw new InvalidTransformationError(
        'Diagram transformation requires exactly 1 source block'
      );
    }

    const sourceBlock = sourceBlocks[0];
    const text = getBlockText(sourceBlock);

    // Create canonical DiagramBlock with Mermaid placeholder
    const diagramBlock: DiagramBlock = {
      id: crypto.randomUUID(),
      type: 'diagram',
      content: {
        diagramType: 'mermaid',
        diagramData: 'graph LR\n  A[Start] --> B[Process]\n  B --> C[End]',
        caption: 'Process Flow',
        alt: text.substring(0, 100),
      },
    };

    // Replace source block
    return this.replaceBlocks(document, suggestion.sourceBlockIds, diagramBlock);
  }

  /**
   * RULE 6: Transform summary suggestion
   * 
   * Source: Document-level (no source blocks)
   * Output: SummaryBlock inserted at end
   */
  private transformSummary(
    document: TutorialDocument,
    suggestion: BlockSuggestion
  ): TutorialDocument {
    // Extract key points from document
    const points = this.extractKeyPoints(document);

    // Create canonical SummaryBlock
    const summaryBlock: SummaryBlock = {
      id: crypto.randomUUID(),
      type: 'summary',
      content: {
        title: 'Summary',
        points,
      },
    };

    // Insert at end of document
    const nextDocument = structuredClone(document);
    nextDocument.blocks.push(summaryBlock);
    return nextDocument;
  }

  /**
   * RULE 7: Transform definition suggestion
   * 
   * Source: Paragraph with definition pattern
   * Output: DefinitionBlock with term and definition
   */
  private transformDefinition(
    document: TutorialDocument,
    suggestion: BlockSuggestion
  ): TutorialDocument {
    const sourceBlocks = this.getSourceBlocks(document, suggestion.sourceBlockIds);

    if (sourceBlocks.length !== 1) {
      throw new InvalidTransformationError(
        'Definition transformation requires exactly 1 source block'
      );
    }

    const sourceBlock = sourceBlocks[0];
    const text = getBlockText(sourceBlock);

    // Extract term and definition
    const { term, definition } = this.parseDefinition(text);

    // Create canonical DefinitionD1Block
    const definitionBlock: DefinitionBlock = {
      id: crypto.randomUUID(),
      type: 'definition',
      version: 'D1',
      content: {
        page: {
          type: 'definition',
          category: 'Generated Definition',
          title: term,
          intro: definition,
          definition: definition,
          explanation: [definition],
          example: {
            language: 'javascript',
            code: '// Example code here',
          },
          characteristics: [],
          takeaway: definition,
        },
      },
    };

    // Replace source block
    return this.replaceBlocks(document, suggestion.sourceBlockIds, definitionBlock);
  }

  /**
   * RULE 8: Transform table suggestion
   * 
   * Source: List with structured attributes
   * Output: TableBlock with columns and rows
   */
  private transformTable(
    document: TutorialDocument,
    suggestion: BlockSuggestion
  ): TutorialDocument {
    const sourceBlocks = this.getSourceBlocks(document, suggestion.sourceBlockIds);

    if (sourceBlocks.length !== 1 || sourceBlocks[0].type !== 'list') {
      throw new InvalidTransformationError(
        'Table transformation requires exactly 1 list block'
      );
    }

    const listBlock = sourceBlocks[0] as ListBlock;
    const items = getListItems(listBlock);

    // Parse list items into table structure
    const { columns, rows } = this.parseListAsTable(items);

    // Create canonical TableBlock
    const tableBlock: TableBlock = {
      id: crypto.randomUUID(),
      type: 'table',
      content: {
        columns,
        rows,
        hasHeader: true,
      },
    };

    // Replace source block
    return this.replaceBlocks(document, suggestion.sourceBlockIds, tableBlock);
  }

  /**
   * RULE 9: Transform concept-cards suggestion (TYPE CONVERSION)
   * 
   * Source: 3-6 H3 headings
   * Output: CardGridBlock (NOT concept-cards - that type doesn't exist in registry)
   * 
   * CRITICAL: This is the only transformation that requires type conversion
   */
  private transformConceptCards(
    document: TutorialDocument,
    suggestion: BlockSuggestion
  ): TutorialDocument {
    const sourceBlocks = this.getSourceBlocks(document, suggestion.sourceBlockIds);

    // Verify all source blocks are H3 headings
    const headings = sourceBlocks.filter(
      (block) => block.type === 'heading' && getHeadingLevel(block) === 3
    );

    if (headings.length < 3 || headings.length > 6) {
      throw new InvalidTransformationError(
        'Concept cards transformation requires 3-6 H3 headings'
      );
    }

    // For each H3, create a Card with title and collect following blocks
    const cards: Card[] = [];

    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i] as HeadingBlock;
      const nextHeading = headings[i + 1];

      // Find heading index in document
      const headingIndex = document.blocks.findIndex((b) => b.id === heading.id);
      const nextHeadingIndex = nextHeading
        ? document.blocks.findIndex((b) => b.id === nextHeading.id)
        : document.blocks.length;

      // Collect blocks between this heading and next heading (exclude the heading itself)
      const cardBlocks = document.blocks.slice(headingIndex + 1, nextHeadingIndex);

      cards.push({
        id: crypto.randomUUID(),
        title: heading.content.text,
        blocks: cardBlocks,
      });
    }

    // Calculate optimal column count
    const columns = this.calculateCardGridColumns(cards.length);

    // Create canonical CardGridBlock (NOT concept-cards)
    const cardGridBlock: CardGridBlock = {
      id: crypto.randomUUID(),
      type: 'card-grid', // ✅ Registry type
      content: {
        cards,
      },
      presentation: {
        columns,
        gap: 'normal',
      },
    };

    // Replace source blocks (all H3s and content between them)
    const allSourceBlockIds = this.collectCardSourceBlockIds(
      document,
      headings[0].id,
      headings[headings.length - 1].id
    );

    return this.replaceBlocks(document, allSourceBlockIds, cardGridBlock);
  }

  /**
   * RULE 10: Transform timeline suggestion
   * 
   * Source: List with chronological language
   * Output: TimelineBlock with items
   */
  private transformTimeline(
    document: TutorialDocument,
    suggestion: BlockSuggestion
  ): TutorialDocument {
    const sourceBlocks = this.getSourceBlocks(document, suggestion.sourceBlockIds);

    if (sourceBlocks.length !== 1 || sourceBlocks[0].type !== 'list') {
      throw new InvalidTransformationError(
        'Timeline transformation requires exactly 1 list block'
      );
    }

    const listBlock = sourceBlocks[0] as ListBlock;
    const items = getListItems(listBlock);

    // Parse list items into timeline items
    const timelineItems: TimelineItem[] = items.map((item: any, index: number) => ({
      id: crypto.randomUUID(),
      title: item.text || `Step ${index + 1}`,
      description: item.text,
    }));

    // Create canonical TimelineBlock
    const timelineBlock: TimelineBlock = {
      id: crypto.randomUUID(),
      type: 'timeline',
      content: {
        items: timelineItems,
        orientation: 'vertical',
      },
    };

    // Replace source block
    return this.replaceBlocks(document, suggestion.sourceBlockIds, timelineBlock);
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  /**
   * Get source blocks by IDs
   */
  private getSourceBlocks(
    document: TutorialDocument,
    sourceBlockIds: string[]
  ): TutorialBlock[] {
    const blocks: TutorialBlock[] = [];

    for (const id of sourceBlockIds) {
      const block = document.blocks.find((b) => b.id === id);
      if (!block) {
        throw new InvalidTransformationError(`Source block not found: ${id}`);
      }
      blocks.push(block);
    }

    return blocks;
  }

  /**
   * Replace source blocks with new block(s)
   */
  private replaceBlocks(
    document: TutorialDocument,
    sourceBlockIds: string[],
    ...newBlocks: TutorialBlock[]
  ): TutorialDocument {
    const nextDocument = structuredClone(document);

    // Find first source block index
    const firstIndex = nextDocument.blocks.findIndex((b) =>
      sourceBlockIds.includes(b.id)
    );

    if (firstIndex === -1) {
      throw new InvalidTransformationError('Cannot find source blocks in document');
    }

    // Remove all source blocks
    nextDocument.blocks = nextDocument.blocks.filter(
      (b) => !sourceBlockIds.includes(b.id)
    );

    // Insert new blocks at the first source block position
    nextDocument.blocks.splice(firstIndex, 0, ...newBlocks);

    return nextDocument;
  }

  /**
   * Extract comparison entities from text
   */
  private extractComparisonEntities(text: string): string[] {
    // Simple extraction - look for "A vs B" or "A versus B" patterns
    const vsMatch = text.match(/(\w+)\s+(?:vs|versus)\s+(\w+)/i);
    if (vsMatch) {
      return [vsMatch[1], vsMatch[2]];
    }

    // Default fallback
    return ['Option A', 'Option B'];
  }

  /**
   * Extract comparison features from text
   */
  private extractComparisonFeatures(
    text: string,
    entities: string[]
  ): ComparisonFeature[] {
    // Simplified extraction - create one feature from the text
    return [
      {
        name: 'Comparison',
        values: entities.map(() => text.substring(0, 100)),
      },
    ];
  }

  /**
   * Detect callout variant from text
   */
  private detectCalloutVariant(
    text: string
  ): 'info' | 'warning' | 'tip' | 'important' | 'success' | 'danger' {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('warning') || lowerText.includes('caution')) {
      return 'warning';
    }
    if (lowerText.includes('tip:')) {
      return 'tip';
    }
    if (lowerText.includes('important')) {
      return 'important';
    }
    if (lowerText.includes('danger')) {
      return 'danger';
    }
    if (lowerText.includes('success')) {
      return 'success';
    }

    return 'info';
  }

  /**
   * Extract key points from document
   */
  private extractKeyPoints(document: TutorialDocument): string[] {
    // Extract first sentence from each H2 or H3 section
    const points: string[] = [];

    for (const block of document.blocks) {
      if (block.type === 'heading') {
        const level = getHeadingLevel(block);
        if (level === 2 || level === 3) {
          const text = getBlockText(block);
          if (text) {
            points.push(text);
          }
        }
      }
    }

    // Fallback: at least 3 generic points
    if (points.length === 0) {
      return ['Key concept 1', 'Key concept 2', 'Key concept 3'];
    }

    return points.slice(0, 5); // Max 5 points
  }

  /**
   * Parse definition from text
   */
  private parseDefinition(text: string): { term: string; definition: string } {
    // Pattern: "Term is a/an definition"
    const match = text.match(/^(\w+(?:\s+\w+)?)\s+(?:is|refers to|means|is defined as)\s+(.+)/i);

    if (match) {
      return {
        term: match[1].trim(),
        definition: match[2].trim(),
      };
    }

    // Fallback
    return {
      term: 'Term',
      definition: text,
    };
  }

  /**
   * Parse list as table
   */
  private parseListAsTable(items: any[]): {
    columns: TableColumn[];
    rows: TableRow[];
  } {
    // Expect items like "Property: Value"
    const columns: TableColumn[] = [
      { id: 'col-1', label: 'Property', alignment: 'left' },
      { id: 'col-2', label: 'Value', alignment: 'left' },
    ];

    const rows: TableRow[] = items.map((item: any, index: number) => {
      const text = item.text || '';
      const parts = text.split(':').map((s: string) => s.trim());

      return {
        id: `row-${index}`,
        cells: [
          { columnId: 'col-1', value: parts[0] || '' },
          { columnId: 'col-2', value: parts[1] || '' },
        ],
      };
    });

    return { columns, rows };
  }

  /**
   * Calculate optimal card grid columns
   */
  private calculateCardGridColumns(cardCount: number): 1 | 2 | 3 | 4 {
    if (cardCount === 2) return 2;
    if (cardCount === 3) return 3;
    if (cardCount === 4) return 2;
    if (cardCount >= 5) return 3;
    return 2; // Default
  }

  /**
   * Collect all block IDs between first and last heading (inclusive of content)
   */
  private collectCardSourceBlockIds(
    document: TutorialDocument,
    firstHeadingId: string,
    lastHeadingId: string
  ): string[] {
    const firstIndex = document.blocks.findIndex((b) => b.id === firstHeadingId);
    const lastIndex = document.blocks.findIndex((b) => b.id === lastHeadingId);

    if (firstIndex === -1 || lastIndex === -1) {
      throw new InvalidTransformationError('Cannot find heading blocks');
    }

    // Find the next H3 after the last heading, or end of document
    let endIndex = lastIndex + 1;
    for (let i = lastIndex + 1; i < document.blocks.length; i++) {
      const block = document.blocks[i];
      if (block.type === 'heading' && getHeadingLevel(block) === 3) {
        endIndex = i;
        break;
      }
      endIndex = i + 1;
    }

    // Collect all block IDs in this range
    return document.blocks.slice(firstIndex, endIndex).map((b) => b.id);
  }
}

/**
 * Default service instance
 */
export const blockTransformationService = new BlockTransformationService();
