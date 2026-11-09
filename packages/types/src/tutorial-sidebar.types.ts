export type TutorialSidebarBrandId = 'realtutorialhub' | 'skillup' | 'shared';

export type TutorialNodeStatus = 'completed' | 'in-progress' | 'not-started';

export type TutorialNodeType = 'group' | 'page';

export interface TutorialNavigationNode {
  id: string;
  name: string;
  type?: TutorialNodeType;
  description?: string;  // Educational description of what this node covers
  icon?: string;
  expanded?: boolean;
  slug?: string;
  status?: TutorialNodeStatus;
  url?: string;
  children?: TutorialNavigationNode[];
}

export interface BrandTutorialTheme {
  primary: string;
  primaryDark: string;
  secondary: string;
  /** Informational and success accents consumed by shared tutorial blocks. */
  accent1?: string;
  accent2?: string;
  /** Contrast-safe step marker backgrounds for the shared StepBadge primitive. */
  stepAccent1?: string;
  stepAccent2?: string;
  stepAccent3?: string;
  activeBackground: string;
  completed: string;
}

export const BRAND_TUTORIAL_THEMES: Record<Exclude<TutorialSidebarBrandId, 'shared'>, BrandTutorialTheme> = {
  skillup: {
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
  },
  realtutorialhub: {
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
  },
};

export const BRAND_THEME_REGISTRY: Record<string, BrandTutorialTheme> = {
  realtutorialhub: BRAND_TUTORIAL_THEMES.realtutorialhub,
  rth: BRAND_TUTORIAL_THEMES.realtutorialhub,
  skillup: BRAND_TUTORIAL_THEMES.skillup,
};

/**
 * Register a custom theme for a new or future tenant
 */
export function registerTenantTheme(tenantId: string, theme: BrandTutorialTheme): void {
  BRAND_THEME_REGISTRY[tenantId] = theme;
}

/**
 * Complete runtime configuration for a recognized platform tenant
 */
export interface TenantConfig {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  logoUrl?: string;
  theme: BrandTutorialTheme;
  hostnames?: string[];
  isActive: boolean;
}

export const TENANT_REGISTRY: Record<string, TenantConfig> = {
  skillup: {
    id: 'skillup',
    name: 'SkillUp IT Academy',
    shortName: 'SUIA',
    tagline: 'Build Skills That Move Careers',
    logoUrl: '/logos/skillup.svg',
    theme: BRAND_TUTORIAL_THEMES.skillup,
    hostnames: ['user.skillupitacademy.com', 'admin.skillupitacademy.com', 'skillup.localhost'],
    isActive: true,
  },
  realtutorialhub: {
    id: 'realtutorialhub',
    name: 'RealTutorialHub',
    shortName: 'RTH',
    tagline: 'Learn Smarter, Not Harder',
    logoUrl: '/logos/realtutorialhub.svg',
    theme: BRAND_TUTORIAL_THEMES.realtutorialhub,
    hostnames: ['user.realtutorialhub.com', 'admin.realtutorialhub.com', 'realtutorialhub.localhost'],
    isActive: true,
  },
  rth: {
    id: 'rth',
    name: 'RealTutorialHub',
    shortName: 'RTH',
    tagline: 'Learn Smarter, Not Harder',
    logoUrl: '/logos/realtutorialhub.svg',
    theme: BRAND_TUTORIAL_THEMES.realtutorialhub,
    hostnames: ['user.realtutorialhub.com', 'admin.realtutorialhub.com', 'realtutorialhub.localhost'],
    isActive: true,
  },
  shared: {
    id: 'shared',
    name: 'SkillHubCore',
    shortName: 'SHC',
    tagline: 'Central Educational Platform',
    theme: BRAND_TUTORIAL_THEMES.skillup,
    isActive: true,
  },
};

/**
 * Register a complete configuration for a new or future tenant
 */
export function registerTenant(config: TenantConfig): void {
  TENANT_REGISTRY[config.id] = config;
  BRAND_THEME_REGISTRY[config.id] = config.theme;
}

/**
 * Retrieve registered tenant configuration
 */
export function getTenantConfig(tenantId: string): TenantConfig | undefined {
  return TENANT_REGISTRY[tenantId];
}

/**
 * Check whether a tenant identifier is registered and active
 */
export function isRecognizedTenant(tenantId: string): boolean {
  return !!TENANT_REGISTRY[tenantId]?.isActive;
}

/**
 * Single source of truth for tutorial theme colors across Composer and Learner runtimes.
 * Supports known brands (realtutorialhub, skillup) and extensible future tenants.
 * Unknown tenants do not silently default to another brand.
 */
export function themeForBrand(brandId: TutorialSidebarBrandId | 'rth' | string): BrandTutorialTheme {
  const tenant = getTenantConfig(brandId);
  if (tenant) {
    return tenant.theme;
  }
  if (BRAND_THEME_REGISTRY[brandId]) {
    return BRAND_THEME_REGISTRY[brandId];
  }
  if (brandId === 'realtutorialhub' || brandId === 'rth') {
    return BRAND_TUTORIAL_THEMES.realtutorialhub;
  }
  if (brandId === 'skillup') {
    return BRAND_TUTORIAL_THEMES.skillup;
  }
  throw new Error(`Unrecognized tenant for theme resolution: "${brandId}"`);
}

export interface TutorialNavigationTree {
  brand: {
    name: string;
    shortName: string;
    tagline: string;
    logoUrl?: string;
  };
  theme: BrandTutorialTheme;
  subject: {
    name: string;
    icon?: string;
  };
  progress: {
    percentage: number;
  };
  topics: TutorialNavigationNode[];
}

export interface TutorialSidebarScope {
  brandId: TutorialSidebarBrandId;
  domainSlug: string;
  domainName: string;
  subjectSlug: string;
  subjectName: string;
  topicSlug: string;
  topicName: string;
  activeSubtopicSlug?: string;
}

// Normalized navigation node (system-generated slug/url, no presentation data)
export interface TutorialNormalizedNavigationNode {
  id: string;
  name: string;
  type: TutorialNodeType;
  description?: string;  // Educational description
  icon?: string;
  expanded?: boolean;
  slug: string;  // System-generated
  url?: string;  // System-generated (page nodes only)
  children?: TutorialNormalizedNavigationNode[];
}

// Normalized navigation tree (stored in database - NO brand/theme/progress/status)
export interface TutorialNormalizedNavigationTree {
  topics: TutorialNormalizedNavigationNode[];
}

export interface TutorialSidebarPayload {
  scope: TutorialSidebarScope;
  tree: TutorialNavigationTree;
  status: 'draft' | 'published';
  version: number;
  publishedAt?: string | null;
  updatedAt?: string | null;
}
