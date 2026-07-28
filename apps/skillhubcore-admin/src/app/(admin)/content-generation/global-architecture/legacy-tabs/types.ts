/**
 * Shared types and interfaces for legacy tab components
 */

export interface ComponentArchitecture {
  purpose?: string;
  required?: boolean;
  renderer?: string;
  component?: string;
  style_variant?: string;
  animation_type?: string;
  interactive_elements?: string[];
  enabled?: boolean;
  order?: number;
  learning_objective?: string;
  content_requirements?: string[];
  prerequisites?: string[];
  enables?: string[];
  priority?: number;
  ui_subcomponents?: Array<Record<string, unknown>>;
  layout?: string;
  color_combination?: string;
  primary_color?: string;
  secondary_color?: string;
  primary_color_dark?: string;
  background_color?: string;
  text_color?: string;
  border_color?: string;
  visible_components?: unknown[];
  [key: string]: unknown;
}

export interface WorkflowUrls {
  visualGuide: string;
  promptGenerator: string;
  contentManager: string;
}

export interface LegacyTabCommonProps {
  // Section and component data
  activeSectionKey: string;
  activeData: any;
  activeComponentMap: Record<string, ComponentArchitecture>;
  activeLearningFlow: string[];
  isUiUxMode: boolean;
  
  // Selected component state
  selectedComponentKey: string | null;
  setSelectedComponentKey: (key: string | null) => void;
  selectedComponentData: ComponentArchitecture | null;
  selectedComponentIndex: number;
  
  // Preview and context
  selectedPreviewJson: unknown;
  selectedBrandPreviewContract: any;
  learnerPreviewTarget: string;
  selectedPipelineSubsectionKey: string | null;
  
  // Architecture state
  adminSectionId: string;
  canonicalSectionId: string;
  architectures: Record<string, any>;
  
  // Handlers
  showActionMessage: (message: string) => void;
  updateArchitectureStatus: (status: string) => void;
  startJsonEdit: () => void;
  copyArchitectureJson: () => void;
  downloadArchitectureJson: () => void;
  openWorkflowUrl: (url: string) => void;
  
  // UI state
  showAdvancedSequence?: boolean;
  setShowAdvancedSequence?: (value: boolean | ((prev: boolean) => boolean)) => void;
  showAdvancedComponentDetails?: boolean;
  setShowAdvancedComponentDetails?: (value: boolean | ((prev: boolean) => boolean)) => void;
  showAdvancedRendererMapping?: boolean;
  setShowAdvancedRendererMapping?: (value: boolean | ((prev: boolean) => boolean)) => void;
  
  // Selected workflow URLs
  selectedWorkflowUrls: WorkflowUrls;
  
  // Context sidebar
  showContextSidebar: boolean;
  
  // Universal components
  universalComponents: Array<[string, ComponentArchitecture]>;
  
  // Preview contract
  universalArchitecturePreviewContract: any;
}
