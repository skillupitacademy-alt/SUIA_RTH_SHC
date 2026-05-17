import React from 'react';

interface SVGIconRendererProps {
  dataUri: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Sanitizes a dataUri by detecting and unwrapping corrupted data.
 *
 * The AI sometimes returns {"svg": "<svg>..."} as a JSON wrapper.
 * If the admin tool then base64-encodes this JSON string, the stored
 * dataUri is technically valid base64 but decodes to JSON, not SVG.
 * This function detects and repairs that corruption transparently.
 */
function sanitizeDataUri(dataUri: string): string {
  if (!dataUri.startsWith('data:image/svg+xml;base64,')) return dataUri;

  try {
    const b64 = dataUri.slice('data:image/svg+xml;base64,'.length);
    const decoded = Buffer.from(b64, 'base64').toString('utf8');

    // If it decoded to raw SVG, it's already correct — re-encode cleanly
    if (decoded.trimStart().startsWith('<svg')) return dataUri;

    // Check if the decoded content is a JSON wrapper from the AI (e.g. {"svg": "..."})
    const parsed = JSON.parse(decoded);
    const rawSvg = parsed?.svg ?? parsed?.content ?? parsed?.data;
    if (typeof rawSvg === 'string' && rawSvg.includes('<svg')) {
      // Re-encode the actual SVG markup as a proper dataUri
      return `data:image/svg+xml;base64,${Buffer.from(rawSvg, 'utf8').toString('base64')}`;
    }
  } catch {
    // Not base64-encoded JSON — leave as-is
  }

  return dataUri;
}

/**
 * SVGIconRenderer Component
 *
 * Safely renders SVG content from a Data URI.
 * Handles both base64 and raw SVG data URIs,
 * and auto-repairs AI-generated JSON-wrapped SVG content.
 */
export const SVGIconRenderer: React.FC<SVGIconRendererProps> = ({
  dataUri: rawDataUri,
  alt = 'SVG Icon',
  className = '',
  style = {}
}) => {
  if (!rawDataUri) return null;

  const dataUri = sanitizeDataUri(rawDataUri);

  // If it's a valid Data URI (base64 or svg+xml)
  if (dataUri.startsWith('data:image/svg+xml')) {
    return (
      <img
        src={dataUri}
        alt={alt}
        className={className}
        style={style}
        loading="lazy"
      />
    );
  }

  // Fallback for raw SVG strings (though Data URI is preferred)
  if (dataUri.startsWith('<svg')) {
    return (
      <div
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: dataUri }}
      />
    );
  }

  return null;
};
