'use client';

import React from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlProps {
    html: string;
    className?: string;
}

/**
 * SafeHtml component that sanitizes HTML content using DOMPurify.
 * This is the preferred way to render any user-generated or external HTML content.
 * It explicitly blocks javascript: URLs and dangerous tags/attributes.
 * 
 * Note: Uses client-only DOMPurify (not isomorphic-dompurify) to avoid
 * pulling jsdom into the SSR bundle, which causes ESM/CJS conflicts on Vercel.
 */
export function SafeHtml({ html, className }: SafeHtmlProps) {
    if (typeof window === 'undefined') {
        // Server-side fallback: return empty div (content rendered on client hydration)
        return <div className={className} />;
    }

    const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'b', 'i', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'blockquote', 'code', 'pre', 'a'
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'className'],
        // Explicitly block javascript: URLs to prevent XSS via href
        ALLOWED_URI_REGEXP: /^(?:(?:(?:https?|mailto|ftp):|[^:/?#]*(?:[/?#]|$)))/i,
        RETURN_TRUSTED_TYPE: true,
    });

    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: clean as unknown as string }}
        />
    );
}

