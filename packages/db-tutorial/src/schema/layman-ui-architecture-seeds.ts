/* istanbul ignore file */
/**
 * Layman Section UI Architecture Seeds
 * Phase 2B.3 - UI/UX Rendering Architecture
 * 
 * Defines how the Layman section is rendered in the frontend
 * Component mapping, layout configuration, and accessibility profiles
 */

import { NewUIArchitecture } from './ui-architectures';

/**
 * Universal Layman Renderer
 * Standard rendering configuration for all brands
 */
export const universalLaymanUIArchitecture: Omit<NewUIArchitecture, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Universal Layman Renderer',
  description: 'Standard beginner-friendly rendering with warm, supportive design. Optimized for clarity and emotional safety.',
  
  sectionRenderers: [
    {
      sectionType: 'layman',
      componentName: 'LaymanSectionShell',
      layoutConfig: {
        spacing: 'comfortable',
        maxWidth: '800px',
        imagePosition: 'inline',
        codeTheme: 'beginner-friendly',
        cardStyle: 'elevated',
      },
    },
  ],
  
  responsiveBreakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
  },
  
  accessibilityProfile: 'standard',
  
  brandId: 'shared',
  brandVisibility: 'shared_visible',
  brandCompatibility: [
    {
      brandId: 'realtutorialhub',
      isCompatible: true,
      customTheme: {
        primaryColor: '#2563eb',
        accentColor: '#10b981',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
    {
      brandId: 'skillup',
      isCompatible: true,
      customTheme: {
        primaryColor: '#7c3aed',
        accentColor: '#f59e0b',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '12px',
      },
    },
  ],
  
  isActive: true,
  usageCount: 0,
};

/**
 * Subsection-Specific Renderers
 * Detailed component mapping for each Layman subsection
 */
export const laymanSubsectionRenderers = {
  simple_overview: {
    componentName: 'LaymanHeader',
    description: 'Renders the simple overview with welcoming header',
    props: {
      showIcon: true,
      iconType: 'lightbulb',
      backgroundColor: 'warm',
    },
    layoutConfig: {
      padding: 'large',
      textAlign: 'left',
      fontSize: 'large',
    },
  },
  
  everyday_analogy: {
    componentName: 'AnalogyRenderer',
    description: 'Renders analogies with visual emphasis',
    props: {
      showComparisonIcon: true,
      highlightStyle: 'soft-background',
      allowExpand: true,
    },
    layoutConfig: {
      padding: 'medium',
      borderStyle: 'subtle',
      backgroundColor: 'light-blue',
    },
  },
  
  why_it_exists: {
    componentName: 'MotivationRenderer',
    description: 'Renders motivation and context',
    props: {
      showIcon: true,
      iconType: 'question-circle',
      emphasizeRelevance: true,
    },
    layoutConfig: {
      padding: 'medium',
      textAlign: 'left',
    },
  },
  
  simple_use_cases: {
    componentName: 'UseCaseRenderer',
    description: 'Renders practical examples in card format',
    props: {
      layout: 'cards',
      showNumbers: true,
      allowInteraction: true,
    },
    layoutConfig: {
      gridColumns: 2,
      gap: 'medium',
      cardStyle: 'outlined',
    },
  },
  
  beginner_breakdown: {
    componentName: 'BeginnerBreakdownRenderer',
    description: 'Renders step-by-step breakdown with progressive disclosure',
    props: {
      showStepNumbers: true,
      allowCollapse: true,
      progressIndicator: true,
    },
    layoutConfig: {
      spacing: 'comfortable',
      stepStyle: 'numbered-cards',
    },
  },
  
  mental_model: {
    componentName: 'MentalModelRenderer',
    description: 'Renders visual mental models and diagrams',
    props: {
      visualType: 'diagram',
      allowZoom: true,
      showDescription: true,
    },
    layoutConfig: {
      imagePosition: 'center',
      maxImageWidth: '600px',
      captionPosition: 'below',
    },
  },
  
  common_beginner_confusions: {
    componentName: 'BeginnerFAQRenderer',
    description: 'Renders common confusions in FAQ accordion format',
    props: {
      layout: 'accordion',
      showWarningIcon: true,
      expandable: true,
    },
    layoutConfig: {
      spacing: 'compact',
      iconColor: 'warning',
      backgroundColor: 'light-yellow',
    },
  },
  
  simple_summary: {
    componentName: 'SummaryRenderer',
    description: 'Renders summary with key takeaways',
    props: {
      showCheckmarks: true,
      highlightKeyPoints: true,
      encouragingMessage: true,
    },
    layoutConfig: {
      padding: 'large',
      backgroundColor: 'light-green',
      borderStyle: 'solid',
    },
  },
};

/**
 * Accessibility-Optimized Layman Renderer
 * Enhanced for screen readers and assistive technologies
 */
export const accessibilityLaymanUIArchitecture: Omit<NewUIArchitecture, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Accessibility-Optimized Layman Renderer',
  description: 'Screen reader optimized rendering with semantic HTML, ARIA labels, and keyboard navigation.',
  
  sectionRenderers: [
    {
      sectionType: 'layman',
      componentName: 'LaymanSectionShell',
      layoutConfig: {
        spacing: 'comfortable',
        maxWidth: '800px',
        imagePosition: 'inline',
        codeTheme: 'high-contrast',
        cardStyle: 'flat',
      },
    },
  ],
  
  responsiveBreakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
  },
  
  accessibilityProfile: 'screen_reader_optimized',
  
  brandId: 'shared',
  brandVisibility: 'shared_visible',
  brandCompatibility: [
    {
      brandId: 'realtutorialhub',
      isCompatible: true,
      customRenderers: [
        {
          subsectionType: 'mental_model',
          componentName: 'AccessibleMentalModelRenderer',
          ariaDescriptions: true,
          altTextRequired: true,
        },
      ],
    },
    {
      brandId: 'skillup',
      isCompatible: true,
      customRenderers: [
        {
          subsectionType: 'mental_model',
          componentName: 'AccessibleMentalModelRenderer',
          ariaDescriptions: true,
          altTextRequired: true,
        },
      ],
    },
  ],
  
  isActive: true,
  usageCount: 0,
};

