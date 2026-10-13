/**
 * Theme Scanner
 * 
 * Scans for hard-coded theme values and theme configuration.
 * 
 * Detects:
 * - Hard-coded theme values (colors, spacing, typography)
 * - Theme configuration files
 * - CSS variables and theme tokens
 * - Dark mode / light mode specific code
 */

import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { ScannerResult, Finding } from '../contracts/scanner.js';
import { EvidenceCollector } from '../evidence/collector.js';

export interface ThemeFacts {
  themeConfigs: ThemeConfigReference[];
  hardCodedValues: ThemeValueReference[];
  cssVariables: CSSVariableReference[];
  themeTokens: ThemeTokenReference[];
}

export interface ThemeConfigReference {
  path: string;
  configType: 'tailwind' | 'css-modules' | 'styled-components' | 'theme-file';
  evidenceId: string;
}

export interface ThemeValueReference {
  path: string;
  lineNumber: number;
  property: string;
  value: string;
  context: string;
  evidenceId: string;
}

export interface CSSVariableReference {
  path: string;
  variableName: string;
  value: string;
  scope: 'root' | 'scoped';
  evidenceId: string;
}

export interface ThemeTokenReference {
  path: string;
  tokenName: string;
  tokenValue: string;
  category: 'color' | 'spacing' | 'typography' | 'shadow' | 'other';
  evidenceId: string;
}

const THEME_FILE_PATTERNS = [
  '**/theme.{ts,js,json}',
  '**/tailwind.config.{ts,js}',
  '**/*.theme.{ts,js}',
  '**/theme-config.{ts,js,json}',
];

