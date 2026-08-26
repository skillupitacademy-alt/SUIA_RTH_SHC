#!/usr/bin/env node

/**
 * Phase 0A.2.2-B
 *
 * Database symbol and alias tracking.
 *
 * Static evidence only.
 */

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function detectAliases(content, symbol) {
  const aliases = [];

  const escaped =
    escapeRegex(symbol);

  const patterns = [
    new RegExp(
      `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${escaped}\\b`,
      'g',
    ),

    new RegExp(
      `\\b(?:const|let|var)\\s+\\{([^}]+)\\}\\s*=\\s*${escaped}\\b`,
      'g',
    ),
  ];

  for (const pattern of patterns) {
    let match;

    while ((match = pattern.exec(content)) !== null) {
      aliases.push({
        alias: match[1],
        line: getLineNumber(
          content,
          match.index,
        ),
      });
    }
  }

  return aliases;
}

function findSymbolUsages(
  content,
  symbol,
) {
  const usages = [];

  const pattern =
    new RegExp(
      `\\b${escapeRegex(symbol)}\\b`,
      'g',
    );

  let match;

  while ((match = pattern.exec(content)) !== null) {
    usages.push({
      symbol,
      index: match.index,
      line: getLineNumber(
        content,
        match.index,
      ),
    });
  }

  return usages;
}

export function trackDatabaseSymbols(
  file,
  databaseImports,
) {
  const symbols = [];

  for (const databaseImport of databaseImports) {
    const localSymbol =
      databaseImport.localSymbol;

    const usages =
      findSymbolUsages(
        file.content,
        localSymbol,
      );

    const aliases =
      detectAliases(
        file.content,
        localSymbol,
      );

    symbols.push({
      database:
        databaseImport.database,

      importedSymbol:
        databaseImport.importedSymbol,

      localSymbol,

      importLine:
        databaseImport.line,

      aliases,

      usages,

      confidence:
        'STATIC_SYMBOL_TRACKING',
    });
  }

  return symbols;
}

export function buildRequestSymbolMap(
  file,
  registry,
) {
  const normalized =
    file.relativePath.replace(
      /\\/g,
      '/',
    );

  const imports =
    registry.filter(
      item =>
        item.file === normalized,
    );

  return trackDatabaseSymbols(
    file,
    imports,
  );
}
