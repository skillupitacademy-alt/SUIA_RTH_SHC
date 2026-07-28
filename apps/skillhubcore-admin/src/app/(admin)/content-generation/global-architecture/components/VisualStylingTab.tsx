"use client";

import React, { useState } from 'react';
import { 
  Palette, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Save,
  Sparkles,
  Type,
  Box,
  Layers
} from 'lucide-react';

interface ColorControl {
  key: string;
  label: string;
  defaultValue: string;
}

interface UISubcomponent {
  id: string;
  label: string;
  role?: string;
  layout: string;
  visible: boolean;
  spacing?: string;
  radius?: string;
  shadow?: string;
  color?: string;
}

interface VisualStylingTabProps {
  componentId: string | null;
  componentLabel: string;
  componentConfig: {
    primary_color?: string;
    primary_color_dark?: string;
    accent_color?: string;
    secondary_color?: string;
    background_color?: string;
    text_color?: string;
    border_color?: string;
    color_combination?: string;
    layout?: string;
    desktop_layout?: string;
    tablet_layout?: string;
    mobile_layout?: string;
    style_variant?: string;
    density?: string;
    typography_scale?: string;
    animation_type?: string;
    ui_subcomponents?: UISubcomponent[];
  } | null;
  brandColors: {
    primary_color: string;
    primary_color_dark: string;
    accent_color: string;
    secondary_color: string;
    background_color: string;
    text_color: string;
    border_color: string;
  };
  onSave: (componentId: string, config: Partial<any>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const COLOR_COMBINATION_OPTIONS = [
  { id: 'primary_75_secondary_25', label: 'Primary 75% / Secondary 25%' },
  { id: 'primary_60_secondary_40', label: 'Primary 60% / Secondary 40%' },
  { id: 'balanced_50_50', label: 'Primary 50% / Secondary 50%' },
  { id: 'primary_40_secondary_60', label: 'Primary 40% / Secondary 60%' },
  { id: 'primary_25_secondary_75', label: 'Primary 25% / Secondary 75%' },
];

export function VisualStylingTab({
  componentId,
  componentLabel,
  componentConfig,
  brandColors,
  onSave,
}: VisualStylingTabProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    colors: true,
    layout: false,
    typography: false,
    childComponents: false,
  });

  const [formState, setFormState] = useState<any>({ // eslint-disable-line @typescript-eslint/no-explicit-any
    primary_color: '',
    primary_color_dark: '',
    accent_color: '',
    secondary_color: '',
    background_color: '',
    text_color: '',
    border_color: '',
    color_combination: 'primary_75_secondary_25',
    layout: 'card',
    desktop_layout: 'two_column',
    tablet_layout: 'stacked_cards',
    mobile_layout: 'stacked_cards',
    style_variant: 'standard',
    density: 'comfortable',
    typography_scale: 'standard',
    animation_type: 'fade_in',
    ui_subcomponents: [],
  });

  const [hasChanges, setHasChanges] = useState(false);

  React.useEffect(() => {
    if (componentConfig) {
      setFormState({
        primary_color: componentConfig.primary_color || brandColors.primary_color,
        primary_color_dark: componentConfig.primary_color_dark || brandColors.primary_color_dark,
        accent_color: componentConfig.accent_color || brandColors.accent_color,
        secondary_color: componentConfig.secondary_color || brandColors.secondary_color,
        background_color: componentConfig.background_color || brandColors.background_color,
        text_color: componentConfig.text_color || brandColors.text_color,
        border_color: componentConfig.border_color || brandColors.border_color,
        color_combination: componentConfig.color_combination || 'primary_75_secondary_25',
        layout: componentConfig.layout || 'card',
        desktop_layout: componentConfig.desktop_layout || 'two_column',
        tablet_layout: componentConfig.tablet_layout || 'stacked_cards',
        mobile_layout: componentConfig.mobile_layout || 'stacked_cards',
        style_variant: componentConfig.style_variant || 'standard',
        density: componentConfig.density || 'comfortable',
        typography_scale: componentConfig.typography_scale || 'standard',
        animation_type: componentConfig.animation_type || 'fade_in',
        ui_subcomponents: componentConfig.ui_subcomponents || [],
      });
      setHasChanges(false);
    }
  }, [componentConfig, componentId, brandColors]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleFieldChange = (field: string, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setFormState((prev: any) => ({ ...prev, [field]: value })); // eslint-disable-line @typescript-eslint/no-explicit-any
    setHasChanges(true);
  };

  const handleSubcomponentChange = (index: number, field: string, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const updated = [...formState.ui_subcomponents];
    updated[index] = { ...updated[index], [field]: value };
    setFormState((prev: any) => ({ ...prev, ui_subcomponents: updated })); // eslint-disable-line @typescript-eslint/no-explicit-any
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!componentId) return;
    onSave(componentId, formState);
    setHasChanges(false);
  };

  const resetToDefaults = () => {
    setFormState({
      ...formState,
      primary_color: brandColors.primary_color,
      primary_color_dark: brandColors.primary_color_dark,
      accent_color: brandColors.accent_color,
      secondary_color: brandColors.secondary_color,
      background_color: brandColors.background_color,
      text_color: brandColors.text_color,
      border_color: brandColors.border_color,
    });
    setHasChanges(true);
  };

