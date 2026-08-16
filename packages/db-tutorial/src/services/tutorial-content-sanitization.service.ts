/**
 * Tutorial Content Sanitization Service
 * 
 * PROMPT 12 — Security / Sanitization Boundary
 * 
 * Secures the learner delivery/rendering boundary against:
 * - XSS (Cross-Site Scripting)
 * - Malicious HTML
 * - Malicious SVG
 * - Unsafe URLs
 * - Executable attributes
 * 
 * This service sanitizes TutorialDocument blocks before delivery to learners.
 * 
 * IMPORTANT:
 * - Only sanitizes fields that may contain HTML/SVG/URLs
 * - Does NOT sanitize plain text fields
 * - Does NOT modify the TutorialDocument structure
 */

import type { TutorialDocument, TutorialBlock } from '@quiz/types';

/**
 * Sanitization result
 */
export interface SanitizationResult {
  sanitized: TutorialDocument;
  modified: boolean;
  warnings: string[];
}

/**
 * Tutorial Content Sanitization Service
 */
export class TutorialContentSanitizationService {
  /**
   * Sanitize a TutorialDocument for delivery
   * 
   * Sanitizes potentially dangerous content in blocks:
   * - Diagram SVG data
   * - Image URLs
   * - URLs in blocks
   * - HTML-like content (if any blocks support it)
   */
  sanitizeDocument(document: TutorialDocument): SanitizationResult {
    const warnings: string[] = [];
    let modified = false;

    // Clone document to avoid mutation
    const sanitized: TutorialDocument = JSON.parse(JSON.stringify(document));

    // Sanitize each block
    sanitized.blocks = sanitized.blocks.map((block) => {
      const result = this.sanitizeBlock(block);
      if (result.modified) {
        modified = true;
        warnings.push(...result.warnings);
      }
      return result.block;
    });

    return {
      sanitized,
      modified,
      warnings,
    };
  }

  /**
   * Sanitize a single block
   */
  private sanitizeBlock(block: TutorialBlock): { block: TutorialBlock; modified: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let modified = false;

    // Clone block
    const sanitized: TutorialBlock = JSON.parse(JSON.stringify(block));

    switch (block.type) {
      case 'diagram':
        if ('content' in sanitized && sanitized.content) {
          const content = sanitized.content as any;
          if (content.diagramType === 'svg' && content.diagramData) {
            const svgResult = this.sanitizeSVG(content.diagramData);
            if (svgResult.modified) {
              content.diagramData = svgResult.sanitized;
              modified = true;
              warnings.push(`Block ${block.id}: SVG sanitized`);
            }
          }
        }
        break;

      case 'image':
        if ('content' in sanitized && sanitized.content) {
          const content = sanitized.content as any;
          if (content.assetId) {
            const urlResult = this.sanitizeUrl(content.assetId);
            if (urlResult.modified) {
              content.assetId = urlResult.sanitized;
              modified = true;
              warnings.push(`Block ${block.id}: Image assetId sanitized`);
            }
          }
        }
        break;

      // Other block types (paragraph, code, etc.) are plain text
      // No sanitization needed unless they explicitly support HTML
      default:
        break;
    }

    return { block: sanitized, modified, warnings };
  }

  /**
   * Sanitize SVG content
   * 
   * Removes:
   * - <script> tags
   * - Event handlers (onclick, onload, onerror, etc.)
   * - javascript: URLs
   * - data: URLs (potential XSS vector)
   * - <foreignObject> with unsafe content
   */
  sanitizeSVG(svgData: string): { sanitized: string; modified: boolean } {
    let sanitized = svgData;
    let modified = false;

    // 1. Remove <script> tags
    const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    if (scriptPattern.test(sanitized)) {
      sanitized = sanitized.replace(scriptPattern, '');
      modified = true;
    }

    // 2. Remove event handlers (onclick, onerror, onload, etc.)
    const eventHandlerPattern = /\s*on\w+\s*=\s*["'][^"']*["']/gi;
    if (eventHandlerPattern.test(sanitized)) {
      sanitized = sanitized.replace(eventHandlerPattern, '');
      modified = true;
    }

    // 3. Remove javascript: protocol
    const jsProtocolPattern = /javascript:/gi;
    if (jsProtocolPattern.test(sanitized)) {
      sanitized = sanitized.replace(jsProtocolPattern, 'unsafe:');
      modified = true;
    }

    // 4. Remove data: URLs (XSS vector in SVG)
    const dataUriPattern = /href\s*=\s*["']data:[^"']*["']/gi;
    if (dataUriPattern.test(sanitized)) {
      sanitized = sanitized.replace(dataUriPattern, 'href="unsafe:"');
      modified = true;
    }

    // 5. Remove <foreignObject> tags (can contain arbitrary HTML)
    const foreignObjectPattern = /<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi;
    if (foreignObjectPattern.test(sanitized)) {
      sanitized = sanitized.replace(foreignObjectPattern, '');
      modified = true;
    }

    return { sanitized, modified };
  }

  /**
   * Sanitize URL
   * 
   * Validates and sanitizes URLs to prevent:
   * - javascript: URLs (including encoded variants)
   * - data: URLs (can be XSS vector)
   * - vbscript: URLs
   * - Malformed URLs
   * 
   * Allows:
   * - https: URLs
   * - http: URLs (with warning)
   * - Relative URLs
   */
  sanitizeUrl(url: string): { sanitized: string; modified: boolean } {
    let sanitized = url.trim();
    let modified = false;

    // Decode URL to catch encoded attacks (javascript%3A, javascript%253A, etc.)
    // Try to decode multiple times to handle double-encoding
    let decoded = sanitized;
    try {
      // Decode up to 3 times to catch multiple layers of encoding
      for (let i = 0; i < 3; i++) {
        const nextDecoded = decodeURIComponent(decoded);
        if (nextDecoded === decoded) break; // No more decoding possible
        decoded = nextDecoded;
      }
    } catch (e) {
      // Malformed URI encoding - fail closed
      return { sanitized: '#unsafe-url', modified: true };
    }

    // Normalize whitespace and case for checking
    const normalized = decoded.replace(/\s/g, '').toLowerCase();

    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];

    for (const protocol of dangerousProtocols) {
      if (normalized.startsWith(protocol)) {
        sanitized = '#unsafe-url';
        modified = true;
        break;
      }
    }

    // Check for protocol-relative URLs with dangerous patterns
    if (!modified && sanitized.startsWith('//') && normalized.includes('javascript')) {
      sanitized = '#unsafe-url';
      modified = true;
    }

    // Check for null bytes (another attack vector)
    if (!modified && (sanitized.includes('\0') || decoded.includes('\0'))) {
      sanitized = '#unsafe-url';
      modified = true;
    }

    return { sanitized, modified };
  }

  /**
   * Check if a URL is safe
   * 
   * Returns true if URL is:
   * - HTTPS
   * - HTTP (less safe, but allowed)
   * - Relative path
   * - Anchor link
   */
  isUrlSafe(url: string): boolean {
    const trimmed = url.trim().toLowerCase();

    // Allow HTTPS (safe)
    if (trimmed.startsWith('https://')) return true;

    // Allow HTTP (less safe, but common)
    if (trimmed.startsWith('http://')) return true;

    // Allow relative URLs
    if (trimmed.startsWith('/')) return true;

    // Allow anchor links
    if (trimmed.startsWith('#')) return true;

    // Block everything else
    return false;
  }
}

/**
 * Singleton instance
 */
export const tutorialContentSanitizationService = new TutorialContentSanitizationService();
