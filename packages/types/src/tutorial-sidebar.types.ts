export type TutorialSidebarBrandId = 'realtutorialhub' | 'skillup' | 'shared';

export type TutorialNodeStatus = 'completed' | 'in-progress' | 'not-started';

export interface TutorialNavigationNode {
  id: string;
  slug: string;
  name: string;
  icon?: string;
  status: TutorialNodeStatus;
  expanded?: boolean;
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

export interface TutorialSidebarPayload {
  scope: TutorialSidebarScope;
  tree: TutorialNavigationTree;
  status: 'draft' | 'published';
  version: number;
  publishedAt?: string | null;
  updatedAt?: string | null;
}
