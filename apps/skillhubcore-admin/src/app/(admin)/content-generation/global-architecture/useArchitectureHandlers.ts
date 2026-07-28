/**
 * Custom hook for Global Architecture handlers
 */

import { useState, useCallback } from 'react';
import type { ArchitectureStatus, ComponentPriority } from './types';
import { DEFAULT_DUMMY_CONTEXT } from './constants';

interface DummyContextState {
  domain: string;
  subject: string;
  topic: string;
  subtopic: string;
  subtopicId: string;
}

export function useArchitectureHandlers(
  architectures: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  setArchitectures: React.Dispatch<React.SetStateAction<Record<string, any>>>, // eslint-disable-line @typescript-eslint/no-explicit-any
  setActionMessage: (msg: string) => void,
  setActiveTab: (tab: string) => void,
  setSelectedComponentKey: (key: string) => void
) {
  const [dummyContext, setDummyContext] = useState<DummyContextState>(DEFAULT_DUMMY_CONTEXT);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewComponentId, setPreviewComponentId] = useState<string | null>(null);

  const showActionMessage = useCallback((message: string) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(''), 2500);
  }, [setActionMessage]);

  const handleToggleEnabled = useCallback((componentId: string, enabled: boolean) => {
    setArchitectures((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        const arch = updated[key];
        const components = arch.universal_architecture_fixed;
        if (components && components[componentId]) {
          updated[key] = {
            ...arch,
            universal_architecture_fixed: {
              ...components,
              [componentId]: {
                ...components[componentId],
                enabled,
              },
            },
          };
        }
      });
      return updated;
    });
    showActionMessage(`Component ${enabled ? 'enabled' : 'disabled'}.`);
  }, [setArchitectures, showActionMessage]);

  const handleUpdatePriority = useCallback((componentId: string, priority: ComponentPriority) => {
    setArchitectures((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        const arch = updated[key];
        const components = arch.universal_architecture_fixed;
        if (components && components[componentId]) {
          updated[key] = {
            ...arch,
            universal_architecture_fixed: {
              ...components,
              [componentId]: {
                ...components[componentId],
                priority,
              },
            },
          };
        }
      });
      return updated;
    });
    showActionMessage(`Priority updated to ${priority} stars.`);
  }, [setArchitectures, showActionMessage]);

  const handleUpdateEducationalConfig = useCallback((componentId: string, config: Partial<Record<string, unknown>>) => {
    setArchitectures((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        const arch = updated[key];
        const components = arch.universal_architecture_fixed;
        if (components && components[componentId]) {
          updated[key] = {
            ...arch,
            universal_architecture_fixed: {
              ...components,
              [componentId]: {
                ...components[componentId],
                ...config,
              },
            },
          };
        }
      });
      return updated;
    });
    showActionMessage('Educational configuration updated.');
  }, [setArchitectures, showActionMessage]);

  const handleUpdateFinalizationStatus = useCallback((status: ArchitectureStatus) => {
    setArchitectures((prev) => Object.fromEntries(
      Object.entries(prev).map(([key, arch]) => {
        if (arch.universal_architecture_fixed) {
          return [
            key,
            {
              ...arch,
              metadata: {
                ...arch.metadata,
                finalized_status: status,
                finalized_at: status === 'finalized' ? new Date().toISOString() : arch.metadata?.finalized_at,
                finalized_by: status === 'finalized' ? 'admin_user' : arch.metadata?.finalized_by,
              },
            },
          ];
        }
        return [key, arch];
      })
    ));
    showActionMessage(`Educational Architecture ${status}.`);
  }, [setArchitectures, showActionMessage]);

  const handleUpdateVisualStyling = useCallback((componentId: string, config: Partial<Record<string, unknown>>) => {
    setArchitectures((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        const arch = updated[key];
        const components = arch.component_design_system;
        if (components && components[componentId]) {
          updated[key] = {
            ...arch,
            component_design_system: {
              ...components,
              [componentId]: {
                ...components[componentId],
                ...config,
              },
            },
          };
        }
      });
      return updated;
    });
    showActionMessage('Visual styling updated.');
  }, [setArchitectures, showActionMessage]);

  const handlePreviewComponent = useCallback((componentId: string) => {
    setPreviewComponentId(componentId);
    setShowPreviewModal(true);
    setActionMessage(`Opening preview for ${componentId}...`);
  }, [setActionMessage]);

  const handleEditComponent = useCallback((componentId: string) => {
    setSelectedComponentKey(componentId);
    setActiveTab('Educational Properties');
    setActionMessage(`Editing ${componentId} properties`);
  }, [setActiveTab, setSelectedComponentKey, setActionMessage]);

  const handleGenerateDummyData = useCallback(() => {
    const subjects = ['Python', 'JavaScript', 'Java', 'C++', 'React'];
    const currentIndex = subjects.indexOf(dummyContext.subject);
    const nextIndex = (currentIndex + 1) % subjects.length;
    const nextSubject = subjects[nextIndex];
    
    setDummyContext({
      domain: 'Programming',
      subject: nextSubject,
      topic: 'Basics',
      subtopic: `What is ${nextSubject}?`,
      subtopicId: `whatis${nextSubject.toLowerCase()}`,
    });
    setActionMessage(`Preview context changed to: ${nextSubject} → Basics → What is ${nextSubject}?`);
  }, [dummyContext.subject, setActionMessage]);

  const handleNavigateToEducational = useCallback(() => {
    setActiveTab('Component Selection');
    showActionMessage('Navigated to Educational Architecture');
  }, [setActiveTab, showActionMessage]);

  const handleClosePreview = useCallback(() => {
    setShowPreviewModal(false);
  }, []);

  return {
    dummyContext,
    setDummyContext,
    showPreviewModal,
    previewComponentId,
    handleToggleEnabled,
    handleUpdatePriority,
    handleUpdateEducationalConfig,
    handleUpdateFinalizationStatus,
    handleUpdateVisualStyling,
    handlePreviewComponent,
    handleEditComponent,
    handleGenerateDummyData,
    handleNavigateToEducational,
    handleClosePreview,
    showActionMessage,
  };
}
