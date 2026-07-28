/**
 * Global Architecture Type Definitions
 * Provides strict typing for Educational and UI/UX Architecture schemas
 */

// ============================================================================
// EDUCATIONAL ARCHITECTURE TYPES
// ============================================================================

export type ArchitectureStatus = 'draft' | 'ready' | 'finalized' | 'archived';

export type ComponentPriority = 1 | 2 | 3 | 4 | 5;

export interface EducationalComponentConfig {
  // Component Selection & Status
  enabled: boolean;
  required: boolean;
  priority: ComponentPriority;
  order: number;

  // Educational Properties
  purpose: string;
  learning_objective: string;
  content_requirements: string[];

  // Dependencies
  prerequisites: string[];
  enables: string[];

  // Renderer Configuration
  renderer: string;
  visible_components: string[];
  visual_guide_subsection: string;
  asset_id: string | null;
  asset_field_path: string | null;
}

export interface EducationalArchitectureMetadata {
  section_type: string;
  admin_section_id: string;
  prompt_section_id: string;
  architecture_key: string;
  label: string;
  version: string;
  status: 'active' | 'inactive' | 'archived';
  coverage_source: string;
  brand_scope: readonly string[];
  supported_domains: readonly string[];

  // Finalization Status
  finalized_status: ArchitectureStatus;
  finalized_at: string | null;
  finalized_by: string | null;
}

export interface EducationalArchitecture {
  metadata: EducationalArchitectureMetadata;
  hierarchy: {
    parent: string;
    root_keys: string[];
    db_section_type: string;
    learner_tab: string;
    order_index: number;
  };
  universal_architecture_fixed: Record<string, EducationalComponentConfig>;
  section_sequence: Array<{
    order: number;
    id: string;
    label: string;
    purpose: string;
    required: boolean;
  }>;
  renderer_mapping_engine: Record<string, unknown>;
  learning_progression_engine: {
    sequence_enforced: boolean;
    flow: string[];
    completion_signal: string;
  };
  prompt_management_system: Record<string, unknown>;
  validation_governance_system: Record<string, unknown>;
  content_pipeline: Record<string, boolean>;
}

// ============================================================================
// UI/UX ARCHITECTURE TYPES
// ============================================================================

export type LayoutType = 
  | 'card' 
  | 'inline' 
  | 'pill' 
  | 'progress' 
  | 'hero' 
  | 'grid' 
  | 'accordion' 
  | 'definition_card' 
  | 'code_panel' 
  | 'summary_card' 
  | 'checklist'
  | 'structured_content_block'
  | 'visual_asset_panel';

export type DensityType = 'compact' | 'comfortable' | 'spacious';

export type ColorRoleType = 'primary' | 'secondary' | 'accent' | 'neutral';

export type SpacingType = 'tight' | 'normal' | 'loose';

export type RadiusType = 'none' | 'small' | 'rounded' | 'pill' | 'full';

export type ShadowType = 'none' | 'soft' | 'medium' | 'strong';

export interface UISubcomponent {
  id: string;
  label: string;
  role?: string;
  layout: LayoutType;
  visible: boolean;
  spacing?: SpacingType;
  radius?: RadiusType;
  shadow?: ShadowType;
  color?: string;
  emphasis?: 'low' | 'medium' | 'high';
  color_override?: boolean;
}

export interface UIUXComponentConfig {
  // Layout Configuration
  layout: LayoutType;
  desktop_layout: string;
  tablet_layout: string;
  mobile_layout: string;

  // Visual Styling
  style_variant: string;
  density: DensityType;
  typography_scale: string;
  color_role: ColorRoleType;
  animation_type: string;

  // Brand & Colors
  brand_variant?: string;
  primary_color?: string;
  primary_color_dark?: string;
  accent_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  border_color?: string;
  color_combination?: string;

  // Interactive Elements
  interactive_elements: string[];

  // Child Components
  ui_subcomponents?: UISubcomponent[];

