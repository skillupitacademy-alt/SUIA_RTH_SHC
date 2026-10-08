import { useState, useCallback } from 'react';
import type { TutorialSidebarBrandId } from '@quiz/types';
import { saveTutorialSection } from '../services/tutorialSaveService';
import { buildPublishedTutorialUrl } from '../utils/buildPublishedTutorialUrl';
import type { BlockInstance } from '../document/documentTransformation';

interface SaveDependencies {
  subtopicId: string;
  navigationNodeId: string;
  brandId: string;
  documentBlocks: BlockInstance[];
  loadedSectionId: string | null;
  isLoadingDocument: boolean;
  hasUnsavedLocalChangesRef: React.MutableRefObject<boolean>;
  setLoadedSectionId: (id: string | null) => void;
  setMessage: (message: string) => void;
}

interface HierarchySlugData {
  domains: Array<{ id: string; slug: string }>;
  subjects: Array<{ id: string; slug: string }>;
  topics: Array<{ id: string; slug: string }>;
  subtopics: Array<{ id: string; slug: string }>;
  navigationNodes: Array<{ id: string; name: string; slug: string }>;
  domainId: string;
  subjectId: string;
  topicId: string;
  subtopicId: string;
  navigationNodeId: string;
}

export function useTutorialSave(deps: SaveDependencies) {
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Save tutorial section and optionally publish.
   * Preserves identity contracts: navigationNodeId as final URL segment.
   */
  const save = useCallback(
    async (status: 'draft' | 'published', hierarchyData: HierarchySlugData) => {
      setIsSaving(true);
      deps.setMessage('');

      try {
        // Phase 1: Use save service with navigationNodeId
        const result = await saveTutorialSection(
          {
            subtopicId: deps.subtopicId,
            navigationNodeId: deps.navigationNodeId,
            brandId: deps.brandId as TutorialSidebarBrandId,
            documentBlocks: deps.documentBlocks,
            loadedSectionId: deps.loadedSectionId,
            isLoadingDocument: deps.isLoadingDocument,
          },
          status
        );

        if (!result.success) {
          deps.setMessage(result.message);
          return;
        }

        // Update loadedSectionId if we just created a new section
        if (result.sectionId && !deps.loadedSectionId) {
          deps.setLoadedSectionId(result.sectionId);
        }

        // Clear dirty flag after successful save
        deps.hasUnsavedLocalChangesRef.current = false;

        // Handle publish flow if status is 'published'
        if (status === 'published' && result.sectionId) {
          const publishUrl = `/api/tutorial-composer/sections/${result.sectionId}/publish`;

          const publishResponse = await fetch(publishUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!publishResponse.ok) {
            const publishError = await publishResponse.json();
            deps.setMessage(
              `Saved but publish failed: ${publishError.error?.message || 'Unknown error'}`
            );
            return;
          }

          // Generate public URL from hierarchy slugs
          const domain = hierarchyData.domains.find((d) => d.id === hierarchyData.domainId);
          const subject = hierarchyData.subjects.find((s) => s.id === hierarchyData.subjectId);
          const topic = hierarchyData.topics.find((t) => t.id === hierarchyData.topicId);
          const subtopic = hierarchyData.subtopics.find(
            (st) => st.id === hierarchyData.subtopicId
          );

          // Resolve exact navigation node
          const navigationNode = hierarchyData.navigationNodes.find(
            (node) => node.id === hierarchyData.navigationNodeId
          );

          if (domain && subject && topic && subtopic && navigationNode) {
            const publicUrl = buildPublishedTutorialUrl(
              domain.slug,
              subject.slug,
              topic.slug,
              subtopic.slug,
              navigationNode.id
            );

            console.info('[Tutorial Composer] Published learner URL', {
              sectionId: result.sectionId,
              domainSlug: domain.slug,
              subjectSlug: subject.slug,
              topicSlug: topic.slug,
              subtopicSlug: subtopic.slug,
              navigationNodeId: navigationNode.id,
              navigationNodeName: navigationNode.name,
              navigationNodeSlug: navigationNode.slug,
              publicUrl,
            });

            deps.setMessage(`${result.message}\n\nPublished URL: ${publicUrl}`);
          } else {
            console.error(
              '[Tutorial Composer] Published successfully but learner URL could not be constructed',
              {
                sectionId: result.sectionId,
                domainId: hierarchyData.domainId,
                subjectId: hierarchyData.subjectId,
                topicId: hierarchyData.topicId,
                subtopicId: hierarchyData.subtopicId,
                navigationNodeId: hierarchyData.navigationNodeId,
                domainFound: !!domain,
                subjectFound: !!subject,
                topicFound: !!topic,
                subtopicFound: !!subtopic,
                navigationNodeFound: !!navigationNode,
              }
            );

            deps.setMessage(
              `${result.message}\n\nPublished successfully, but the learner URL could not be generated because the navigation identity is incomplete.`
            );
          }
        } else {
          deps.setMessage(result.message);
        }
      } catch (error) {
        deps.setMessage(error instanceof Error ? error.message : 'Save failed.');
      } finally {
        setIsSaving(false);
      }
    },
    [deps]
  );

  return {
    isSaving,
    save,
  };
}
