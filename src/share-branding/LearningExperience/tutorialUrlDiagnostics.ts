/**
 * PHASE 11.11E - Tutorial URL Diagnostics
 * 
 * Pure utility functions for comparing sidebar URLs vs Next.js route URLs
 * READ-ONLY diagnostic helpers - do not modify routing behavior
 */

export interface TutorialUrlParts {
  domainSlug: string;
  subjectSlug: string;
  topicSlug: string;
  subtopicSlug: string;
  navigationNodeId?: string;
}

export interface TutorialUrlComparison {
  sidebarUrl: string | null;
  routeUrl: string;
  matches: boolean;
  hasNavigationNodeInSidebarUrl: boolean;
  hasNavigationNodeInRouteUrl: boolean;
}

export function buildTutorialBaseUrl(
  parts: Omit<TutorialUrlParts, 'navigationNodeId'>
): string {
  return [
    '/tutorial-v2',
    parts.domainSlug,
    parts.subjectSlug,
    parts.topicSlug,
    parts.subtopicSlug,
  ].join('/');
}

export function buildTutorialRouteUrl(
  parts: TutorialUrlParts
): string {
  const baseUrl = buildTutorialBaseUrl(parts);

  if (!parts.navigationNodeId) {
    return baseUrl;
  }

  return `${baseUrl}/${parts.navigationNodeId}`;
}

export function compareTutorialUrls(
  parts: TutorialUrlParts,
  sidebarUrl: string | null | undefined
): TutorialUrlComparison {
  const routeUrl = buildTutorialRouteUrl(parts);

  const normalizedSidebarUrl =
    sidebarUrl?.replace(/\/+$/, '') || null;

  const normalizedRouteUrl =
    routeUrl.replace(/\/+$/, '');

  return {
    sidebarUrl: normalizedSidebarUrl,

    routeUrl: normalizedRouteUrl,

    matches:
      normalizedSidebarUrl === normalizedRouteUrl,

    hasNavigationNodeInSidebarUrl:
      !!parts.navigationNodeId &&
      normalizedSidebarUrl?.endsWith(
        `/${parts.navigationNodeId}`
      ) === true,

    hasNavigationNodeInRouteUrl:
      !!parts.navigationNodeId &&
      normalizedRouteUrl.endsWith(
        `/${parts.navigationNodeId}`
      ),
  };
}