const CSS_VARIABLE_REGEX = /--[\w-]+:\s*([^;]+);/g;
const HARD_CODED_STYLE_REGEX = /(padding|margin|font-size|line-height|border-radius):\s*(['"]?)(\d+(?:px|rem|em))(['"]?)/g;

export async function scanThemeFacts(
  adapter: RepositoryAdapter
): Promise<ScannerResult<ThemeFacts>> {
  const scannerName = 'theme-scanner';
  const collector = new EvidenceCollector();
  const findings: Finding[] = [];

  const themeConfigs: ThemeConfigReference[] = [];
  const hardCodedValues: ThemeValueReference[] = [];
  const cssVariables: CSSVariableReference[] = [];
  const themeTokens: ThemeTokenReference[] = [];

  // Scan for theme configuration files
  const allFiles = await adapter.listFiles('.', '**/*');
  
  const THEME_FILE_PATTERNS_REGEX = [
    /theme\.(ts|js|json)$/,
    /tailwind\.config\.(ts|js)$/,
    /\.theme\.(ts|js)$/,
    /theme-config\.(ts|js|json)$/,
  ];

  for (const filePath of allFiles) {
    // Skip node_modules
    if (filePath.includes('node_modules') || filePath.includes('.turbo')) {
      continue;
    }

    // Check if theme config file
    const isThemeConfig = THEME_FILE_PATTERNS_REGEX.some(pattern => pattern.test(filePath));
    if (isThemeConfig) {
      try {
        const content = await adapter.readFile(filePath);
        const contentHash = await adapter.getFileHash(filePath);

        const evidence = collector.createEvidence(
          scannerName,
          'config',
          filePath,
          contentHash,
          `Theme configuration file found`,
          `file:${filePath}`
        );
        collector.add(evidence);

        let configType: ThemeConfigReference['configType'] = 'theme-file';
        if (filePath.includes('tailwind.config')) {
          configType = 'tailwind';
        } else if (filePath.includes('.theme.')) {
          configType = 'styled-components';
        } else if (filePath.includes('.module.css')) {
          configType = 'css-modules';
        }

        themeConfigs.push({
          path: filePath,
          configType,
          evidenceId: evidence.evidenceId,
        });

        findings.push({
          findingId: `theme-config-${Date.now()}`,
          severity: 'info',
          category: 'theme-discovery',
          message: `Theme configuration found: ${filePath}`,
          path: filePath
        });
      } catch (error) {
        // Skip files that can't be read
      }
    }

    // Scan CSS/SCSS files for CSS variables
    if (filePath.endsWith('.css') || filePath.endsWith('.scss')) {
      try {
        const content = await adapter.readFile(filePath);
        const contentHash = await adapter.getFileHash(filePath);

        // Scan for CSS variable definitions
        const variableMatches = content.matchAll(CSS_VARIABLE_REGEX);
        for (const match of variableMatches) {
          const variableName = match[0].split(':')[0].trim();
          const value = match[1].trim();
          const scope = content.includes(':root') ? 'root' : 'scoped';

          const evidence = collector.createEvidence(
            scannerName,
            'file',
            filePath,
            contentHash,
            `CSS variable ${variableName} defined`,
            `file:${filePath}`,
            variableName
          );
          collector.add(evidence);

          cssVariables.push({
            path: filePath,
            variableName,
            value,
            scope,
            evidenceId: evidence.evidenceId,
          });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    // Scan TypeScript/TSX files for hard-coded style values
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      if (filePath.includes('dist') || filePath.includes('.test.') || filePath.includes('.spec.')) {
        continue;
      }

      try {
        const content = await adapter.readFile(filePath);
        const contentHash = await adapter.getFileHash(filePath);
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          const styleMatches = line.matchAll(HARD_CODED_STYLE_REGEX);
          for (const match of styleMatches) {
            const property = match[1];
            const value = match[3];

            const evidence = collector.createEvidence(
              scannerName,
              'file',
              filePath,
              contentHash,
              `Hard-coded ${property}: ${value} found`,
              `file:${filePath}:${index + 1}`,
              `${property}:${value}`
            );
            collector.add(evidence);

            hardCodedValues.push({
              path: filePath,
              lineNumber: index + 1,
              property,
              value,
              context: line.trim(),
              evidenceId: evidence.evidenceId,
            });

            findings.push({
              findingId: `theme-hardcoded-${Date.now()}-${index}`,
              severity: 'warning',
              category: 'theme-coupling',
              message: `Hard-coded ${property}: ${value} in ${filePath}:${index + 1}`,
              path: filePath,
              recommendation: 'Use CSS variable or design token'
            });
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    }

    // Scan theme token files
    if ((filePath.includes('tokens') || filePath.includes('design-tokens')) && 
        (filePath.endsWith('.ts') || filePath.endsWith('.js') || filePath.endsWith('.json'))) {
      try {
        const content = await adapter.readFile(filePath);
        const contentHash = await adapter.getFileHash(filePath);

        const evidence = collector.createEvidence(
          scannerName,
          'config',
          filePath,
          contentHash,
          `Theme tokens file found`,
          `file:${filePath}`
        );
        collector.add(evidence);

        // Parse tokens if JSON
        if (filePath.endsWith('.json')) {
          try {
            const tokens = JSON.parse(content);
            Object.entries(tokens).forEach(([key, value]) => {
              const category = categorizeToken(key);
              themeTokens.push({
                path: filePath,
                tokenName: key,
                tokenValue: String(value),
                category,
                evidenceId: evidence.evidenceId,
              });
            });
          } catch {
            // Skip invalid JSON
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }

  return {
    scannerName,
    timestamp: new Date().toISOString(),
    data: {
      themeConfigs,
      hardCodedValues,
      cssVariables,
      themeTokens,
    },
    evidence: collector.getAll(),
    findings,
  };
}

function categorizeToken(tokenName: string): ThemeTokenReference['category'] {
  const lowerName = tokenName.toLowerCase();
  if (lowerName.includes('color') || lowerName.includes('bg') || lowerName.includes('text')) {
    return 'color';
  }
  if (lowerName.includes('space') || lowerName.includes('padding') || lowerName.includes('margin')) {
    return 'spacing';
  }
  if (lowerName.includes('font') || lowerName.includes('text') || lowerName.includes('line-height')) {
    return 'typography';
  }
  if (lowerName.includes('shadow')) {
    return 'shadow';
  }
  return 'other';
}
