/**
 * Constants for Global Architecture Page
 */

export const ARCHITECTURE_STORAGE_KEY = 'skillhubcore.globalArchitecture.customizations.v2';
export const LEGACY_STORAGE_KEY_V1 = 'skillhubcore.globalArchitecture.customizations.v1';
export const PIPELINE_PAYLOAD_STORAGE_KEY = 'skillhubcore.globalArchitecture.pipelinePayload.v1';

export const DEFAULT_DUMMY_CONTEXT = {
  domain: 'Programming',
  subject: 'Python',
  topic: 'Basics',
  subtopic: 'What is Python?',
  subtopicId: 'whatispython',
};

export const LEARNER_PREVIEW_TARGETS = {
  rth: {
    label: 'RTH Production',
    baseUrl: 'https://user.realtutorialhub.com',
  },
  suia: {
    label: 'SUIA / SkillUp',
    baseUrl: 'https://user.skillupitacademy.com',
  },
} as const;

export const PREVIEW_TARGET_BRAND_CONTRACTS = {
  rth: {
    brand_variant: 'rth',
    primary_color: '#d03f00',
    primary_color_dark: '#b63600',
    accent_color: '#b63600',
    secondary_color: '#124fd6',
    background_color: '#ffffff',
    text_color: '#0f172a',
    border_color: '#dbeafe',
  },
  suia: {
    brand_variant: 'suia',
    primary_color: '#f54a8d',
    primary_color_dark: '#d63d7a',
    accent_color: '#d63d7a',
    secondary_color: '#133382',
    background_color: '#ffffff',
    text_color: '#0f172a',
    border_color: '#dbeafe',
  },
} as const;

export const NOTES_SUBSECTION_ALIASES: Record<string, string> = {
  hero: 'concept_card',
  Hero: 'concept_card',
  simpleWords: 'concept_card',
  simple_words: 'concept_card',
  conceptCard: 'concept_card',
  definitionBlock: 'definition_block',
  definition_block: 'definition_block',
  componentGrid: 'component_grid',
  component_grid: 'component_grid',
  syntaxBlock: 'syntax_block',
  syntax_block: 'syntax_block',
  examplePanel: 'example_panel',
  example_panel: 'example_panel',
  practiceCard: 'practice_card',
  practice_card: 'practice_card',
  warningFaq: 'warning_faq',
  warningFAQ: 'warning_faq',
  warning_faq: 'warning_faq',
  summaryCard: 'summary_card',
  summary_card: 'summary_card',
};

export const COLOR_COMBINATION_OPTIONS = [
  { id: 'primary_75_secondary_25', label: 'Primary 75% / Secondary 25%', primaryWeight: 0.75, secondaryWeight: 0.25 },
  { id: 'primary_60_secondary_40', label: 'Primary 60% / Secondary 40%', primaryWeight: 0.6, secondaryWeight: 0.4 },
  { id: 'balanced_50_50', label: 'Primary 50% / Secondary 50%', primaryWeight: 0.5, secondaryWeight: 0.5 },
  { id: 'primary_40_secondary_60', label: 'Primary 40% / Secondary 60%', primaryWeight: 0.4, secondaryWeight: 0.6 },
  { id: 'primary_25_secondary_75', label: 'Primary 25% / Secondary 75%', primaryWeight: 0.25, secondaryWeight: 0.75 },
] as const;
