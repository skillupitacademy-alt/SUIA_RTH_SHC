/**
 * Tutorial Rich Document - Constants
 * Defines system-wide constants for document structure
 */

/**
 * Current schema version for rich documents
 * Increment when making breaking changes to document structure
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Maximum nesting depth for container blocks
 * Prevents infinite recursion and overly complex structures
 */
export const MAX_NESTING_DEPTH = 3;

/**
 * Minimum and maximum block ID length
 */
export const MIN_BLOCK_ID_LENGTH = 5;
export const MAX_BLOCK_ID_LENGTH = 50;

/**
 * Maximum blocks per document (safety limit)
 */
export const MAX_BLOCKS_PER_DOCUMENT = 500;

/**
 * Maximum items in a list
 */
export const MAX_LIST_ITEMS = 100;

/**
 * Maximum table dimensions
 */
export const MAX_TABLE_COLUMNS = 10;
export const MAX_TABLE_ROWS = 100;

/**
 * Maximum cards in a grid
 */
export const MAX_CARD_GRID_ITEMS = 20;

/**
 * Maximum timeline items
 */
export const MAX_TIMELINE_ITEMS = 50;

/**
 * Supported code languages
 */
export const SUPPORTED_CODE_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'sql',
  'bash',
  'scala',
  'go',
  'rust',
  'cpp',
  'csharp',
  'php',
  'ruby',
  'swift',
  'kotlin',
] as const;

export type CodeLanguage = typeof SUPPORTED_CODE_LANGUAGES[number];
