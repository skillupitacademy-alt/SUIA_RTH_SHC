import {
  TUTORIAL_SECTION_CONTRACTS,
  type TutorialSectionContract,
} from '@quiz/types';
import allSectionsData from '../../../../data/AllSectionTutorialPage.json';
import { ASSET_SPECS } from '../../tools/prompt-generator/lib/asset-specs';
import { SECTIONS_SPECS } from '../../tools/visual-guide/components/sections-specs';

type JsonRecord = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const SUPPORTED_DOMAINS = [
  'programming',
  'cloud',
  'cybersecurity',
  'finance',
  'ai_ml',
  'business',
  'general_education',
] as const;

const SUPPORTED_BRANDS = ['shared', 'skillup', 'rth', 'skillhubcore'] as const;

function deepMergeDefaults<T extends JsonRecord>(defaults: T, override: JsonRecord | undefined): T {
  if (!override) return defaults;

  const output: JsonRecord = { ...defaults };

  for (const [key, value] of Object.entries(override)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      output[key] &&
      typeof output[key] === 'object' &&
      !Array.isArray(output[key])
    ) {
      output[key] = deepMergeDefaults(output[key], value as JsonRecord);
    } else {
      output[key] = value;
    }
  }

  return output as T;
}

function normalizeSectionId(id: string) {
  return id === 'reallife' ? 'real_life' : id;
}

