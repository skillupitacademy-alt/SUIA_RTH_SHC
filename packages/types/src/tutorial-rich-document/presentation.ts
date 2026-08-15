/**
 * Tutorial Rich Document - Presentation Configuration
 * Defines semantic presentation properties (NOT React/CSS implementation)
 */

/**
 * Width variants for blocks
 */
export type BlockWidth = 'narrow' | 'normal' | 'wide' | 'full';

/**
 * Alignment options
 */
export type BlockAlignment = 'left' | 'center' | 'right' | 'justify';

/**
 * Spacing variants
 */
export type BlockSpacing = 'none' | 'tight' | 'normal' | 'relaxed' | 'loose';

/**
 * Column ratio for two-column layouts
 */
export type TwoColumnRatio = '50-50' | '60-40' | '40-60' | '70-30' | '30-70';

/**
 * Number of columns for grid layouts
 */
export type GridColumns = 1 | 2 | 3 | 4;

/**
 * Responsive breakpoint hints (semantic, not CSS)
 */
export interface ResponsiveConfig {
  mobile?: {
    columns?: GridColumns;
    width?: BlockWidth;
  };
  tablet?: {
    columns?: GridColumns;
    width?: BlockWidth;
  };
  desktop?: {
    columns?: GridColumns;
    width?: BlockWidth;
  };
}

/**
 * Base presentation configuration for all blocks
 * These are semantic hints, NOT React component props or CSS classes
 */
export interface PresentationConfig {
  /**
   * Width of the block
   */
  width?: BlockWidth;

  /**
   * Text/content alignment
   */
  alignment?: BlockAlignment;

  /**
   * Spacing around the block
   */
  spacing?: BlockSpacing;

  /**
   * Responsive behavior hints
   */
  responsive?: ResponsiveConfig;

  /**
   * Whether to emphasize this block visually
   */
  emphasized?: boolean;

  /**
   * Custom semantic styling hints (NOT CSS classes)
   * Use sparingly for block-specific presentation needs
   */
  styleVariant?: string;
}

/**
 * Presentation config specifically for container blocks
 */
export interface ContainerPresentationConfig extends PresentationConfig {
  /**
   * Gap between child elements
   */
  gap?: BlockSpacing;

  /**
   * Whether container should stretch to fill available space
   */
  stretch?: boolean;
}

/**
 * Presentation config for two-column layouts
 */
export interface TwoColumnPresentationConfig extends ContainerPresentationConfig {
  /**
   * Column width ratio
   */
  ratio?: TwoColumnRatio;
}

/**
 * Presentation config for grid layouts
 */
export interface GridPresentationConfig extends ContainerPresentationConfig {
  /**
   * Number of columns in the grid
   */
  columns?: GridColumns;

  /**
   * Whether grid items should be equal height
   */
  equalHeight?: boolean;
}
