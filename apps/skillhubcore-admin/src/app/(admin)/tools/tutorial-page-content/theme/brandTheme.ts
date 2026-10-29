import type { BrandTutorialTheme, TutorialSidebarBrandId } from '@quiz/types';

/**
 * Brand Theme Module
 * 
 * Maps brand identifiers to their corresponding tutorial theme colors.
 * This maintains brand-specific styling for tutorial content rendering.
 */

/**
 * Get the tutorial theme for a specific brand
 * 
 * @param brandId - Brand identifier ('skillup', 'shared', 'rth')
 * @returns Theme object with brand colors
 */
export function themeForBrand(brandId: TutorialSidebarBrandId): BrandTutorialTheme {
  if (brandId === 'skillup' || brandId === 'shared') {
    return {
      primary: '#f54a8d',
      primaryDark: '#d63d7a',
      secondary: '#133382',
      accent1: '#0284c7',
      accent2: '#10b981',
      stepAccent1: '#be123c',
      stepAccent2: '#0369a1',
      stepAccent3: '#047857',
      activeBackground: '#fff0f6',
      completed: '#08a64a',
    };
  }

  return {
    primary: '#d03f00',
    primaryDark: '#b63600',
    secondary: '#124fd6',
    accent1: '#4f46e5',
    accent2: '#b45309',
    stepAccent1: '#e11d48',
    stepAccent2: '#4f46e5',
    stepAccent3: '#b45309',
    activeBackground: '#eef3fa',
    completed: '#08a64a',
  };
}
