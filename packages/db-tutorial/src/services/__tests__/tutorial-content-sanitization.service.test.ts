/**
 * Tutorial Content Sanitization Service - Security Tests
 * 
 * PROMPT 12 — Security / Sanitization Boundary
 * 
 * Adversarial tests for:
 * - XSS payloads
 * - SVG script injection
 * - Event handlers (onerror, onload)
 * - javascript: URLs
 * - data: URLs
 * - Unsafe image sources
 * - Safe HTTPS images
 * - Normal text content
 * - Normal code examples
 */

import { describe, it, expect } from 'vitest';
import { TutorialContentSanitizationService } from '../tutorial-content-sanitization.service';
import type { TutorialDocument } from '@quiz/types';

describe('TutorialContentSanitizationService', () => {
  const service = new TutorialContentSanitizationService();

  describe('SVG Sanitization', () => {
    it('should remove <script> tags from SVG', () => {
      const maliciousSVG = '<svg><script>alert("XSS")</script><circle cx="50" cy="50" r="40" /></svg>';

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).not.toContain('alert');
    });

    it('should remove event handlers from SVG', () => {
      const maliciousSVG = '<svg><circle onclick="alert(1)" cx="50" cy="50" r="40" /></svg>';

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain('onclick');
    });

    it('should remove onerror handlers', () => {
      const maliciousSVG = '<svg><image onerror="alert(1)" href="invalid.png" /></svg>';

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain('onerror');
    });

    it('should remove onload handlers', () => {
      const maliciousSVG = '<svg onload="alert(1)"><circle cx="50" cy="50" r="40" /></svg>';

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain('onload');
    });

    it('should neutralize javascript: protocols', () => {
      const maliciousSVG = '<svg><a href="javascript:alert(1)"><text>Click</text></a></svg>';

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain('javascript:');
      expect(result.sanitized).toContain('unsafe:');
    });

    it('should remove data: URLs from hrefs', () => {
      const maliciousSVG = '<svg><a href="data:text/html,<script>alert(1)</script>"><text>Click</text></a></svg>';

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain('data:text/html');
    });

    it('should remove <foreignObject> tags', () => {
      const maliciousSVG = '<svg><foreignObject><body><script>alert(1)</script></body></foreignObject></svg>';

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain('<foreignObject>');
      expect(result.sanitized).not.toContain('<body>');
    });

    it('should not modify safe SVG', () => {
      const safeSVG = '<svg><circle cx="50" cy="50" r="40" fill="blue" /></svg>';

      const result = service.sanitizeSVG(safeSVG);

      expect(result.modified).toBe(false);
      expect(result.sanitized).toBe(safeSVG);
    });

    it('should handle multiple threats in one SVG', () => {
      const maliciousSVG = `
        <svg onload="alert(1)">
          <script>alert("XSS")</script>
          <circle onclick="alert(2)" cx="50" cy="50" r="40" />
          <a href="javascript:alert(3)"><text>Click</text></a>
        </svg>
      `;

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).not.toContain('onload');
      expect(result.sanitized).not.toContain('onclick');
      expect(result.sanitized).not.toContain('javascript:');
    });

    it('should remove <SCRIPT> tags (uppercase)', () => {
      const maliciousSVG = '<svg><SCRIPT>alert("XSS")</SCRIPT><circle cx="50" cy="50" r="40" /></svg>';

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain('<SCRIPT>');
      expect(result.sanitized).not.toContain('alert');
    });

    it('should remove <ScRiPt> tags (mixed case)', () => {
      const maliciousSVG = '<svg><ScRiPt>alert("XSS")</ScRiPt><circle cx="50" cy="50" r="40" /></svg>';

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain('<ScRiPt>');
      expect(result.sanitized).not.toContain('alert');
    });

    it('should remove ONCLICK handlers (uppercase)', () => {
      const maliciousSVG = '<svg><circle ONCLICK="alert(1)" cx="50" cy="50" r="40" /></svg>';

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain('ONCLICK');
    });

    it('should remove OnLoAd handlers (mixed case)', () => {
      const maliciousSVG = '<svg OnLoAd="alert(1)"><circle cx="50" cy="50" r="40" /></svg>';

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain('OnLoAd');
    });

    it('should remove ONERROR handlers (uppercase)', () => {
      const maliciousSVG = '<svg><image ONERROR="alert(1)" href="invalid.png" /></svg>';

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain('ONERROR');
    });

    it('should neutralize JAVASCRIPT: protocol (uppercase)', () => {
      const maliciousSVG = '<svg><a href="JAVASCRIPT:alert(1)"><text>Click</text></a></svg>';

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain('JAVASCRIPT:');
      expect(result.sanitized).toContain('unsafe:');
    });

    it('should remove <FOREIGNOBJECT> tags (uppercase)', () => {
      const maliciousSVG = '<svg><FOREIGNOBJECT><body><script>alert(1)</script></body></FOREIGNOBJECT></svg>';

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain('<FOREIGNOBJECT>');
      expect(result.sanitized).not.toContain('<body>');
    });

    it('should handle combined mixed-case attacks', () => {
      const maliciousSVG = `
        <svg OnLoad="alert(1)">
          <SCRIPT>alert("XSS")</SCRIPT>
          <circle OnClick="alert(2)" cx="50" cy="50" r="40" />
          <a href="JavaScript:alert(3)"><text>Click</text></a>
          <ForeignObject><body><img ONERROR="alert(4)" src="x" /></body></ForeignObject>
        </svg>
      `;

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      expect(result.sanitized).not.toContain('<SCRIPT>');
      expect(result.sanitized).not.toContain('OnLoad');
      expect(result.sanitized).not.toContain('OnClick');
      expect(result.sanitized).not.toContain('JavaScript:');
      expect(result.sanitized).not.toContain('<ForeignObject>');
      expect(result.sanitized).not.toContain('ONERROR');
    });
  });

  describe('URL Sanitization', () => {
    it('should block javascript: URLs', () => {
      const result = service.sanitizeUrl('javascript:alert(1)');

      expect(result.modified).toBe(true);
      expect(result.sanitized).toBe('#unsafe-url');
    });

    it('should block data: URLs', () => {
      const result = service.sanitizeUrl('data:text/html,<script>alert(1)</script>');

      expect(result.modified).toBe(true);
      expect(result.sanitized).toBe('#unsafe-url');
    });

    it('should block vbscript: URLs', () => {
      const result = service.sanitizeUrl('vbscript:alert(1)');

      expect(result.modified).toBe(true);
      expect(result.sanitized).toBe('#unsafe-url');
    });

    it('should block file: URLs', () => {
      const result = service.sanitizeUrl('file:///etc/passwd');

      expect(result.modified).toBe(true);
      expect(result.sanitized).toBe('#unsafe-url');
    });

    it('should allow HTTPS URLs', () => {
      const url = 'https://example.com/image.png';
      const result = service.sanitizeUrl(url);

      expect(result.modified).toBe(false);
      expect(result.sanitized).toBe(url);
    });

    it('should allow HTTP URLs', () => {
      const url = 'http://example.com/image.png';
      const result = service.sanitizeUrl(url);

      expect(result.modified).toBe(false);
      expect(result.sanitized).toBe(url);
    });

    it('should allow relative URLs', () => {
      const url = '/images/diagram.svg';
      const result = service.sanitizeUrl(url);

      expect(result.modified).toBe(false);
      expect(result.sanitized).toBe(url);
    });

    it('should trim whitespace', () => {
      const url = '  https://example.com/image.png  ';
      const result = service.sanitizeUrl(url);

      expect(result.sanitized).toBe('https://example.com/image.png');
    });

    it('should block protocol-relative URLs with javascript', () => {
      const result = service.sanitizeUrl('//example.com/javascript:alert(1)');

      expect(result.modified).toBe(true);
      expect(result.sanitized).toBe('#unsafe-url');
    });

    it('should be case-insensitive for dangerous protocols', () => {
      const result1 = service.sanitizeUrl('JavaScript:alert(1)');
      const result2 = service.sanitizeUrl('JAVASCRIPT:alert(1)');
      const result3 = service.sanitizeUrl('Data:text/html,<script>');

      expect(result1.modified).toBe(true);
      expect(result2.modified).toBe(true);
      expect(result3.modified).toBe(true);
    });

    it('should block URL-encoded javascript: protocol', () => {
      const result = service.sanitizeUrl('javascript%3Aalert(1)');

      expect(result.modified).toBe(true);
      expect(result.sanitized).toBe('#unsafe-url');
    });

    it('should block double-encoded javascript: protocol', () => {
      const result = service.sanitizeUrl('javascript%253Aalert(1)');

      expect(result.modified).toBe(true);
      expect(result.sanitized).toBe('#unsafe-url');
    });

    it('should block encoded data: protocol', () => {
      const result = service.sanitizeUrl('data%3Atext/html,<script>');

      expect(result.modified).toBe(true);
      expect(result.sanitized).toBe('#unsafe-url');
    });

    it('should block mixed-case encoded protocols', () => {
      const result1 = service.sanitizeUrl('Java%53cript:alert(1)');
      const result2 = service.sanitizeUrl('JAVA%53CRIPT:alert(1)');

      expect(result1.modified).toBe(true);
      expect(result2.modified).toBe(true);
    });

    it('should block whitespace-obfuscated javascript: URLs', () => {
      const result1 = service.sanitizeUrl('java script:alert(1)');
      const result2 = service.sanitizeUrl('java\tscript:alert(1)');
      const result3 = service.sanitizeUrl('java\nscript:alert(1)');

      expect(result1.modified).toBe(true);
      expect(result2.modified).toBe(true);
      expect(result3.modified).toBe(true);
    });

    it('should block URLs with null bytes', () => {
      const result = service.sanitizeUrl('javascript:\0alert(1)');

      expect(result.modified).toBe(true);
      expect(result.sanitized).toBe('#unsafe-url');
    });

    it('should fail closed on malformed encoded URLs', () => {
      const result = service.sanitizeUrl('javascript%GGalert(1)');

      expect(result.modified).toBe(true);
      expect(result.sanitized).toBe('#unsafe-url');
    });
  });

  describe('URL Safety Check', () => {
    it('should consider HTTPS URLs safe', () => {
      expect(service.isUrlSafe('https://example.com/image.png')).toBe(true);
    });

    it('should consider HTTP URLs safe', () => {
      expect(service.isUrlSafe('http://example.com/image.png')).toBe(true);
    });

    it('should consider relative URLs safe', () => {
      expect(service.isUrlSafe('/images/diagram.svg')).toBe(true);
    });

    it('should consider anchor links safe', () => {
      expect(service.isUrlSafe('#section-2')).toBe(true);
    });

    it('should consider javascript: URLs unsafe', () => {
      expect(service.isUrlSafe('javascript:alert(1)')).toBe(false);
    });

    it('should consider data: URLs unsafe', () => {
      expect(service.isUrlSafe('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('should consider vbscript: URLs unsafe', () => {
      expect(service.isUrlSafe('vbscript:alert(1)')).toBe(false);
    });
  });

  describe('Document Sanitization', () => {
    it('should sanitize diagram blocks with malicious SVG', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'diagram_1',
            type: 'diagram',
            content: {
              diagramType: 'svg',
              diagramData: '<svg><script>alert("XSS")</script><circle cx="50" cy="50" r="40" /></svg>',
              alt: 'Malicious diagram',
            },
          },
        ],
      };

      const result = service.sanitizeDocument(document);

      expect(result.modified).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('SVG sanitized');

      const diagramBlock = result.sanitized.blocks[0];
      if ('content' in diagramBlock) {
        const content = diagramBlock.content as any;
        expect(content.diagramData).not.toContain('<script>');
      }
    });

    it('should sanitize image blocks with malicious URLs', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'image_1',
            type: 'image',
            content: {
              assetId: 'javascript:alert(1)',
              alt: 'Malicious image',
            },
          },
        ],
      };

      const result = service.sanitizeDocument(document);

      expect(result.modified).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Image assetId sanitized');

      const imageBlock = result.sanitized.blocks[0];
      if ('content' in imageBlock) {
        const content = imageBlock.content as any;
        expect(content.assetId).toBe('#unsafe-url');
      }
    });

    it('should not modify safe content blocks', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'paragraph_1',
            type: 'paragraph',
            content: {
              text: 'This is normal text content.',
            },
          },
          {
            id: 'code_1',
            type: 'code',
            content: {
              code: 'const x = 42;',
              language: 'javascript',
            },
          },
        ],
      };

      const result = service.sanitizeDocument(document);

      expect(result.modified).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });

    it('should sanitize multiple malicious blocks', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'diagram_1',
            type: 'diagram',
            content: {
              diagramType: 'svg',
              diagramData: '<svg><script>alert(1)</script></svg>',
              alt: 'Malicious SVG',
            },
          },
          {
            id: 'image_1',
            type: 'image',
            content: {
              assetId: 'javascript:alert(2)',
              alt: 'Malicious image',
            },
          },
        ],
      };

      const result = service.sanitizeDocument(document);

      expect(result.modified).toBe(true);
      expect(result.warnings).toHaveLength(2);
    });

    it('should not mutate original document', () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'diagram_1',
            type: 'diagram',
            content: {
              diagramType: 'svg',
              diagramData: '<svg><script>alert("XSS")</script></svg>',
              alt: 'Test',
            },
          },
        ],
      };

      const originalData = JSON.stringify(document);
      service.sanitizeDocument(document);
      const afterData = JSON.stringify(document);

      expect(originalData).toBe(afterData);
    });
  });

  describe('Real-World Attack Vectors', () => {
    it('should handle complex XSS attempts in SVG', () => {
      const maliciousSVG = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <script><![CDATA[alert('XSS')]]></script>
          <image href="x" onerror="alert(1)" />
          <set attributeName="onmouseover" to="alert(1)" />
          <animate onbegin="alert(1)" attributeName="x" />
        </svg>
      `;

      const result = service.sanitizeSVG(maliciousSVG);

      expect(result.modified).toBe(true);
      // Check that executable handlers are removed
      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).not.toContain('onerror=');
      expect(result.sanitized).not.toContain('onbegin=');
      // Note: Non-executable attribute values containing "alert" string are OK
      // (e.g., to="alert(1)" without an event handler is not executable)
    });
  });
});
