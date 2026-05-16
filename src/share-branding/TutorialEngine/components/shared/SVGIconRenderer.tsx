import React from 'react';

interface SVGIconRendererProps {
  dataUri: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * SVGIconRenderer Component
 * 
 * Safely renders SVG content from a Data URI.
 * Handles both base64 and raw SVG data URIs.
 */
export const SVGIconRenderer: React.FC<SVGIconRendererProps> = ({ 
  dataUri, 
  alt = 'SVG Icon', 
  className = '', 
  style = {} 
}) => {
  if (!dataUri) return null;

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
