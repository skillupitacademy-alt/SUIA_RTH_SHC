import type { BrandTutorialTheme, TutorialNavigationTree, TutorialSidebarBrandId } from './tutorial-sidebar.types';

export type TutorialPageContentType = 'definition' | 'code';
export type TutorialContentSourceFormat = 'json' | 'markdown';
export type TutorialContentStatus = 'draft' | 'published';

export interface TutorialDefinitionPayload {
  page: {
    type: 'definition' | string;
    category?: string;
    title: string;
    intro: string;
    definition: string;
    explanation: string[];
    example?: {
      language: string;
      code: string;
    };
    characteristics?: Array<{
      icon?: string;
      title: string;
      description: string;
    }>;
    takeaway?: string;
  };
}

export interface TutorialCodePayload {
  page: {
    type: 'CODE + EXPLANATION' | string;
    title: string;
    introduction: string;
  };
  code: {
    language: string;
    prismLanguage?: string;
    source: string;
  };
  explanation?: {
    steps: Array<{
      number: number;
      code: string;
      description: string;
    }>;
  };
  output?: {
    inputExample?: Record<string, string>;
    value: string;
  };
  memoryModel?: {
    type?: string;
    description?: string;
    layout?: {
      type: string;
    };
    columns?: Array<{
      id: string;
      title: string;
      width?: string;
    }>;
    nodes?: Array<{
      id: string;
      label: string;
      column: string;
      row: number;
      variant?: string;
      monospace?: boolean;
    }>;
    connections?: Array<{
      id: string;
      from: string;
      to: string;
      type?: string;
      fromSide?: string;
      toSide?: string;
    }>;
    columnHeaders?: Record<string, string>;
    rows?: Array<Record<string, string>>;
    note?: string;
  };
  takeaway?: {
    items: string[];
  };
  tip?: {
    text: string;
  };
}

export type TutorialContentPayloadByType = {
  definition: TutorialDefinitionPayload;
  code: TutorialCodePayload;
};

export interface TutorialPageContentRecord<T extends TutorialPageContentType = TutorialPageContentType> {
  contentType: T;
  payload: TutorialContentPayloadByType[T];
  sourceFormat: TutorialContentSourceFormat;
  sourceContent: string;
  status: TutorialContentStatus;
  version: number;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

export interface TutorialFooterNavigationItem {
  name: string;
  slug: string;
  url?: string;
}

export interface TutorialPagePayload {
  brandId: Exclude<TutorialSidebarBrandId, 'shared'>;
  theme: BrandTutorialTheme;
  sidebar: TutorialNavigationTree;
  activeUrl: string;
  hierarchy: {
    domain: { id: string; name: string; slug: string };
    subject: { id: string; name: string; slug: string };
    topic: { id: string; name: string; slug: string };
    subtopic: { id: string; name: string; slug: string };
  };
  content: Partial<{
    definition: TutorialDefinitionPayload;
    code: TutorialCodePayload;
  }>;
  footer: {
    previous: TutorialFooterNavigationItem | null;
    next: TutorialFooterNavigationItem | null;
  };
}