/**
 * Mobile-First Layman Renderer
 * Optimized for mobile devices and touch interactions
 */
export const mobileLaymanUIArchitecture: Omit<NewUIArchitecture, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Mobile-First Layman Renderer',
  description: 'Mobile-optimized rendering with touch-friendly interactions and responsive layouts.',
  
  sectionRenderers: [
    {
      sectionType: 'layman',
      componentName: 'LaymanSectionShell',
      layoutConfig: {
        spacing: 'compact',
        maxWidth: '100%',
        imagePosition: 'bottom',
        codeTheme: 'mobile-friendly',
        cardStyle: 'flat',
      },
    },
  ],
  
  responsiveBreakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
  },
  
  accessibilityProfile: 'standard',
  
  brandId: 'shared',
  brandVisibility: 'shared_visible',
  brandCompatibility: [
    {
      brandId: 'realtutorialhub',
      isCompatible: true,
      customBreakpoints: {
        mobile: '640px',
        tablet: '768px',
        desktop: '1024px',
      },
    },
    {
      brandId: 'skillup',
      isCompatible: true,
      customBreakpoints: {
        mobile: '640px',
        tablet: '768px',
        desktop: '1024px',
      },
    },
  ],
  
  isActive: true,
  usageCount: 0,
};

/**
 * High-Contrast Layman Renderer
 * For users with visual impairments or preference for high contrast
 */
export const highContrastLaymanUIArchitecture: Omit<NewUIArchitecture, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'High-Contrast Layman Renderer',
  description: 'High contrast rendering for improved visibility and reduced eye strain.',
  
  sectionRenderers: [
    {
      sectionType: 'layman',
      componentName: 'LaymanSectionShell',
      layoutConfig: {
        spacing: 'comfortable',
        maxWidth: '800px',
        imagePosition: 'inline',
        codeTheme: 'high-contrast',
        cardStyle: 'outlined',
      },
    },
  ],
  
  responsiveBreakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
  },
  
  accessibilityProfile: 'high_contrast',
  
  brandId: 'shared',
  brandVisibility: 'shared_visible',
  brandCompatibility: [
    {
      brandId: 'realtutorialhub',
      isCompatible: true,
      customTheme: {
        primaryColor: '#000000',
        accentColor: '#ffffff',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        borderColor: '#000000',
      },
    },
    {
      brandId: 'skillup',
      isCompatible: true,
      customTheme: {
        primaryColor: '#000000',
        accentColor: '#ffffff',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        borderColor: '#000000',
      },
    },
  ],
  
  isActive: true,
  usageCount: 0,
};

/**
 * Seed data array for database insertion
 */
export const laymanUIArchitectureSeeds = [
  universalLaymanUIArchitecture,
  accessibilityLaymanUIArchitecture,
  mobileLaymanUIArchitecture,
  highContrastLaymanUIArchitecture,
];
