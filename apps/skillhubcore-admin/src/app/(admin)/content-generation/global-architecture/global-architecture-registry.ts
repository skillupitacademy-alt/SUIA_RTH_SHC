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

function rendererForSubsection(section: TutorialSectionContract, subsectionId: string) {
  const base = section.rendererHints[0] || `${section.label.replace(/\s+/g, '')}Content`;
  if (subsectionId.toLowerCase().includes('svg') || subsectionId.toLowerCase().includes('visual')) {
    return 'inline_svg_asset_renderer';
  }
  if (subsectionId.toLowerCase().includes('quiz') || subsectionId.toLowerCase().includes('question')) {
    return 'interactive_question_renderer';
  }
  return base;
}

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
          enabled: true,
          required: true,
          order: index + 1,
          purpose: subsection.purpose,
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
          accessibility: {
            semantic_region: true,
            keyboard_navigation: true,
            alt_text_required: Boolean(matchingAsset),
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
