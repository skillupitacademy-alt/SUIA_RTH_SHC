/**
 * Specialized Blocks - Domain-specific content blocks
 * 
 * These blocks serve specialized educational purposes like
 * diagrams, comparisons, etc.
 */

import { PresentationConfig } from '../presentation';

/**
 * Base structure for all blocks
 */
interface BaseBlock {
  id: string;
  presentation?: PresentationConfig;
}

/**
 * 12. Diagram Block (Mermaid or image-based diagrams)
 */
export interface DiagramBlock extends BaseBlock {
  type: 'diagram';
  content: {
    diagramType: 'mermaid' | 'asset';
    /**
     * For 'mermaid': Mermaid syntax string
     * For 'asset': Asset ID or URL
     */
    source: string;
    caption?: string;
  };
}

/**
 * 13. Comparison Block (comparison table/matrix)
 */
export interface ComparisonBlock extends BaseBlock {
  type: 'comparison';
  content: {
    title?: string;
    /**
     * Entities being compared (e.g., ["React", "Vue", "Angular"])
     */
    entities: string[];
    /**
     * Features/attributes to compare (e.g., ["Learning Curve", "Performance"])
     */
    features: string[];
    /**
     * Comparison data: rows[featureIndex][entityIndex]
     * Each cell contains the comparison value/description
     */
    rows: string[][];
  };
}
