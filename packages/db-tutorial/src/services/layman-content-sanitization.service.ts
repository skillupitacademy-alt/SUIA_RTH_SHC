/**
 * Layman Content Sanitization Service
 * Phase 2B Week 2 - Hardening
 * ------------------------------------
 * Sanitizes AI-generated content for security
 */

/**
 * Sanitization result
 */
export interface SanitizationResult {
  sanitized: string;
  modified: boolean;
  removedElements: string[];
  warnings: string[];
}

/**
 * Sanitization statistics
 */
export interface SanitizationStats {
  scriptsRemoved: number;
  linksModified: number;
  htmlStripped: number;
  suspiciousPatterns: number;
}

/**
 * Layman Content Sanitization Service
 * Removes malicious content and XSS vectors
 */
export class LaymanContentSanitizationService {
  /**
   * Sanitize raw AI response
   */
  sanitizeRawResponse(rawText: string): SanitizationResult {
    let sanitized = rawText;
    const removedElements: string[] = [];
    const warnings: string[] = [];
    let modified = false;

    // 1. Remove script tags
    const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    if (scriptPattern.test(sanitized)) {
      sanitized = sanitized.replace(scriptPattern, '');
      removedElements.push('script tags');
      warnings.push('Removed script tags from content');
      modified = true;
    }

    // 2. Remove event handlers (onclick, onerror, etc.)
    const eventHandlerPattern = /\s*on\w+\s*=\s*["'][^"']*["']/gi;
    if (eventHandlerPattern.test(sanitized)) {
      sanitized = sanitized.replace(eventHandlerPattern, '');
      removedElements.push('event handlers');
      warnings.push('Removed event handlers from content');
      modified = true;
    }

    // 3. Remove javascript: protocol in links
    const jsProtocolPattern = /javascript:/gi;
    if (jsProtocolPattern.test(sanitized)) {
      sanitized = sanitized.replace(jsProtocolPattern, 'removed:');
      removedElements.push('javascript: protocols');
      warnings.push('Removed javascript: protocols from links');
      modified = true;
    }

    // 4. Remove data: URIs (potential XSS vector)
    const dataUriPattern = /data:text\/html[^"'\s]*/gi;
    if (dataUriPattern.test(sanitized)) {
      sanitized = sanitized.replace(dataUriPattern, 'removed');
      removedElements.push('data URIs');
      warnings.push('Removed data URIs from content');
      modified = true;
    }

    // 5. Remove iframe tags
    const iframePattern = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi;
    if (iframePattern.test(sanitized)) {
      sanitized = sanitized.replace(iframePattern, '');
      removedElements.push('iframe tags');
      warnings.push('Removed iframe tags from content');
      modified = true;
    }

    // 6. Remove object/embed tags
    const objectPattern = /<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi;
    if (objectPattern.test(sanitized)) {
      sanitized = sanitized.replace(objectPattern, '');
      removedElements.push('object/embed tags');
      warnings.push('Removed object/embed tags from content');
      modified = true;
    }

    // 7. Detect suspicious patterns
    const suspiciousPatterns = [
      /eval\s*\(/gi,
      /document\.write/gi,
      /window\.location/gi,
      /\.innerHTML/gi,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitized)) {
        warnings.push(`Suspicious pattern detected: ${pattern.source}`);
      }
    }

    return {
      sanitized,
      modified,
      removedElements,
      warnings,
    };
  }

  /**
   * Sanitize parsed content subsections
   */
  sanitizeSubsections(subsections: Record<string, any>): {
    sanitized: Record<string, any>;
    stats: SanitizationStats;
  } {
    const sanitized: Record<string, any> = {};
    const stats: SanitizationStats = {
      scriptsRemoved: 0,
      linksModified: 0,
      htmlStripped: 0,
      suspiciousPatterns: 0,
    };

    for (const [key, value] of Object.entries(subsections)) {
      if (typeof value === 'string') {
        const result = this.sanitizeRawResponse(value);
        sanitized[key] = result.sanitized;
        
        if (result.modified) {
          stats.htmlStripped++;
        }
        if (result.removedElements.includes('script tags')) {
          stats.scriptsRemoved++;
        }
        if (result.removedElements.includes('javascript: protocols')) {
          stats.linksModified++;
        }
        if (result.warnings.some((w) => w.includes('Suspicious pattern'))) {
          stats.suspiciousPatterns++;
        }
      } else if (Array.isArray(value)) {
        // Handle FAQ array
        sanitized[key] = value.map((item) => {
          if (typeof item === 'object' && item !== null) {
            const sanitizedItem: any = {};
            for (const [itemKey, itemValue] of Object.entries(item)) {
              if (typeof itemValue === 'string') {
                const result = this.sanitizeRawResponse(itemValue);
                sanitizedItem[itemKey] = result.sanitized;
                if (result.modified) stats.htmlStripped++;
              } else {
                sanitizedItem[itemKey] = itemValue;
              }
            }
            return sanitizedItem;
          }
          return item;
        });
      } else {
        sanitized[key] = value;
      }
    }

    return { sanitized, stats };
  }

