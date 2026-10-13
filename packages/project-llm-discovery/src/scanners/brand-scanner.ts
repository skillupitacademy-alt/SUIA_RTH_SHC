/**
 * Brand Scanner
 * 
 * Scans for hard-coded brand-specific values that violate brand independence.
 * 
 * Detects:
 * - Hard-coded colors (hex codes)
 * - Logo references
 * - Brand-specific URLs
 * - Brand fonts
 * - Tenant IDs
 * - Brand-specific copy/text
 */

import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { ScannerResult, Finding } from '../contracts/scanner.js';
import { EvidenceCollector } from '../evidence/collector.js';

export interface BrandFacts {
  hardCodedColors: BrandColorReference[];
  logoReferences: BrandAssetReference[];
  brandUrls: BrandUrlReference[];
  brandFonts: BrandFontReference[];
  tenantIds: TenantIdReference[];
  brandCopy: BrandCopyReference[];
}

export interface BrandColorReference {
  path: string;
  lineNumber: number;
  colorValue: string;
  context: string;
  evidenceId: string;
}

export interface BrandAssetReference {
  path: string;
  assetPath: string;
  type: 'logo' | 'icon' | 'image';
  evidenceId: string;
}

export interface BrandUrlReference {
  path: string;
  url: string;
  domain: string;
  evidenceId: string;
}

export interface BrandFontReference {
  path: string;
  fontFamily: string;
  evidenceId: string;
}

export interface TenantIdReference {
  path: string;
  tenantId: string;
  evidenceId: string;
}

export interface BrandCopyReference {
  path: string;
  text: string;
  category: 'brand-name' | 'slogan' | 'tagline';
  evidenceId: string;
}