function toSnakeCase(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

const RUNTIME_SUBCOMPONENT_RENDERERS: Record<string, Record<string, string>> = {
  notes: {
    concept_card: 'NotesHero',
    definition_block: 'CoreDefinition',
    component_grid: 'SystemMechanics',
    syntax_block: 'SyntaxStructure',
    example_panel: 'KeyComponents',
    practice_card: 'BestPractices',
    warning_faq: 'CommonMistakes',
    summary_card: 'VisualSummary',
  },
};

const NOTES_UIUX_COMPONENT_DEFAULTS: Record<string, JsonRecord> = {
  concept_card: {
    layout: 'hero',
    desktop_layout: 'two_column',
    tablet_layout: 'stacked_cards',
    mobile_layout: 'stacked_cards',
    style_variant: 'featured',
    density: 'comfortable',
    typography_scale: 'hero',
    color_role: 'primary',
    animation_type: 'fade_in',
    interactive_elements: ['quick_look_tags', 'start_learning_cta', 'roadmap_link'],
    ui_subcomponents: [
      { id: 'container', label: 'Hero surface', layout: 'card', visible: true, spacing: 'loose', radius: 'rounded', shadow: 'soft' },
      { id: 'header', label: 'Hero title block', layout: 'inline', visible: true, spacing: 'normal' },
      { id: 'icon_badge', label: 'JS Badge', layout: 'pill', visible: true, spacing: 'normal', radius: 'pill', shadow: 'soft' },
      { id: 'difficulty_badge', label: 'Difficulty Badge', layout: 'pill', visible: true, spacing: 'normal', radius: 'pill', shadow: 'soft' },
      { id: 'brand_badge', label: 'Brand Badge', layout: 'pill', visible: true, spacing: 'normal', radius: 'pill', shadow: 'soft' },
      { id: 'title', label: 'Title Text', layout: 'inline', visible: true },
      { id: 'description', label: 'Description Text', layout: 'inline', visible: true },
      { id: 'secondary_button', label: 'Quick Look Pills Container', layout: 'inline', visible: true, spacing: 'normal', radius: 'pill' },
      { id: 'quick_look_pill_0', label: 'Definition Pill', layout: 'pill', visible: true, spacing: 'normal', radius: 'pill' },
      { id: 'quick_look_pill_1', label: 'Mechanics Pill', layout: 'pill', visible: true, spacing: 'normal', radius: 'pill' },
      { id: 'quick_look_pill_2', label: 'Syntax Pill', layout: 'pill', visible: true, spacing: 'normal', radius: 'pill' },
      { id: 'quick_look_pill_3', label: 'Examples Pill', layout: 'pill', visible: true, spacing: 'normal', radius: 'pill' },
      { id: 'body', label: 'Simple Words Preview Card', layout: 'card', visible: true, spacing: 'normal', radius: 'rounded', shadow: 'soft' },
      { id: 'preview_label', label: 'Simple Words Label', layout: 'inline', visible: true },
      { id: 'preview_title', label: 'Preview Card Title', layout: 'inline', visible: true },
      { id: 'preview_description', label: 'Preview Card Description', layout: 'inline', visible: true },
      { id: 'progress_bar', label: 'Progress Bar', layout: 'progress', visible: true, spacing: 'normal', radius: 'rounded', shadow: 'none' },
    ],
  },
  definition_block: {
    layout: 'definition_card',
    desktop_layout: 'single_column',
    tablet_layout: 'single_column',
    mobile_layout: 'stacked_cards',
    style_variant: 'outlined',
    density: 'comfortable',
    typography_scale: 'large',
    color_role: 'primary',
    animation_type: 'fade_in',
    interactive_elements: ['definition_callout', 'simple_explanation', 'why_it_matters'],
    ui_subcomponents: [
      { id: 'container', label: 'Definition shell', layout: 'card', visible: true, spacing: 'normal', radius: 'rounded', shadow: 'soft' },
      { id: 'header', label: 'Concept badge and headline', layout: 'inline', visible: true },
      { id: 'body', label: 'Definition callout', layout: 'card', visible: true, spacing: 'normal' },
      { id: 'action', label: 'Explanation cards', layout: 'card', visible: true },
    ],
  },
  component_grid: {
    layout: 'grid',
    desktop_layout: 'dashboard_grid',
    tablet_layout: 'compact_grid',
    mobile_layout: 'stacked_cards',
    style_variant: 'standard',
    density: 'comfortable',
    typography_scale: 'standard',
    color_role: 'accent',
    animation_type: 'slide_up',
    interactive_elements: ['mechanic_cards', 'hover_focus', 'step_numbers'],
  },
  syntax_block: {
    layout: 'code_panel',
    desktop_layout: 'single_column',
    tablet_layout: 'single_column',
    mobile_layout: 'stacked_cards',
    style_variant: 'high_emphasis',
    density: 'compact',
    typography_scale: 'code',
    color_role: 'primary',
    animation_type: 'none',
    interactive_elements: ['copy_code', 'syntax_breakdown', 'highlight_parts'],
  },
  example_panel: {
    layout: 'grid',
    desktop_layout: 'two_column',
    tablet_layout: 'stacked_cards',
    mobile_layout: 'stacked_cards',
    style_variant: 'standard',
    density: 'comfortable',
    typography_scale: 'standard',
    color_role: 'primary',
    animation_type: 'slide_up',
    interactive_elements: ['example_cards', 'supporting_points'],
  },
  practice_card: {
    layout: 'checklist',
    desktop_layout: 'single_column',
    tablet_layout: 'stacked_cards',
    mobile_layout: 'stacked_cards',
    style_variant: 'outlined',
    density: 'compact',
    typography_scale: 'standard',
    color_role: 'accent',
    animation_type: 'progress',
    interactive_elements: ['checklist', 'practice_tips'],
  },
  warning_faq: {
    layout: 'accordion',
    desktop_layout: 'single_column',
    tablet_layout: 'stacked_cards',
    mobile_layout: 'accordion',
    style_variant: 'outlined',
    density: 'comfortable',
    typography_scale: 'standard',
    color_role: 'primary',
    animation_type: 'expand',
    interactive_elements: ['mistake_fix_pairs', 'expand_collapse'],
    collapsible: true,
    progressive_disclosure: true,
  },
  summary_card: {
    layout: 'summary_card',
    desktop_layout: 'wide_card',
    tablet_layout: 'stacked_cards',
    mobile_layout: 'stacked_cards',
    style_variant: 'featured',
    density: 'comfortable',
    typography_scale: 'large',
    color_role: 'accent',
    animation_type: 'fade_in',
    interactive_elements: ['takeaway_list', 'revision_summary'],
  },
};

function rendererForSubsection(section: TutorialSectionContract, subsectionId: string) {
  const runtimeRenderer = RUNTIME_SUBCOMPONENT_RENDERERS[section.dbType]?.[subsectionId];
  if (runtimeRenderer) return runtimeRenderer;

  const base = section.rendererHints[0] || `${section.label.replace(/\s+/g, '')}Content`;
  if (subsectionId.toLowerCase().includes('svg') || subsectionId.toLowerCase().includes('visual')) {
    return 'inline_svg_asset_renderer';
  }
  if (subsectionId.toLowerCase().includes('quiz') || subsectionId.toLowerCase().includes('question')) {
    return 'interactive_question_renderer';
  }
  return base;
}

/**
 * Get enabled components from Educational Architecture for use in UI/UX Architecture
 * Filters component_design_system to only include components where enabled === true
 */
function getEnabledComponents(educationalArch: JsonRecord): string[] {
  const universalArchFixed = educationalArch.universal_architecture_fixed as Record<string, JsonRecord> | undefined;
  if (!universalArchFixed) return [];
  
  return Object.entries(universalArchFixed)
    .filter(([, config]) => config.enabled === true)
    .map(([key]) => key);
}

/**
 * Filter UI/UX Architecture to only include enabled components from Educational Architecture
 * Currently unused but kept for future filtering needs
 */
// function filterUiuxByEnabledComponents(
//   uiuxArch: JsonRecord,
//   enabledComponents: string[]
// ): JsonRecord {
//   const componentDesignSystem = uiuxArch.component_design_system as Record<string, JsonRecord> | undefined;
//   if (!componentDesignSystem) return uiuxArch;
  
//   const filteredComponents = Object.fromEntries(
//     Object.entries(componentDesignSystem).filter(([key]) => enabledComponents.includes(key))
//   );
  
//   return {
//     ...uiuxArch,
//     component_design_system: filteredComponents,
//   };
// }

function buildEducationalArchitecture(section: TutorialSectionContract, existing?: JsonRecord): JsonRecord {
  const sectionSpec = SECTIONS_SPECS.find((spec) => normalizeSectionId(spec.id) === section.dbType);
  const subsections = sectionSpec?.subsections ?? [];
  const assets = ASSET_SPECS[section.dbType] ?? [];
  const architectureKey = section.architectureKeys[0];

  const universal_architecture_fixed = Object.fromEntries(
    subsections.map((subsection, index) => {
      const matchingAsset = assets.find((asset) => asset.id === subsection.svgId);
      return [
        subsection.id,
        {
          // Component Selection & Status (NEW)
          enabled: true,
          required: true,
          priority: 4, // 1-5 scale, default to 4 (high importance)
          order: index + 1,
          
          // Educational Properties (NEW)
          purpose: subsection.purpose,
          learning_objective: subsection.purpose || 'Help learners understand this concept clearly and build foundation for next topics.',
          content_requirements: subsection.components || [],
          
          // Dependencies (NEW)
          prerequisites: index === 0 ? [] : [subsections[index - 1].id], // Sequential by default
          enables: index < subsections.length - 1 ? [subsections[index + 1].id] : [],
          
          // Existing properties
          renderer: rendererForSubsection(section, subsection.id),
          visible_components: subsection.components,
          visual_guide_subsection: subsection.id,
          asset_id: matchingAsset?.id ?? subsection.svgId ?? null,
          asset_field_path: matchingAsset?.fieldPath ?? null,
        },
      ];
    })
  );

  const renderer_mapping_engine = {
    frontend_tab: section.tab,
    runtime_content_key: section.dbType,
    admin_section_id: section.adminId,
    prompt_section_id: section.promptId,
    visual_guide_url: `/tools/visual-guide?section=${section.dbType}`,
    prompt_generator_url: `/tools/prompt-generator?section=${section.dbType}`,
    content_manager_url: `/tools/content-manager?section=${section.adminId}`,
    component_mappings: Object.fromEntries(
      subsections.map((subsection) => [
        subsection.id,
        {
          component: rendererForSubsection(section, subsection.id),
          data_source: `${section.dbType}.${subsection.id}`,
          visual_guide_url: `/tools/visual-guide?section=${section.dbType}&subsection=${subsection.id}`,
          prompt_generator_url: `/tools/prompt-generator?section=${section.dbType}&subsection=${subsection.id}`,
          content_manager_url: `/tools/content-manager?section=${section.adminId}&subsection=${subsection.id}`,
        },
      ])
    ),
  };

  const defaults = {
    metadata: {
      section_type: section.dbType,
      admin_section_id: section.adminId,
      prompt_section_id: section.promptId,
      architecture_key: architectureKey,
      label: section.label,
      version: '1.0',
      status: 'active',
      coverage_source: 'canonical_contracts_visual_guide_generated',
      brand_scope: SUPPORTED_BRANDS,
      supported_domains: SUPPORTED_DOMAINS,
      
      // Educational Architecture Status (NEW)
      finalized_status: existing?.metadata?.finalized_status || 'finalized', // Default to finalized for backward compatibility
      finalized_at: existing?.metadata?.finalized_at || new Date().toISOString(),
      finalized_by: existing?.metadata?.finalized_by || 'system_migration',
    },
    hierarchy: {
      parent: 'tutorial_subtopic',
      root_keys: section.rootKeys,
      db_section_type: section.dbType,
      learner_tab: section.tab,
      order_index: section.orderIndex,
    },
    universal_architecture_fixed,
    section_sequence: subsections.map((subsection, index) => ({
      order: index + 1,
      id: subsection.id,
      label: subsection.label,
      purpose: subsection.purpose,
      required: true,
    })),
    renderer_mapping_engine,
    learning_progression_engine: {
      sequence_enforced: true,
      flow: subsections.map((subsection) => subsection.id),
      completion_signal: `${section.dbType}_section_ready`,
    },
    prompt_management_system: {
      source: 'tools/prompt-generator',
      whole_section_prompt: true,
      subsection_prompt: true,
      strict_schema_template: true,
      svg_asset_prompts: assets.length > 0,
    },
    validation_governance_system: {
      strict_runtime_validation: true,
      schema_package: '@quiz/validation',
      schema_hints: section.schemaHints,
      content_manager_validation: true,
    },
    content_pipeline: {
      global_architecture: true,
      uiux_architecture: section.architectureKeys.length > 1,
      visual_guide: true,
      prompt_generator: true,
      content_manager: true,
      preview: true,
      database_save: true,
    },
  };

  const merged = deepMergeDefaults(defaults, existing);
  merged.universal_architecture_fixed = Object.fromEntries(
    subsections.map((subsection) => {
      const legacyValue = existing?.universal_architecture_fixed?.[subsection.id] ??
        existing?.universal_architecture_fixed?.[toSnakeCase(subsection.id)];
      return [
        subsection.id,
        deepMergeDefaults(defaults.universal_architecture_fixed[subsection.id], legacyValue),
      ];
    })
  );
  merged.section_sequence = defaults.section_sequence;
  merged.renderer_mapping_engine = {
    ...(merged.renderer_mapping_engine ?? {}),
    ...defaults.renderer_mapping_engine,
  };
  merged.metadata = {
    ...(merged.metadata ?? {}),
    section_type: section.dbType,
    admin_section_id: section.adminId,
    prompt_section_id: section.promptId,
    architecture_key: architectureKey,
    label: section.label,
  };
  return merged;
}

function buildUiuxArchitecture(section: TutorialSectionContract, existing?: JsonRecord): JsonRecord {
  const sectionSpec = SECTIONS_SPECS.find((spec) => normalizeSectionId(spec.id) === section.dbType);
  const subsections = sectionSpec?.subsections ?? [];
  const assets = ASSET_SPECS[section.dbType] ?? [];
  const uiuxKey = section.architectureKeys[1] || `${section.dbType}_section_uiux_architecture`;

  const component_design_system = Object.fromEntries(
    subsections.map((subsection, index) => {
      const matchingAsset = assets.find((asset) => asset.id === subsection.svgId);
      const componentDefaults = section.dbType === 'notes' ? NOTES_UIUX_COMPONENT_DEFAULTS[subsection.id] || {} : {};
      return [
        subsection.id,
        {
          order: index + 1,
          component: rendererForSubsection(section, subsection.id),
          label: subsection.label,
          layout: matchingAsset ? 'visual_asset_panel' : 'structured_content_block',
          style_variant: sectionSpec?.color ?? 'brand_default',
          animation_type: 'subtle_reveal',
          interactive_elements: subsection.components,
          ...componentDefaults,
          accessibility: {
            semantic_region: true,
            keyboard_navigation: true,
            alt_text_required: Boolean(matchingAsset),
            ...(componentDefaults.accessibility || {}),
          },
        },
      ];
    })
  );

  const defaults = {
    metadata: {
      section_type: section.dbType,
      admin_section_id: section.adminId,
      uiux_key: uiuxKey,
      label: section.label,
      version: '1.0',
      status: 'active',
      coverage_source: 'canonical_contracts_visual_guide_generated',
      supported_brands: SUPPORTED_BRANDS,
      supported_platforms: ['web', 'tablet', 'mobile'],
    },
    page_shell_architecture: {
      tab_id: section.tab,
      layout_modes: {
        desktop: {
          header: true,
          content_grid: 'two_column_learning_workspace',
          visual_preview: assets.length > 0,
        },
        tablet: {
          header: true,
          content_grid: 'responsive_learning_grid',
        },
        mobile: {
          header: true,
          content_grid: 'stacked_learning_blocks',
        },
      },
    },
    component_design_system,
    design_system: {
      typography_system: {
        font_scales: {
          heading_1: 'section_title',
          heading_2: 'component_title',
          body: 'learning_body',
          microcopy: 'metadata_label',
        },
      },
      component_library: Object.fromEntries(
        subsections.map((subsection) => [subsection.id, rendererForSubsection(section, subsection.id)])
      ),
      theme_management: {
        brand_color_switching: true,
        shared_theme_defaults: true,
        skillup_theme: true,
        rth_theme: true,
        skillhubcore_theme: true,
      },
    },
    renderer_mapping_engine: {
      learner_component: section.rendererHints[0] || 'TutorialSectionRenderer',
      admin_preview_component: 'ComponentPreview',
      visual_guide_component: 'WireframeRenderer',
      component_mappings: Object.fromEntries(
        subsections.map((subsection) => [
          subsection.id,
          {
            component: rendererForSubsection(section, subsection.id),
            data_source: `${section.dbType}.${subsection.id}`,
            layout: component_design_system[subsection.id]?.layout,
          },
        ])
      ),
    },
    interaction_design_system: {
      responsive_touch_targets: true,
      keyboard_navigation: true,
      preview_before_save: true,
      progressive_disclosure: true,
    },
    accessibility_architecture: {
      wcag_compliance: {
        level: 'AA',
        semantic_headings: true,
        screen_reader_support: true,
        contrast_ratios: true,
        reduced_motion_support: true,
      },
    },
    content_workflow_ui: {
      visual_guide_selection: true,
      prompt_generator_selection: true,
      content_manager_preview: true,
      db_save_status: true,
    },
  };

  const merged = deepMergeDefaults(defaults, existing);
  merged.component_design_system = Object.fromEntries(
    subsections.map((subsection) => {
      const legacyValue = existing?.component_design_system?.[subsection.id] ??
        existing?.component_design_system?.[toSnakeCase(subsection.id)];
      return [
        subsection.id,
        deepMergeDefaults(defaults.component_design_system[subsection.id], legacyValue),
      ];
    })
  );
  merged.renderer_mapping_engine = {
    ...(merged.renderer_mapping_engine ?? {}),
    ...defaults.renderer_mapping_engine,
  };
  merged.metadata = {
    ...(merged.metadata ?? {}),
    section_type: section.dbType,
    admin_section_id: section.adminId,
    uiux_key: uiuxKey,
    label: section.label,
  };
  return merged;
}

export function buildGlobalArchitectureRegistry() {
  const existing = (allSectionsData as JsonRecord[]).reduce((acc: Record<string, JsonRecord>, curr) => {
    const key = Object.keys(curr)[0];
    if (key && !acc[key]) {
      acc[key] = curr[key];
    }
    return acc;
  }, {});

  return TUTORIAL_SECTION_CONTRACTS.reduce((acc: Record<string, JsonRecord>, section) => {
    const eduKey = section.architectureKeys[0];
    const uiuxKey = section.architectureKeys[1] || `${section.dbType}_section_uiux_architecture`;

    acc[eduKey] = buildEducationalArchitecture(section, existing[eduKey]);
    acc[uiuxKey] = buildUiuxArchitecture(section, existing[uiuxKey]);

    return acc;
  }, {});
}

/**
 * Get enabled components for a specific section
 * @param architectures - Full architecture registry
 * @param sectionType - Section type (e.g., 'notes', 'overview')
 * @returns Array of enabled component IDs
 */
export function getEnabledComponentsForSection(
  architectures: Record<string, JsonRecord>,
  sectionType: string
): string[] {
  const educationalKey = Object.keys(architectures).find(
    (key) => !key.includes('uiux') && architectures[key].metadata?.section_type === sectionType
  );
  
  if (!educationalKey) return [];
  return getEnabledComponents(architectures[educationalKey]);
}

/**
 * Check if Educational Architecture is finalized for a section
 * @param architectures - Full architecture registry  
 * @param sectionType - Section type (e.g., 'notes', 'overview')
 * @returns Finalization status
 */
export function isEducationalArchitectureFinalized(
  architectures: Record<string, JsonRecord>,
  sectionType: string
): { isFinalized: boolean; status: string; finalizedAt: string | null } {
  const educationalKey = Object.keys(architectures).find(
    (key) => !key.includes('uiux') && architectures[key].metadata?.section_type === sectionType
  );
  
  if (!educationalKey) {
    return { isFinalized: false, status: 'draft', finalizedAt: null };
  }
  
  const metadata = architectures[educationalKey].metadata as Record<string, unknown> | undefined;
  const status = String(metadata?.finalized_status || 'draft');
  const finalizedAt = metadata?.finalized_at ? String(metadata.finalized_at) : null;
  
  return {
    isFinalized: status === 'finalized',
    status,
    finalizedAt,
  };
}
