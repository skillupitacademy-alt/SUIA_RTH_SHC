/**
 * Unit Tests for Server-Side SafeUrlFetcher & SSRF Guardrails (Prompt 05)
 */

import { describe, it, expect } from 'vitest';
import { SafeUrlFetcher } from '../parsers/safe-url-fetcher';
import { TutorialDocumentValidationError } from '@quiz/types';

describe('SafeUrlFetcher (Server-Side SSRF Protection)', () => {
  const fetcher = new SafeUrlFetcher();

  describe('validateUrl (SSRF Guardrails)', () => {
    it('blocks localhost and loopback IPv4/IPv6 addresses', () => {
      expect(() => fetcher.validateUrl('http://localhost:3000/admin')).toThrow(
        TutorialDocumentValidationError
      );
      expect(() => fetcher.validateUrl('http://127.0.0.1/secrets')).toThrow(
        TutorialDocumentValidationError
      );
      expect(() => fetcher.validateUrl('http://0.0.0.0:8080')).toThrow(
        TutorialDocumentValidationError
      );
      expect(() => fetcher.validateUrl('http://[::1]/private')).toThrow(
        TutorialDocumentValidationError
      );
    });

    it('blocks private IPv4 network ranges (RFC 1918 & Link-Local)', () => {
      // 10.0.0.0/8
      expect(() => fetcher.validateUrl('http://10.0.0.1/config')).toThrow(
        TutorialDocumentValidationError
      );
      // 192.168.0.0/16
      expect(() => fetcher.validateUrl('http://192.168.1.1/router')).toThrow(
        TutorialDocumentValidationError
      );
      // 172.16.0.0/12
      expect(() => fetcher.validateUrl('http://172.20.0.5/api')).toThrow(
        TutorialDocumentValidationError
      );
      // 169.254.0.0/16 (AWS/Cloud metadata)
      expect(() => fetcher.validateUrl('http://169.254.169.254/latest/meta-data/')).toThrow(
        TutorialDocumentValidationError
      );
    });

    it('blocks internal and local top-level domains', () => {
      expect(() => fetcher.validateUrl('http://internal-db.local/data')).toThrow(
        TutorialDocumentValidationError
      );
      expect(() => fetcher.validateUrl('http://service.internal/status')).toThrow(
        TutorialDocumentValidationError
      );
      expect(() => fetcher.validateUrl('http://corp-server.corp/api')).toThrow(
        TutorialDocumentValidationError
      );
    });

    it('blocks forbidden protocols (file:, ftp:, gopher:, javascript:)', () => {
      expect(() => fetcher.validateUrl('file:///etc/passwd')).toThrow(
        TutorialDocumentValidationError
      );
      expect(() => fetcher.validateUrl('ftp://ftp.example.com/file.txt')).toThrow(
        TutorialDocumentValidationError
      );
      expect(() => fetcher.validateUrl('javascript:alert(1)')).toThrow(
        TutorialDocumentValidationError
      );
    });

    it('permits valid public HTTP and HTTPS documentation URLs', () => {
      const parsedHttps = fetcher.validateUrl('https://developer.mozilla.org/en-US/docs/Web/JavaScript');
      expect(parsedHttps.hostname).toBe('developer.mozilla.org');

      const parsedHttp = fetcher.validateUrl('http://example.com/tutorials/intro');
      expect(parsedHttp.hostname).toBe('example.com');
    });
  });
});