  /**
   * Strip HTML tags (keep only plain text)
   */
  stripHtmlTags(text: string): string {
    // Remove all HTML tags
    return text.replace(/<[^>]*>/g, '');
  }

  /**
   * Sanitize URLs
   */
  sanitizeUrl(url: string): string {
    // Remove javascript: and data: protocols
    let sanitized = url.replace(/^javascript:/gi, '');
    sanitized = sanitized.replace(/^data:/gi, '');
    
    // Ensure http/https only
    if (!/^https?:\/\//i.test(sanitized) && sanitized.length > 0) {
      return ''; // Invalid URL
    }
    
    return sanitized;
  }

  /**
   * Detect potential injection attempts
   */
  detectInjectionAttempts(text: string): {
    detected: boolean;
    patterns: string[];
  } {
    const injectionPatterns = [
      { name: 'SQL Injection', pattern: /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b).*(\bFROM\b|\bWHERE\b|\bTABLE\b)/gi },
      { name: 'XSS', pattern: /<script|javascript:|onerror=|onload=/gi },
      { name: 'Command Injection', pattern: /[;&|`$()]/g },
      { name: 'Path Traversal', pattern: /\.\.[\/\\]/g },
    ];

    const detected: string[] = [];

    for (const { name, pattern } of injectionPatterns) {
      if (pattern.test(text)) {
        detected.push(name);
      }
    }

    return {
      detected: detected.length > 0,
      patterns: detected,
    };
  }

  /**
   * Validate content safety
   */
  validateContentSafety(text: string): {
    isSafe: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for script tags
    if (/<script/gi.test(text)) {
      issues.push('Contains script tags');
    }

    // Check for event handlers
    if(/\s*on\w+\s*=/gi.test(text)) {
      issues.push('Contains event handlers');
    }

    // Check for javascript: protocol
    if (/javascript:/gi.test(text)) {
      issues.push('Contains javascript: protocol');
    }

    // Check for data URIs
    if (/data:text\/html/gi.test(text)) {
      issues.push('Contains data URIs');
    }

    // Check for iframes
    if (/<iframe/gi.test(text)) {
      issues.push('Contains iframe tags');
    }

    // Check for injection attempts
    const injection = this.detectInjectionAttempts(text);
    if (injection.detected) {
      issues.push(`Potential injection: ${injection.patterns.join(', ')}`);
    }

    return {
      isSafe: issues.length === 0,
      issues,
    };
  }

  /**
   * Normalize whitespace and encoding
   */
  normalizeContent(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\t/g, '  ') // Replace tabs with spaces
      .replace(/\u00a0/g, ' ') // Replace non-breaking spaces
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
      .trim();
  }

  /**
   * Full sanitization pipeline
   */
  fullSanitize(rawText: string): {
    sanitized: string;
    safe: boolean;
    modifications: string[];
    warnings: string[];
  } {
    const modifications: string[] = [];
    const warnings: string[] = [];

    // 1. Normalize
    let sanitized = this.normalizeContent(rawText);
    modifications.push('Normalized whitespace and encoding');

    // 2. Sanitize
    const sanitizeResult = this.sanitizeRawResponse(sanitized);
    sanitized = sanitizeResult.sanitized;
    
    if (sanitizeResult.modified) {
      modifications.push(...sanitizeResult.removedElements);
      warnings.push(...sanitizeResult.warnings);
    }

    // 3. Validate safety
    const safety = this.validateContentSafety(sanitized);
    
    if (!safety.isSafe) {
      warnings.push(...safety.issues);
    }

    return {
      sanitized,
      safe: safety.isSafe,
      modifications,
      warnings,
    };
  }
}
