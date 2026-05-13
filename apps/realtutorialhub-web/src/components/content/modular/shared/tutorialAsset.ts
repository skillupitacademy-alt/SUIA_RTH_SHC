export interface InlineSvgAsset {
  type: 'inline_svg';
  name: string;
  alt: string;
  width: number;
  height: number;
  dataUri: string;
  caption?: string;
}

interface LegacyImageAsset {
  url: string;
  alt: string;
  caption?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isInlineSvgAsset(value: unknown): value is InlineSvgAsset {
  return (
    isRecord(value) &&
    value.type === 'inline_svg' &&
    typeof value.name === 'string' &&
    typeof value.alt === 'string' &&
    typeof value.dataUri === 'string' &&
    typeof value.width === 'number' &&
    typeof value.height === 'number'
  );
}

function isLegacyImageAsset(value: unknown): value is LegacyImageAsset {
  return (
    isRecord(value) &&
    typeof value.url === 'string' &&
    typeof value.alt === 'string'
  );
}

export function getTutorialAssetImageSource(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  if (isInlineSvgAsset(value)) {
    return value.dataUri;
  }

  if (isLegacyImageAsset(value)) {
    return value.url;
  }

  return null;
}

export function getTutorialAssetAlt(value: unknown, fallback = ''): string {
  if (isInlineSvgAsset(value)) {
    return value.alt;
  }

  if (isLegacyImageAsset(value)) {
    return value.alt;
  }

  return fallback;
}

export function getTutorialAssetCaption(value: unknown): string | null {
  if (isInlineSvgAsset(value) && typeof value.caption === 'string' && value.caption.trim().length > 0) {
    return value.caption;
  }

  if (isLegacyImageAsset(value) && typeof value.caption === 'string' && value.caption.trim().length > 0) {
    return value.caption;
  }

  return null;
}
