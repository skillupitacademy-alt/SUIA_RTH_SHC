/**
 * Custom hook for renderer subcomponents logic
 * Handles the complex logic for UI subcomponents and their styling
 */

import React from 'react';
import { formatTitle } from './utils';

interface AlgorithmPalette {
  primary: string;
  primaryDark: string;
  secondary: string;
  mixed: string;
  reverseMixed: string;
  surface: string;
  text: string;
  border: string;
}

export function useRendererSubcomponents(
  selectedComponentData: Record<string, unknown> | null,
  algorithmPalette: AlgorithmPalette,
  selectedPipelineSubsectionKey: string | null,
  selectedComponentKey: string | null,
  adminSectionId: string
) {
  return React.useMemo(() => {
    const configured = selectedComponentData?.ui_subcomponents;
    const configuredParts = Array.isArray(configured) ? configured as Array<Record<string, unknown>> : [];

    const interactiveParts = Array.isArray(selectedComponentData?.interactive_elements)
      ? selectedComponentData.interactive_elements.map((item) => String(item))
      : [];

    // Common defaults for all components
    const commonDefaults: Array<Record<string, unknown>> = [
      { id: 'container', label: 'Outer Surface', role: 'Component background and wrapper', layout: selectedComponentData?.layout || 'card', color: algorithmPalette.surface },
      { id: 'header', label: 'Header Area', role: 'Title, badges, and intro copy', layout: 'inline', color: algorithmPalette.primary },
      { id: 'body', label: 'Body Area', role: 'Main content and supporting cards', layout: 'inline', color: algorithmPalette.border },
      { id: 'action', label: 'Action Area', role: 'CTA and interaction row', layout: 'inline', color: algorithmPalette.mixed },
      { id: 'icon_badge', label: 'JS Badge', role: 'Technology badge fill color', layout: 'pill', color: algorithmPalette.primary },
      { id: 'difficulty_badge', label: 'Difficulty Badge', role: 'Beginner badge text and border color', layout: 'pill', color: algorithmPalette.mixed },
      { id: 'brand_badge', label: 'Brand Badge', role: 'Brand pill text and border color', layout: 'pill', color: algorithmPalette.secondary },
      { id: 'title', label: 'Title Text', role: 'Main heading color', layout: 'inline', color: algorithmPalette.text },
      { id: 'description', label: 'Description Text', role: 'Intro description color', layout: 'inline', color: '#475569' },
      { id: 'stat_cards', label: 'Stat Cards', role: 'Learning blocks and last updated card border', layout: 'card', color: algorithmPalette.border },
      { id: 'stat_value', label: 'Stat Values', role: '10 and Today value color', layout: 'inline', color: algorithmPalette.primary },
      { id: 'primary_button', label: 'Primary Button', role: 'Main action button fill color', layout: 'pill', color: algorithmPalette.mixed },
      { id: 'secondary_button', label: 'Roadmap Button', role: 'Secondary action text and border color', layout: 'pill', color: algorithmPalette.primary },
      { id: 'progress_bar', label: 'Progress Bar', role: 'Preview progress indicator color', layout: 'progress', color: algorithmPalette.reverseMixed },
    ];

    // Notes section-specific presets
    const notesPartPresets: Record<string, Array<Record<string, unknown>>> = {
      concept_card: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[4], label: 'JS Badge', role: 'Technology badge fill color' },
        { ...commonDefaults[5], label: 'Difficulty Badge', role: 'Difficulty pill color' },
        { ...commonDefaults[6], label: 'Brand Badge', role: 'Brand pill color' },
        { ...commonDefaults[7] },
        { ...commonDefaults[8] },
        { ...commonDefaults[12], label: 'Quick Look Pills Container', role: 'Pills wrapper and gap styling' },
        { id: 'quick_look_pill_0', label: 'Definition Pill', role: 'First quick-look pill color', layout: 'pill', color: algorithmPalette.primary },
        { id: 'quick_look_pill_1', label: 'Mechanics Pill', role: 'Second quick-look pill color', layout: 'pill', color: algorithmPalette.primary },
        { id: 'quick_look_pill_2', label: 'Syntax Pill', role: 'Third quick-look pill color', layout: 'pill', color: algorithmPalette.primary },
        { id: 'quick_look_pill_3', label: 'Examples Pill', role: 'Fourth quick-look pill color', layout: 'pill', color: algorithmPalette.primary },
        { ...commonDefaults[2], label: 'Simple Words Preview Card', role: 'Right-side preview card surface' },
        { id: 'preview_label', label: 'Simple Words Label', role: 'Small gray label text color', layout: 'inline', color: '#94a3b8' },
        { id: 'preview_title', label: 'Preview Card Title', role: 'Begin with meaning first heading color', layout: 'inline', color: algorithmPalette.text },
        { id: 'preview_description', label: 'Preview Card Description', role: 'Short overview description text color', layout: 'inline', color: '#64748b' },
        { ...commonDefaults[13] },
      ],
      definition_block: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[4], label: 'Core Concept Badge', role: 'Core concept badge fill color' },
        { ...commonDefaults[5], label: 'Definition Badge', role: 'Definition badge border/text color' },
        { ...commonDefaults[7], label: 'Definition Title', role: 'Main definition heading color' },
        { ...commonDefaults[8], label: 'Definition Text', role: 'Definition and explanation text color' },
        { ...commonDefaults[2], label: 'Definition Cards', role: 'Definition, simple explanation, and why-it-matters card styling' },
        { ...commonDefaults[13], label: 'Definition Accent Line', role: 'Vertical accent line color' },
      ],
      component_grid: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'Grid Title', role: 'Mechanics grid title color' },
        { ...commonDefaults[8], label: 'Grid Description', role: 'Mechanics grid description color' },
        { ...commonDefaults[2], label: 'Mechanic Cards', role: 'Individual mechanics card styling' },
        { ...commonDefaults[4], label: 'Step Number Badges', role: 'Number badge fill color inside mechanic cards' },
      ],
      syntax_block: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'Syntax Title', role: 'Syntax heading color' },
        { ...commonDefaults[2], label: 'Code And Breakdown Panels', role: 'Code panel and breakdown card styling' },
        { ...commonDefaults[4], label: 'Syntax Part Labels', role: 'Syntax part label color' },
      ],
      example_panel: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'Example Title', role: 'Example section heading color' },
        { ...commonDefaults[8], label: 'Example Description', role: 'Example intro text color' },
        { ...commonDefaults[2], label: 'Example Cards', role: 'Individual example card styling' },
        { ...commonDefaults[4], label: 'Check Icons', role: 'Checklist icon color' },
      ],
      practice_card: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'Practice Title', role: 'Practice heading color' },
        { ...commonDefaults[2], label: 'Practice Items', role: 'Practice card and item styling' },
        { ...commonDefaults[4], label: 'Practice Check Icons', role: 'Practice icon fill color' },
      ],
      warning_faq: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'FAQ Title', role: 'Common mistakes heading color' },
        { ...commonDefaults[2], label: 'FAQ Items', role: 'FAQ card styling' },
        { ...commonDefaults[4], label: 'Question Text', role: 'Mistake/question heading color' },
        { ...commonDefaults[13], label: 'Fix Highlight', role: 'Fix callout color' },
      ],
      summary_card: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'Summary Title', role: 'Summary heading color' },
        { ...commonDefaults[8], label: 'Summary Description', role: 'Summary description color' },
        { ...commonDefaults[2], label: 'Summary And Takeaway Cards', role: 'Summary panel and takeaway card styling' },
        { ...commonDefaults[4], label: 'Takeaway Number Badges', role: 'Number badge fill color' },
      ],
    };

    // Educational Architecture component presets
    const educationalPartPresets: Record<string, Array<Record<string, unknown>>> = {
      hero_summary: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[4], label: 'Icon Badge', role: 'Subtopic icon badge color' },
        { ...commonDefaults[5], label: 'Difficulty Badge', role: 'Difficulty level badge' },
        { ...commonDefaults[7], label: 'Hero Title', role: 'Main subtopic heading' },
        { ...commonDefaults[8], label: 'Hero Description', role: 'Subtopic intro text' },
        { ...commonDefaults[10], label: 'Stat Cards', role: 'Learning blocks and last updated cards' },
        { ...commonDefaults[11], label: 'Stat Values', role: 'Stat number values' },
        { ...commonDefaults[12], label: 'Primary CTA', role: 'Start learning button' },
        { ...commonDefaults[13], label: 'Secondary CTA', role: 'View roadmap button' },
      ],
      learning_outcome_snapshot: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'Outcome Title', role: 'Learning outcomes heading' },
        { ...commonDefaults[2], label: 'Outcome Items', role: 'Individual outcome list items' },
        { ...commonDefaults[4], label: 'Outcome Icons', role: 'Checkmark or star icons' },
      ],
      section_roadmap: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'Roadmap Title', role: 'Section roadmap heading' },
        { ...commonDefaults[2], label: 'Module Cards', role: 'Content and task module cards' },
        { ...commonDefaults[4], label: 'Module Badges', role: 'Module type badges' },
        { ...commonDefaults[3], label: 'Module CTA Buttons', role: 'Start/Go buttons in cards' },
      ],
      progress_summary: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'Progress Title', role: 'Progress summary heading' },
        { ...commonDefaults[13], label: 'Progress Ring', role: 'Circular progress indicator' },
        { ...commonDefaults[2], label: 'Checklist Items', role: 'Completion checklist cards' },
        { ...commonDefaults[4], label: 'Check Icons', role: 'Completed item checkmarks' },
      ],
      recommended_learning_flow: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'Flow Title', role: 'Recommended flow heading' },
        { ...commonDefaults[8], label: 'Flow Description', role: 'Flow intro text' },
        { ...commonDefaults[2], label: 'Flow Step Cards', role: 'Sequential step cards' },
        { ...commonDefaults[4], label: 'Step Numbers', role: 'Step number badges' },
      ],
      readiness_context: [
        { ...commonDefaults[0] },
        { ...commonDefaults[1] },
        { ...commonDefaults[7], label: 'Context Title', role: 'Readiness context heading' },
        { ...commonDefaults[2], label: 'Prerequisite Cards', role: 'Prerequisites and success criteria' },
        { ...commonDefaults[4], label: 'Context Icons', role: 'Prerequisite check icons' },
      ],
    };

    const notesSubsectionKey = String(selectedPipelineSubsectionKey || selectedComponentKey || '');
    const componentKey = String(selectedComponentKey || '');

    // Determine which preset to use
    let defaults: Array<Record<string, unknown>>;
    if (String(adminSectionId) === 'notes' && notesPartPresets[notesSubsectionKey]) {
      defaults = notesPartPresets[notesSubsectionKey];
    } else if (educationalPartPresets[componentKey]) {
      defaults = educationalPartPresets[componentKey];
    } else {
      defaults = commonDefaults;
    }

    const defaultIds = defaults.map((part) => part.id);
    const extraParts: Array<Record<string, unknown>> = interactiveParts
      .filter((id) => !defaultIds.includes(id))
      .map((id) => ({
        id,
        label: formatTitle(id),
        role: 'Interactive child element',
        visible: true,
        layout: 'inline',
        color: algorithmPalette.primary,
        emphasis: 'medium',
      }));

    const mergedDefaults: Array<Record<string, unknown>> = [...defaults, ...extraParts].map((part) => {
      const saved = configuredParts.find((item) => String(item.id || '') === part.id);
      const savedHasManualColor = Boolean(saved?.color_override);
      const savedWithoutImplicitColor = savedHasManualColor ? saved : saved ? { ...saved, color: part.color } : {};
      const savedUserControls = savedWithoutImplicitColor && (String(adminSectionId) === 'notes' || educationalPartPresets[componentKey])
        ? Object.fromEntries(
          Object.entries(savedWithoutImplicitColor).filter(([key]) => !['label', 'role'].includes(key))
        )
        : savedWithoutImplicitColor;
      return {
        ...part,
        visible: true,
        emphasis: part.id === 'header' ? 'high' : 'medium',
        ...savedUserControls,
      };
    });

    const mergedDefaultIds = mergedDefaults.map((part) => part.id);
    const unknownConfiguredParts = String(adminSectionId) === 'notes' || educationalPartPresets[componentKey]
      ? []
      : configuredParts.filter((part) => !mergedDefaultIds.includes(String(part.id || '')));

    return [...mergedDefaults, ...unknownConfiguredParts] as Array<Record<string, unknown>>;
  }, [
    selectedComponentData,
    algorithmPalette,
    selectedPipelineSubsectionKey,
    selectedComponentKey,
    adminSectionId,
  ]);
}
