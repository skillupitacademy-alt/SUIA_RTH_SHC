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
      secondary: '#0B1B3D',
      activeBackground: '#fff0f6',
      completed: '#08a64a',
    };
  }

  return {
    primary: '#d03f00',
    primaryDark: '#b63600',
    secondary: '#124fd6',
    activeBackground: '#eef3fa',
    completed: '#08a64a',
  };
}