  // Accessibility
  accessibility: {
    semantic_region: boolean;
    keyboard_navigation: boolean;
    alt_text_required: boolean;
    contrast_ratio_validated?: boolean;
    screen_reader_support?: boolean;
  };

  // Preview & Rendering
  preview_content?: unknown;
  custom_renderer_code?: string;

  // Metadata
  order: number;
  component: string;
  label: string;

  // Database tracking
  db_loaded?: boolean;
  db_loaded_at?: string;
}

export interface UIUXArchitectureMetadata {
  section_type: string;
  admin_section_id: string;
  uiux_key: string;
  label: string;
  version: string;
  status: 'active' | 'inactive' | 'archived';
  coverage_source: string;
  supported_brands: readonly string[];
  supported_platforms: readonly string[];
}

export interface UIUXArchitecture {
  metadata: UIUXArchitectureMetadata;
  page_shell_architecture: {
    tab_id: string;
    layout_modes: {
      desktop: Record<string, unknown>;
      tablet: Record<string, unknown>;
      mobile: Record<string, unknown>;
    };
  };
  component_design_system: Record<string, UIUXComponentConfig>;
  design_system: {
    typography_system: Record<string, unknown>;
    component_library: Record<string, string>;
    theme_management: Record<string, boolean>;
  };
  renderer_mapping_engine: Record<string, unknown>;
  interaction_design_system: Record<string, boolean>;
  accessibility_architecture: {
    wcag_compliance: {
      level: 'A' | 'AA' | 'AAA';
      semantic_headings: boolean;
      screen_reader_support: boolean;
      contrast_ratios: boolean;
      reduced_motion_support: boolean;
    };
  };
  content_workflow_ui: Record<string, boolean>;
}

// ============================================================================
// GLOBAL ARCHITECTURE REGISTRY TYPES
// ============================================================================

export interface GlobalArchitectureRegistry {
  [architectureKey: string]: EducationalArchitecture | UIUXArchitecture;
}

// ============================================================================
// HELPER TYPES & TYPE GUARDS
// ============================================================================

export function isEducationalArchitecture(
  arch: EducationalArchitecture | UIUXArchitecture
): arch is EducationalArchitecture {
  return 'universal_architecture_fixed' in arch;
}

export function isUIUXArchitecture(
  arch: EducationalArchitecture | UIUXArchitecture
): arch is UIUXArchitecture {
  return 'component_design_system' in arch;
}

export function isFinalized(status: ArchitectureStatus): boolean {
  return status === 'finalized';
}

// ============================================================================
// COMPONENT FILTERING & GATING
// ============================================================================

export interface FinalizationStatus {
  isFinalized: boolean;
  status: ArchitectureStatus;
  finalizedAt: string | null;
}

export interface EnabledComponentsResult {
  enabledComponents: string[];
  totalComponents: number;
  enabledCount: number;
  disabledCount: number;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface DummyContextState {
  domain: string;
  subject: string;
  topic: string;
  subtopic: string;
  subtopicId: string;
}

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export type ThemeType = 'light' | 'dark';

export type TabType = 
  | 'Universal Architecture'
  | 'Section Sequence'
  | 'Component Details'
  | 'Learning Progression'
  | 'Prompt Management'
  | 'Renderer Mapping'
  | 'Validation Rules'
  | 'JSON Schema'
  | 'Component Selection'      // NEW
  | 'Educational Properties'   // NEW
  | 'Visual Styling'           // NEW
  | 'Responsive Design'        // NEW
  | 'Accessibility';           // NEW

export interface ComponentListItem {
  id: string;
  label: string;
  enabled: boolean;
  priority: ComponentPriority;
  required: boolean;
  purpose: string;
  partCount: number;
  order: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  timestamp: string;
}

// ============================================================================
// MIGRATION & VERSIONING
// ============================================================================

export interface MigrationResult {
  success: boolean;
  migratedKeys: string[];
  errors: string[];
  backupCreated: boolean;
  backupPath?: string;
}

export const ARCHITECTURE_STORAGE_VERSION = 'v2';
export const LEGACY_STORAGE_VERSION = 'v1';
