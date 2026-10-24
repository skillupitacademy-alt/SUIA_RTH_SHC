'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectLlmClient } from '@/lib/project-llm/api/projectLlmClient';

export interface ProjectLlmWorkflowState {
  currentStep: number;
  familyId: string;
  familyName: string;
  targetVersion: string;
  purpose: string;
  existingVersions: string[];
  isNewVersion: boolean;
  prototypeUploaded: boolean;
  candidateUploaded: boolean;
  validationStarted: boolean;
  validationCompleted: boolean;
  certificationCompleted: boolean;
  workflowId: string | null;
  isCreatingWorkflow: boolean;
  workflowError: string | null;
}

const defaultState: ProjectLlmWorkflowState = {
  currentStep: 1,
  familyId: 'I',
  familyName: 'Introduction',
  targetVersion: 'I7',
  purpose:
    'Create an enhanced Introduction block that provides a compelling topic introduction with real-world context, clear motivation, and learning roadmap, distinct from existing I1-I6 versions.',
  existingVersions: ['I1', 'I2', 'I3', 'I4', 'I5', 'I6'],
  isNewVersion: true,
  prototypeUploaded: false,
  // UI defaults are presentation only; the backend must confirm each lifecycle state.
  candidateUploaded: false,
  validationStarted: false,
  validationCompleted: false,
  certificationCompleted: false,
  workflowId: null,
  isCreatingWorkflow: false,
  workflowError: null,
};

interface ProjectLlmContextType {
  state: ProjectLlmWorkflowState;
  setState: React.Dispatch<React.SetStateAction<ProjectLlmWorkflowState>>;
  setFamily: (familyId: string, familyName: string, existingVersions: string[]) => void;
  setTargetVersion: (version: string) => void;
  setPurpose: (purpose: string) => void;
  setStep: (step: number) => void;
  resetWorkflow: () => void;
  createBackendWorkflow: () => Promise<string | null>;
}

const ProjectLlmContext = createContext<ProjectLlmContextType | undefined>(undefined);

const STORAGE_KEY = 'project_llm_workflow_state_v1';

export function ProjectLlmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProjectLlmWorkflowState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Browser storage is not the workflow authority. Preserve user-selected
        // presentation fields, but never restore lifecycle success from localStorage.
        setState((prev) => ({
          ...prev,
          ...parsed,
          candidateUploaded: false,
          validationStarted: false,
          validationCompleted: false,
          certificationCompleted: false,
        }));
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Persist state changes to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [state, isLoaded]);

  const setFamily = (familyId: string, familyName: string, existingVersions: string[]) => {
    const nextVer = `${familyId}${existingVersions.length + 1}`;
    setState((prev) => ({
      ...prev,
      familyId,
      familyName,
      existingVersions,
      targetVersion: nextVer,
    }));
  };

  const setTargetVersion = (targetVersion: string) => {
    setState((prev) => ({ ...prev, targetVersion }));
  };

  const setPurpose = (purpose: string) => {
    setState((prev) => ({ ...prev, purpose }));
  };

  const setStep = (currentStep: number) => {
    setState((prev) => ({ ...prev, currentStep }));
  };

  const resetWorkflow = () => {
    setState(defaultState);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // intentionally empty
    }
  };

  const createBackendWorkflow = useCallback(async (): Promise<string | null> => {
    setState((prev) => ({ ...prev, isCreatingWorkflow: true, workflowError: null }));
    try {
      const result = await projectLlmClient.createWorkflow({
        targetFamily: state.familyName,
        targetVersion: state.targetVersion,
        purpose: state.purpose,
      });
      const workflowId = result.workflowId;
      setState((prev) => ({
        ...prev,
        workflowId,
        isCreatingWorkflow: false,
      }));
      return workflowId;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create workflow';
      setState((prev) => ({
        ...prev,
        isCreatingWorkflow: false,
        workflowError: errorMsg,
      }));
      return null;
    }
  }, [state.familyName, state.targetVersion, state.purpose]);

  return (
    <ProjectLlmContext.Provider
      value={{
        state,
        setState,
        setFamily,
        setTargetVersion,
        setPurpose,
        setStep,
        resetWorkflow,
        createBackendWorkflow,
      }}
    >
      {children}
    </ProjectLlmContext.Provider>
  );
}

export function useProjectLlm() {
  const ctx = useContext(ProjectLlmContext);
  if (!ctx) {
    throw new Error('useProjectLlm must be used within a ProjectLlmProvider');
  }
  return ctx;
}
