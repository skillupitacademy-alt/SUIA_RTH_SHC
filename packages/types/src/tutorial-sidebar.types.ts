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
  activeBackground: string;
  completed: string;
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