  if (!componentId || !componentConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Palette size={64} className="text-slate-300 mb-4" />
        <h3 className="text-lg font-black text-slate-400 mb-2">No Component Selected</h3>
        <p className="text-sm font-semibold text-slate-500">
          Select a component to customize its visual styling.
        </p>
      </div>
    );
  }

  const colorControls: ColorControl[] = [
    { key: 'primary_color', label: 'Primary Color', defaultValue: brandColors.primary_color },
    { key: 'primary_color_dark', label: 'Primary Dark', defaultValue: brandColors.primary_color_dark },
    { key: 'accent_color', label: 'Accent / CTA', defaultValue: brandColors.accent_color },
    { key: 'secondary_color', label: 'Secondary', defaultValue: brandColors.secondary_color },
    { key: 'background_color', label: 'Background', defaultValue: brandColors.background_color },
    { key: 'text_color', label: 'Text Color', defaultValue: brandColors.text_color },
    { key: 'border_color', label: 'Border Color', defaultValue: brandColors.border_color },
  ];

  const CollapsibleSection = ({ 
    title, 
    icon: Icon, 
    section, 
    children 
  }: { 
    title: string; 
    icon: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    section: string; 
    children: React.ReactNode 
  }) => (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className="text-indigo-600" />
          <h3 className="text-sm font-black uppercase text-slate-900">{title}</h3>
        </div>
        {expandedSections[section] ? (
          <ChevronUp size={20} className="text-slate-400" />
        ) : (
          <ChevronDown size={20} className="text-slate-400" />
        )}
      </button>
      {expandedSections[section] && (
        <div className="p-5 pt-0 border-t border-slate-200">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Palette size={24} className="text-indigo-600" />
            Visual Styling
          </h2>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Customize colors, layouts, and styling for <strong>{componentLabel}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetToDefaults}
            className="bg-slate-100 border border-slate-200 text-slate-700 rounded-xl px-4 py-2 text-sm font-black hover:bg-slate-200 transition-colors"
          >
            Reset Colors
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            className="bg-emerald-600 text-white rounded-xl px-5 py-2 text-sm font-black hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Save Styling
          </button>
        </div>
      </div>

      {/* Brand & Color Palette */}
      <CollapsibleSection title="Brand & Color Palette" icon={Palette} section="colors">
        <div className="space-y-4">
          {/* Color Combination */}
          <div>
            <label htmlFor="color_combination" className="block text-sm font-bold text-slate-700 mb-2">
              Color Mix Ratio
            </label>
            <select
              id="color_combination"
              value={formState.color_combination}
              onChange={(e) => handleFieldChange('color_combination', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
            >
              {COLOR_COMBINATION_OPTIONS.map(option => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Color Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {colorControls.map(control => (
              <div key={control.key}>
                <label htmlFor={control.key} className="block text-xs font-bold text-slate-700 mb-2">
                  {control.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id={control.key}
                    value={formState[control.key]}
                    onChange={(e) => handleFieldChange(control.key, e.target.value)}
                    className="w-12 h-12 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formState[control.key]}
                    onChange={(e) => handleFieldChange(control.key, e.target.value)}
                    placeholder="#000000"
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Layout Configuration */}
      <CollapsibleSection title="Layout & Responsive Design" icon={Box} section="layout">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="layout" className="block text-sm font-bold text-slate-700 mb-2">
              Base Layout
            </label>
            <select
              id="layout"
              value={formState.layout}
              onChange={(e) => handleFieldChange('layout', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
            >
              <option value="card">Card</option>
              <option value="inline">Inline</option>
              <option value="grid">Grid</option>
              <option value="hero">Hero</option>
              <option value="accordion">Accordion</option>
            </select>
          </div>

          <div>
            <label htmlFor="desktop_layout" className="block text-sm font-bold text-slate-700 mb-2">
              Desktop Layout
            </label>
            <select
              id="desktop_layout"
              value={formState.desktop_layout}
              onChange={(e) => handleFieldChange('desktop_layout', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
            >
              <option value="two_column">Two Column</option>
              <option value="single_column">Single Column</option>
              <option value="dashboard_grid">Dashboard Grid</option>
              <option value="wide_card">Wide Card</option>
            </select>
          </div>

          <div>
            <label htmlFor="tablet_layout" className="block text-sm font-bold text-slate-700 mb-2">
              Tablet Layout
            </label>
            <select
              id="tablet_layout"
              value={formState.tablet_layout}
              onChange={(e) => handleFieldChange('tablet_layout', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
            >
              <option value="stacked_cards">Stacked Cards</option>
              <option value="responsive_grid">Responsive Grid</option>
              <option value="compact_grid">Compact Grid</option>
            </select>
          </div>

          <div>
            <label htmlFor="mobile_layout" className="block text-sm font-bold text-slate-700 mb-2">
              Mobile Layout
            </label>
            <select
              id="mobile_layout"
              value={formState.mobile_layout}
              onChange={(e) => handleFieldChange('mobile_layout', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
            >
              <option value="stacked_cards">Stacked Cards</option>
              <option value="stacked_blocks">Stacked Blocks</option>
              <option value="accordion">Accordion</option>
            </select>
          </div>
        </div>
      </CollapsibleSection>

      {/* Typography & Style */}
      <CollapsibleSection title="Typography & Style Variant" icon={Type} section="typography">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="style_variant" className="block text-sm font-bold text-slate-700 mb-2">
              Style Variant
            </label>
            <select
              id="style_variant"
              value={formState.style_variant}
              onChange={(e) => handleFieldChange('style_variant', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
            >
              <option value="standard">Standard</option>
              <option value="featured">Featured</option>
              <option value="outlined">Outlined</option>
              <option value="high_emphasis">High Emphasis</option>
            </select>
          </div>

          <div>
            <label htmlFor="density" className="block text-sm font-bold text-slate-700 mb-2">
              Density
            </label>
            <select
              id="density"
              value={formState.density}
              onChange={(e) => handleFieldChange('density', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>

          <div>
            <label htmlFor="typography_scale" className="block text-sm font-bold text-slate-700 mb-2">
              Typography Scale
            </label>
            <select
              id="typography_scale"
              value={formState.typography_scale}
              onChange={(e) => handleFieldChange('typography_scale', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
            >
              <option value="small">Small</option>
              <option value="standard">Standard</option>
              <option value="large">Large</option>
              <option value="hero">Hero</option>
              <option value="code">Code</option>
            </select>
          </div>

          <div>
            <label htmlFor="animation_type" className="block text-sm font-bold text-slate-700 mb-2">
              Animation Type
            </label>
            <select
              id="animation_type"
              value={formState.animation_type}
              onChange={(e) => handleFieldChange('animation_type', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
            >
              <option value="none">None</option>
              <option value="fade_in">Fade In</option>
              <option value="slide_up">Slide Up</option>
              <option value="expand">Expand</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        </div>
      </CollapsibleSection>

      {/* Child Components */}
      {formState.ui_subcomponents.length > 0 && (
        <CollapsibleSection title="Child Layout Subcomponents" icon={Layers} section="childComponents">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-600 mb-4">
              Configure individual child elements within this component
            </p>
            {formState.ui_subcomponents.map((subcomp: UISubcomponent, index: number) => (
              <div key={subcomp.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900">{subcomp.label}</h4>
                    {subcomp.role && (
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">{subcomp.role}</p>
                    )}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subcomp.visible}
                      onChange={(e) => handleSubcomponentChange(index, 'visible', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-700">Visible</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {subcomp.spacing !== undefined && (
                    <div>
                      <label htmlFor={`spacing-${index}`} className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Spacing</label>
                      <select
                        id={`spacing-${index}`}
                        value={subcomp.spacing}
                        onChange={(e) => handleSubcomponentChange(index, 'spacing', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-100 bg-white"
                      >
                        <option value="tight">Tight</option>
                        <option value="normal">Normal</option>
                        <option value="loose">Loose</option>
                      </select>
                    </div>
                  )}

                  {subcomp.radius !== undefined && (
                    <div>
                      <label htmlFor={`radius-${index}`} className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Radius</label>
                      <select
                        id={`radius-${index}`}
                        value={subcomp.radius}
                        onChange={(e) => handleSubcomponentChange(index, 'radius', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-100 bg-white"
                      >
                        <option value="none">None</option>
                        <option value="small">Small</option>
                        <option value="rounded">Rounded</option>
                        <option value="pill">Pill</option>
                        <option value="full">Full</option>
                      </select>
                    </div>
                  )}

                  {subcomp.shadow !== undefined && (
                    <div>
                      <label htmlFor={`shadow-${index}`} className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Shadow</label>
                      <select
                        id={`shadow-${index}`}
                        value={subcomp.shadow}
                        onChange={(e) => handleSubcomponentChange(index, 'shadow', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-100 bg-white"
                      >
                        <option value="none">None</option>
                        <option value="soft">Soft</option>
                        <option value="medium">Medium</option>
                        <option value="strong">Strong</option>
                      </select>
                    </div>
                  )}

                  {subcomp.color !== undefined && (
                    <div>
                      <label htmlFor={`color-${index}`} className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Color</label>
                      <input
                        id={`color-${index}`}
                        type="color"
                        value={subcomp.color}
                        onChange={(e) => handleSubcomponentChange(index, 'color', e.target.value)}
                        className="w-full h-8 rounded-lg border border-slate-200 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Preview Button */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-purple-900 flex items-center gap-2">
              <Sparkles size={16} />
              Live Preview
            </h4>
            <p className="text-xs font-semibold text-purple-700 mt-1">
              See how your visual styling changes affect the component
            </p>
          </div>
          <button
            type="button"
            className="bg-purple-600 text-white rounded-xl px-5 py-2.5 text-sm font-black hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Eye size={16} />
            Preview Component
          </button>
        </div>
      </div>
    </div>
  );
}
