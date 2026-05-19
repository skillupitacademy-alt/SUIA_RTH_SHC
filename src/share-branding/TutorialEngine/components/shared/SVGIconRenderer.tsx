import React from 'react';

interface SVGIconRendererProps {
  dataUri: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Universal, environment-safe Base64 UTF-8 decoder.
 * Works flawlessly in both browser (client-side) and Node.js (server-side / SSR).
 */
function safeDecodeBase64(str: string): string {
  try {
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      const binaryString = window.atob(str);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    } else {
      return Buffer.from(str, 'base64').toString('utf8');
    }
  } catch (e) {
    console.error('Error decoding base64:', e);
    return '';
  }
}

/**
 * Sanitizes a dataUri by detecting and unwrapping corrupted data,
 * and decodes base64 SVG data URIs into raw SVG strings for clean inline rendering.
 */
function sanitizeDataUri(dataUri: string): string {
  if (!dataUri.startsWith('data:image/svg+xml;base64,')) return dataUri;

  try {
    const b64 = dataUri.slice('data:image/svg+xml;base64,'.length);
    const decoded = safeDecodeBase64(b64);

    if (!decoded) return dataUri;

    // Check if the decoded content is a JSON wrapper from the AI (e.g. {"svg": "..."})
    if (decoded.trimStart().startsWith('{')) {
      const parsed = JSON.parse(decoded);
      const rawSvg = parsed?.svg ?? parsed?.content ?? parsed?.data;
      if (typeof rawSvg === 'string' && rawSvg.trimStart().startsWith('<svg')) {
        return rawSvg;
      }
    }

    if (decoded.trimStart().startsWith('<svg')) {
      return decoded;
    }
  } catch (e) {
    console.error('Sanitization failed, falling back to original dataUri:', e);
  }

  return dataUri;
}

/**
 * SVGIconRenderer Component
 *
 * Safely renders SVG content.
 * Decodes base64 Data URIs to raw inline SVG elements for maximum fidelity and browser compatibility.
 */
export const SVGIconRenderer: React.FC<SVGIconRendererProps> = ({
  dataUri: rawDataUri,
  alt = 'SVG Icon',
  className = '',
  style = {}
}) => {
  if (!rawDataUri) return null;

  const dataUri = sanitizeDataUri(rawDataUri);

  // If we successfully decoded it to inline raw SVG
  if (dataUri.trimStart().startsWith('<svg')) {
    return (
      <div
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: dataUri }}
      />
    );
  }

  // Fallback if decoding failed or if it is a regular data URI
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

  return null;
};

