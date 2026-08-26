#!/usr/bin/env node

/**
 * Phase 0A.2.2-A Source Scanner
 *
 * READ-ONLY source inspection.
 *
 * Never serializes environment values,
 * secrets, passwords, tokens, or connection strings.
 */

import {
  existsSync,
  readdirSync,
  statSync,
  readFileSync,
} from 'fs';

import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..', '..');

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  '.turbo',
  '.cache',
  '.kiro',
  '.vscode',
  '.husky',
]);

const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);

function shouldIgnore(name) {
  return IGNORED_DIRECTORIES.has(name);
}

function isSourceFile(filePath) {
  const extension = filePath.slice(filePath.lastIndexOf('.'));
  return SOURCE_EXTENSIONS.has(extension);
}

function walkDirectory(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const results = [];

  for (const entry of readdirSync(directory, {
    withFileTypes: true,
  })) {
    if (shouldIgnore(entry.name)) {
      continue;
    }

    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      results.push(...walkDirectory(absolutePath));
      continue;
    }

    if (entry.isFile() && isSourceFile(absolutePath)) {
      results.push(absolutePath);
    }
  }

  return results;
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function createSnippet(content, index, radius = 80) {
  const start = Math.max(0, index - radius);
  const end = Math.min(content.length, index + radius);

  return content
    .slice(start, end)
    .replace(/\r/g, '')
    .replace(/\n/g, ' ')
    .trim();
}

export function scanSourceTree(rootPath) {
  const files = walkDirectory(rootPath);
  const findings = [];

  for (const filePath of files) {
    let content;

    try {
      content = readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    findings.push({
      absolutePath: filePath,
      relativePath: relative(PROJECT_ROOT, filePath),
      content,
      lineCount: content.split('\n').length,
    });
  }

  return findings;
}

export function findPatternMatches(file, pattern, category) {
  const matches = [];

  if (!pattern) {
    return matches;
  }

  let match;

  while ((match = pattern.exec(file.content)) !== null) {
    matches.push({
      category,
      file: file.relativePath,
      line: getLineNumber(file.content, match.index),
      snippet: createSnippet(file.content, match.index),
    });

    if (!pattern.global) {
      break;
    }
  }

  return matches;
}

export function scanForText(files, text, category) {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const pattern = new RegExp(
    escaped,
    'g',
  );

  const results = [];

  for (const file of files) {
    results.push(
      ...findPatternMatches(file, pattern, category),
    );
  }

  return results;
}

export function getProjectRoot() {
  return PROJECT_ROOT;
}
