import { type CSSProperties } from 'react';

export type ModularContentRecord = Record<string, unknown>;

export function toRecord(value: unknown): ModularContentRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as ModularContentRecord)
    : {};
}

export function pickSection(source: ModularContentRecord, keys: string[]): never | undefined {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) {
      return value as never;
    }
  }

  return undefined;
}

export function pickString(source: ModularContentRecord, key: string, fallback: string): string {
  const value = source[key];
  return typeof value === 'string' ? value : fallback;
}

export function getLayoutStyle(source: ModularContentRecord): CSSProperties {
  const layout = toRecord(source.layout);
  const customStyles = toRecord(layout.customStyles) as CSSProperties;

  return {
    padding: layout.padding as CSSProperties['padding'],
    margin: layout.margin as CSSProperties['margin'],
    ...customStyles,
  };
}
