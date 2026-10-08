/**
 * useTutorialComposerForm
 * 
 * Manages Tutorial Composer hierarchy and form state with cascade-reset behavior.
 * 
 * RESPONSIBILITY:
 * - Hierarchy selection state (domain/subject/topic/subtopic)
 * - Form state (navigation/block type/version)
 * - Hierarchy cascade resets
 * - Form update logic
 * - Derived hierarchy/form values
 * 
 * DOES NOT OWN:
 * - Document hydration (useTutorialHydration)
 * - Block authoring/CRUD
 * - Preview normalization
 * - Save/publish
 * - AI state
 * - Progress/ILS/RSSB
 */

import { useEffect, useMemo, useState } from 'react';
import type { TutorialPageContentType, TutorialSidebarBrandId } from '@quiz/types';
import { getBlockType, getBlockTypes } from '../registry';

export interface HierarchyRow {
  id: string;
  name: string;
  slug: string;
  domainId?: string;
  subjectId?: string;
  topicId?: string;
}

export interface HierarchyState {
  domains: HierarchyRow[];
  subjects: HierarchyRow[];
  topics: HierarchyRow[];
  subtopics: HierarchyRow[];
}

export interface FormState {
  brandId: TutorialSidebarBrandId;
  domainId: string;
  subjectId: string;
  topicId: string;
  subtopicId: string;
  navigationNodeId: string;
  blockType: TutorialPageContentType;
  versionId: string;
}

const initialHierarchy: HierarchyState = { domains: [], subjects: [], topics: [], subtopics: [] };

const SHARED_BRAND_ID: TutorialSidebarBrandId = 'shared';

const initialForm: FormState = {
  brandId: SHARED_BRAND_ID,
  domainId: '',
  subjectId: '',
  topicId: '',
  subtopicId: '',
  navigationNodeId: '',
  blockType: 'definition',
  versionId: 'v1',
};

export interface UseTutorialComposerFormResult {
  // Core state
  hierarchy: HierarchyState;
  form: FormState;
  
  // State setters (exposed for specific use cases like block loading)
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  setHierarchy: React.Dispatch<React.SetStateAction<HierarchyState>>;
  
  // Form update with cascade logic
  updateForm: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  
  // Derived hierarchy values
  subjects: HierarchyRow[];
  topics: HierarchyRow[];
  subtopics: HierarchyRow[];
  selectedSubtopic: HierarchyRow | undefined;
  domainName: string;
  subjectName: string;
  topicName: string;
  subtopicName: string;
  
  // Derived form/block values
  currentBlockConfig: NonNullable<ReturnType<typeof getBlockType>>;
  availableVersions: NonNullable<ReturnType<typeof getBlockType>>['versions'];
  selectedVersion: NonNullable<ReturnType<typeof getBlockType>>['versions'][0];
}

export interface UseTutorialComposerFormOptions {
  /** Callback for error messages (e.g., hierarchy loading failures) */
  onError?: (message: string) => void;
}

/**
 * Hook for managing Tutorial Composer hierarchy and form state
 */
export function useTutorialComposerForm(
  options: UseTutorialComposerFormOptions = {}
): UseTutorialComposerFormResult {
  const { onError } = options;
  
  const [hierarchy, setHierarchy] = useState<HierarchyState>(initialHierarchy);
  const [form, setForm] = useState<FormState>(initialForm);
  
  // Load hierarchy data
  useEffect(() => {
    fetch('/api/tutorial-left-sidebar/hierarchy')
      .then((response) => response.json())
      .then(setHierarchy)
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to load hierarchy.';
        if (onError) {
          onError(message);
        }
      });
  }, [onError]);
  
  // Derived hierarchy filters
  const subjects = useMemo(
    () => hierarchy.subjects.filter((item) => item.domainId === form.domainId),
    [hierarchy.subjects, form.domainId]
  );
  
  const topics = useMemo(
    () => hierarchy.topics.filter((item) => item.subjectId === form.subjectId),
    [hierarchy.topics, form.subjectId]
  );
  
  const subtopics = useMemo(
    () => hierarchy.subtopics.filter((item) => item.topicId === form.topicId),
    [hierarchy.subtopics, form.topicId]
  );
  
  const selectedSubtopic = subtopics.find((item) => item.id === form.subtopicId);
  
  // Derived hierarchy names
  const domainName = hierarchy.domains.find((d) => d.id === form.domainId)?.name || 'Not selected';
  const subjectName = subjects.find((s) => s.id === form.subjectId)?.name || 'Not selected';
  const topicName = topics.find((t) => t.id === form.topicId)?.name || 'Not selected';
  const subtopicName = selectedSubtopic?.name || 'Not selected';
  
  // Derived block/form values
  const currentBlockConfig = useMemo(() => {
    return getBlockType(form.blockType) || getBlockTypes()[0];
  }, [form.blockType]);
  
  const availableVersions = currentBlockConfig.versions;
  
  const selectedVersion = useMemo(() => {
    return availableVersions.find((v) => v.id === form.versionId) || availableVersions[0];
  }, [availableVersions, form.versionId]);
  
  /**
   * Update form with hierarchy cascade-reset logic
   * 
   * Cascade behavior:
   * - domain change → resets subject/topic/subtopic/navigation
   * - subject change → resets topic/subtopic/navigation
   * - topic change → resets subtopic/navigation
   * - subtopic change → resets navigation
   * - blockType change → resets versionId to first available version
   */
  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      
      // Hierarchy cascade resets
      if (key === 'domainId') {
        next.subjectId = '';
        next.topicId = '';
        next.subtopicId = '';
        next.navigationNodeId = '';
      }
      if (key === 'subjectId') {
        next.topicId = '';
        next.subtopicId = '';
        next.navigationNodeId = '';
      }
      if (key === 'topicId') {
        next.subtopicId = '';
        next.navigationNodeId = '';
      }
      if (key === 'subtopicId') {
        next.navigationNodeId = '';
      }
      
      // Block type cascade: reset version to first available
      if (key === 'blockType') {
        const block = getBlockType(value as TutorialPageContentType);
        next.versionId = block?.versions[0]?.id || 'v1';
      }
      
      return next;
    });
  }
  
  return {
    hierarchy,
    form,
    setForm,
    setHierarchy,
    updateForm,
    subjects,
    topics,
    subtopics,
    selectedSubtopic,
    domainName,
    subjectName,
    topicName,
    subtopicName,
    currentBlockConfig,
    availableVersions,
    selectedVersion,
  };
}