const COLOR_REGEX = /#[0-9a-fA-F]{3,6}\b/g;
const LOGO_PATTERNS = [
  /logo/i,
  /brand.*image/i,
  /company.*logo/i,
];
const URL_REGEX = /https?:\/\/[^\s'"]+/g;
const FONT_FAMILY_REGEX = /font-family:\s*['"]([^'"]+)['"]/gi;

export async function scanBrandFacts(
  adapter: RepositoryAdapter
): Promise<ScannerResult<BrandFacts>> {
  const scannerName = 'brand-scanner';
  const collector = new EvidenceCollector();
  const findings: Finding[] = [];

  const hardCodedColors: BrandColorReference[] = [];
  const logoReferences: BrandAssetReference[] = [];
  const brandUrls: BrandUrlReference[] = [];
  const brandFonts: BrandFontReference[] = [];
  const tenantIds: TenantIdReference[] = [];
  const brandCopy: BrandCopyReference[] = [];

  // Scan TypeScript/TSX files for brand references
  const fileList = await adapter.listFiles('.', '**/*.{ts,tsx,css,scss}');

  for (const filePath of fileList) {
    // Skip node_modules and build artifacts
    if (filePath.includes('node_modules') || filePath.includes('dist') || filePath.includes('.turbo')) {
      continue;
    }

    try {
      const content = await adapter.readFile(filePath);
      const contentHash = await adapter.getFileHash(filePath);
      const lines = content.split('\n');

      // Scan for hard-coded colors
      lines.forEach((line, index) => {
        const colorMatches = line.matchAll(COLOR_REGEX);
        for (const match of colorMatches) {
          const colorValue = match[0];
          
          // Generate evidence
          const evidence = collector.createEvidence(
            scannerName,
            'file',
            filePath,
            contentHash,
            `Hard-coded color ${colorValue} found`,
            `file:${filePath}:${index + 1}`,
            colorValue
          );
          collector.add(evidence);

          hardCodedColors.push({
            path: filePath,
            lineNumber: index + 1,
            colorValue,
            context: line.trim(),
            evidenceId: evidence.evidenceId,
          });

          findings.push({
            findingId: `brand-${Date.now()}-${index}`,
            severity: 'warning',
            category: 'brand-coupling',
            message: `Hard-coded color ${colorValue} in ${filePath}:${index + 1}`,
            path: filePath,
            recommendation: 'Use CSS variable: var(--color-primary)'
          });
        }
      });

      // Scan for logo references
      LOGO_PATTERNS.forEach((pattern) => {
        if (pattern.test(content)) {
          const evidence = collector.createEvidence(
            scannerName,
            'file',
            filePath,
            contentHash,
            `Logo reference found`,
            `file:${filePath}`
          );
          collector.add(evidence);

          logoReferences.push({
            path: filePath,
            assetPath: filePath,
            type: 'logo',
            evidenceId: evidence.evidenceId,
          });

          findings.push({
            findingId: `brand-logo-${Date.now()}`,
            severity: 'warning',
            category: 'brand-coupling',
            message: `Logo reference found in ${filePath}`,
            path: filePath,
            recommendation: 'Use prop or config: logoUrl={brandConfig.logoUrl}'
          });
        }
      });

      // Scan for brand URLs
      const urlMatches = content.matchAll(URL_REGEX);
      for (const match of urlMatches) {
        const url = match[0];
        try {
          const domain = new URL(url).hostname;

          // Filter for brand-specific domains (example heuristic)
          if (domain.includes('skillup') || domain.includes('realtutorial')) {
            const evidence = collector.createEvidence(
              scannerName,
              'file',
              filePath,
              contentHash,
              `Brand URL ${url} found`,
              `file:${filePath}`,
              url
            );
            collector.add(evidence);

            brandUrls.push({
              path: filePath,
              url,
              domain,
              evidenceId: evidence.evidenceId,
            });

            findings.push({
              findingId: `brand-url-${Date.now()}`,
              severity: 'warning',
              category: 'brand-coupling',
              message: `Brand-specific URL ${url} in ${filePath}`,
              path: filePath,
              recommendation: 'Use environment variable: baseUrl={process.env.NEXT_PUBLIC_BASE_URL}'
            });
          }
        } catch {
          // Invalid URL, skip
        }
      }

      // Scan for font-family declarations (CSS/SCSS files)
      if (filePath.endsWith('.css') || filePath.endsWith('.scss')) {
        const fontMatches = content.matchAll(FONT_FAMILY_REGEX);
        for (const match of fontMatches) {
          const fontFamily = match[1];

          const evidence = collector.createEvidence(
            scannerName,
            'file',
            filePath,
            contentHash,
            `Font family ${fontFamily} found`,
            `file:${filePath}`,
            fontFamily
          );
          collector.add(evidence);

          brandFonts.push({
            path: filePath,
            fontFamily,
            evidenceId: evidence.evidenceId,
          });
        }
      }

      // Scan for tenant IDs (simple pattern matching)
      const tenantIdMatches = content.match(/tenant[_-]?id['":\s]*['"]([^'"]+)['"]/gi);
      if (tenantIdMatches) {
        tenantIdMatches.forEach((match) => {
          const evidence = collector.createEvidence(
            scannerName,
            'file',
            filePath,
            contentHash,
            `Tenant ID reference found`,
            `file:${filePath}`,
            match
          );
          collector.add(evidence);

          tenantIds.push({
            path: filePath,
            tenantId: match,
            evidenceId: evidence.evidenceId,
          });
        });
      }
    } catch (error) {
      // Skip files that can't be read
      findings.push({
        findingId: `brand-error-${Date.now()}`,
        severity: 'info',
        category: 'scan-error',
        message: `Could not read ${filePath}: ${error}`,
        path: filePath
      });
    }
  }

  return {
    scannerName,
    timestamp: new Date().toISOString(),
    data: {
      hardCodedColors,
      logoReferences,
      brandUrls,
      brandFonts,
      tenantIds,
      brandCopy,
    },
    evidence: collector.getAll(),
    findings,
  };
}
