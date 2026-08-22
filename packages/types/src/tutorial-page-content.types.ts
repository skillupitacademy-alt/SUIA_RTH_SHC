import type { BrandTutorialTheme, TutorialNavigationTree, TutorialSidebarBrandId } from './tutorial-sidebar.types';
import type { TutorialBlock } from './tutorial-rich-document/blocks';

export type TutorialPageContentType = 'definition' | 'code' | 'summary';
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

export interface TutorialSummaryPayload {
  page: {
    badge?: string;
    badgeIcon?: string;
    title: string;
    introduction: string;
  };
  summary: Array<{
    text: string;
  }>;
  revisionTable?: {
    columns: Array<{
      id: string;
      title: string;
      icon?: string;
    }>;
    rows: Array<{
      concept?: {
        name: string;
        icon?: string;
      };
      keyPoint?: {
        title: string;
        description: string;
        code?: string;
      };
      example?: {
        code: string;
      };
      remember?: {
        title: string;
        description: string;
      };
    }>;
  };
  quickTips?: Array<{
    text: string;
  }>;
  finalTip?: {
    title: string;
    text: string;
  };
}

export type TutorialContentPayloadByType = {
  definition: TutorialDefinitionPayload;
  code: TutorialCodePayload;
  summary: TutorialSummaryPayload;
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
  content: {
    // V2 Architecture: TutorialDocument.blocks[] preserved through delivery
    blocks: TutorialBlock[];
    // Legacy fields (deprecated, for backward compatibility only)
    /** @deprecated Use blocks[] instead */
    definition?: TutorialDefinitionPayload;
    /** @deprecated Use blocks[] instead */
    code?: TutorialCodePayload;
    /** @deprecated Use blocks[] instead */
    summary?: TutorialSummaryPayload;
  };
  footer: {
    previous: TutorialFooterNavigationItem | null;
    next: TutorialFooterNavigationItem | null;
  };
}
