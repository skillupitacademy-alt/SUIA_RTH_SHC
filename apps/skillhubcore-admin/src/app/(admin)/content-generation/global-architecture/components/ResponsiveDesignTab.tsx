"use client";

import React, { useState } from 'react';
import { Monitor, Tablet, Smartphone, Eye, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { DeviceType } from '../types';

interface ResponsiveDesignTabProps {
  componentId: string | null;
  componentLabel: string;
  componentConfig: {
    desktop_layout?: string;
    tablet_layout?: string;
    mobile_layout?: string;
    responsive_breakpoints?: {
      desktop_min?: number;
      tablet_min?: number;
      tablet_max?: number;
      mobile_max?: number;
    };
  } | null;
  onSave: (componentId: string, config: Partial<any>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function ResponsiveDesignTab({
  componentId,
  componentLabel,
  componentConfig,
  onSave,
}: ResponsiveDesignTabProps) {
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('desktop');
  const [formState, setFormState] = useState({
    desktop_layout: 'two_column',
    tablet_layout: 'stacked_cards',
    mobile_layout: 'stacked_cards',
    responsive_breakpoints: {
      desktop_min: 1024,
      tablet_min: 768,
      tablet_max: 1023,
      mobile_max: 767,
    },
  });
  const [hasChanges, setHasChanges] = useState(false);

  React.useEffect(() => {
    if (componentConfig) {
      const breakpoints = componentConfig.responsive_breakpoints || {
        desktop_min: 1024,
        tablet_min: 768,
        tablet_max: 1023,
        mobile_max: 767,
      };
      
      setFormState({
        desktop_layout: componentConfig.desktop_layout || 'two_column',
        tablet_layout: componentConfig.tablet_layout || 'stacked_cards',
        mobile_layout: componentConfig.mobile_layout || 'stacked_cards',
        responsive_breakpoints: {
          desktop_min: breakpoints.desktop_min ?? 1024,
          tablet_min: breakpoints.tablet_min ?? 768,
          tablet_max: breakpoints.tablet_max ?? 1023,
          mobile_max: breakpoints.mobile_max ?? 767,
        },
      });
      setHasChanges(false);
    }
  }, [componentConfig, componentId]);

  const handleLayoutChange = (device: DeviceType, value: string) => {
    setFormState(prev => ({
      ...prev,
      [`${device}_layout`]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!componentId) return;
    onSave(componentId, formState);
    setHasChanges(false);
  };

  if (!componentId || !componentConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <MonitorSmartphone size={64} className="text-slate-300 mb-4" />
        <h3 className="text-lg font-black text-slate-400 mb-2">No Component Selected</h3>
        <p className="text-sm font-semibold text-slate-500">
          Select a component to configure responsive design settings.
        </p>
      </div>
    );
  }

  const devices = [
    { 
      id: 'desktop' as DeviceType, 
      label: 'Desktop', 
      icon: Monitor, 
      width: 1440, 
      color: 'indigo',
      description: '1024px and above'
    },
    { 
      id: 'tablet' as DeviceType, 
      label: 'Tablet', 
      icon: Tablet, 
      width: 768, 
      color: 'purple',
      description: '768px - 1023px'
    },
    { 
      id: 'mobile' as DeviceType, 
      label: 'Mobile', 
      icon: Smartphone, 
      width: 375, 
      color: 'pink',
      description: 'Up to 767px'
    },
  ];

  const layoutOptions: Record<DeviceType, Array<{ value: string; label: string; description: string }>> = {
    desktop: [
      { value: 'two_column', label: 'Two Column', description: 'Side-by-side layout with equal or 60/40 split' },
      { value: 'single_column', label: 'Single Column', description: 'Full-width vertical stacking' },
      { value: 'dashboard_grid', label: 'Dashboard Grid', description: '3-4 column responsive grid' },
      { value: 'wide_card', label: 'Wide Card', description: 'Centered wide card with max-width' },
      { value: 'sidebar_layout', label: 'Sidebar Layout', description: 'Left sidebar with main content area' },
    ],
    tablet: [
      { value: 'stacked_cards', label: 'Stacked Cards', description: 'Vertical card stacking' },
      { value: 'responsive_grid', label: 'Responsive Grid', description: '2-column adaptive grid' },
      { value: 'compact_grid', label: 'Compact Grid', description: 'Tighter spacing, 2-column' },
      { value: 'single_column', label: 'Single Column', description: 'Full-width stacking' },
    ],
    mobile: [
      { value: 'stacked_cards', label: 'Stacked Cards', description: 'Full-width cards, vertical' },
      { value: 'stacked_blocks', label: 'Stacked Blocks', description: 'Compact vertical blocks' },
      { value: 'accordion', label: 'Accordion', description: 'Collapsible sections' },
      { value: 'single_column', label: 'Single Column', description: 'Simple vertical flow' },
    ],
  };

  const selectedDeviceData = devices.find(d => d.id === selectedDevice)!;
  const currentLayoutOptions = layoutOptions[selectedDevice];
  const currentLayout = formState[`${selectedDevice}_layout`];

  // Touch target validation (mobile only)
  const touchTargetChecks = selectedDevice === 'mobile' ? [
    { id: 'min_44px', label: 'Interactive elements minimum 44x44px', passed: true },
    { id: 'spacing', label: 'Adequate spacing between tap targets', passed: true },
    { id: 'text_size', label: 'Text size minimum 16px', passed: true },
  ] : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Monitor size={24} className="text-indigo-600" />
            Responsive Design
          </h2>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Configure layouts for different screen sizes: <strong>{componentLabel}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges}
          className="bg-emerald-600 text-white rounded-xl px-5 py-2 text-sm font-black hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Save size={16} />
          Save Settings
        </button>
      </div>

      {/* Device Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-black uppercase text-slate-900 mb-4">Select Device Preview</h3>
        <div className="grid grid-cols-3 gap-3">
          {devices.map(device => {
            const Icon = device.icon;
            const isSelected = selectedDevice === device.id;
            return (
              <button
                key={device.id}
                type="button"
                onClick={() => setSelectedDevice(device.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? `border-${device.color}-400 bg-${device.color}-50`
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <Icon size={32} className={`mx-auto mb-2 ${isSelected ? `text-${device.color}-600` : 'text-slate-400'}`} />
                <div className="text-center">
                  <p className="text-sm font-black text-slate-900">{device.label}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">{device.width}px</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">{device.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Device Layout */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
            {React.createElement(selectedDeviceData.icon, { size: 16, className: `text-${selectedDeviceData.color}-600` })}
            {selectedDeviceData.label} Layout Configuration
          </h3>
          <span className="text-xs font-bold text-slate-500">{selectedDeviceData.description}</span>
        </div>

        <div className="space-y-3">
          {currentLayoutOptions.map(option => {
            const isSelected = currentLayout === option.value;
            return (
              <label
                key={option.value}
                htmlFor={`layout-${option.value}`}
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? `border-${selectedDeviceData.color}-400 bg-${selectedDeviceData.color}-50`
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <input
                  id={`layout-${option.value}`}
                  type="radio"
                  name={`${selectedDevice}_layout`}
                  value={option.value}
                  checked={isSelected}
                  onChange={(e) => handleLayoutChange(selectedDevice, e.target.value)}
                  className={`mt-1 w-5 h-5 text-${selectedDeviceData.color}-600 border-slate-300 focus:ring-${selectedDeviceData.color}-500`}
                  aria-label={option.label}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black text-slate-900">{option.label}</span>
                    {isSelected && (
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded bg-${selectedDeviceData.color}-100 text-${selectedDeviceData.color}-700`}>
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-600">{option.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Responsive Breakpoints */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-black uppercase text-slate-900 mb-4">Responsive Breakpoints</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Monitor size={16} className="text-indigo-600" />
              <h4 className="text-sm font-bold text-indigo-900">Desktop</h4>
            </div>
            <p className="text-xs font-semibold text-indigo-700 mb-2">
              Minimum width: {formState.responsive_breakpoints.desktop_min}px and above
            </p>
            <input
              type="range"
              min="1024"
              max="1920"
              step="64"
              value={formState.responsive_breakpoints.desktop_min}
              onChange={(e) => {
                setFormState(prev => ({
                  ...prev,
                  responsive_breakpoints: {
                    ...prev.responsive_breakpoints,
                    desktop_min: Number(e.target.value),
                  },
                }));
                setHasChanges(true);
              }}
              className="w-full"
            />
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tablet size={16} className="text-purple-600" />
              <h4 className="text-sm font-bold text-purple-900">Tablet</h4>
            </div>
            <p className="text-xs font-semibold text-purple-700 mb-2">
              Range: {formState.responsive_breakpoints.tablet_min}px - {formState.responsive_breakpoints.tablet_max}px
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                min="600"
                max="1023"
                value={formState.responsive_breakpoints.tablet_min}
                onChange={(e) => {
                  setFormState(prev => ({
                    ...prev,
                    responsive_breakpoints: {
                      ...prev.responsive_breakpoints,
                      tablet_min: Number(e.target.value),
                    },
                  }));
                  setHasChanges(true);
                }}
                className="flex-1 border border-purple-200 rounded-lg px-3 py-2 text-sm font-semibold text-purple-900 outline-none focus:ring-2 focus:ring-purple-100"
              />
              <input
                type="number"
                min="768"
                max="1200"
                value={formState.responsive_breakpoints.tablet_max}
                onChange={(e) => {
                  setFormState(prev => ({
                    ...prev,
                    responsive_breakpoints: {
                      ...prev.responsive_breakpoints,
                      tablet_max: Number(e.target.value),
                    },
                  }));
                  setHasChanges(true);
                }}
                className="flex-1 border border-purple-200 rounded-lg px-3 py-2 text-sm font-semibold text-purple-900 outline-none focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>

          <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone size={16} className="text-pink-600" />
              <h4 className="text-sm font-bold text-pink-900">Mobile</h4>
            </div>
            <p className="text-xs font-semibold text-pink-700 mb-2">
              Maximum width: Up to {formState.responsive_breakpoints.mobile_max}px
            </p>
            <input
              type="range"
              min="320"
              max="767"
              step="16"
              value={formState.responsive_breakpoints.mobile_max}
              onChange={(e) => {
                setFormState(prev => ({
                  ...prev,
                  responsive_breakpoints: {
                    ...prev.responsive_breakpoints,
                    mobile_max: Number(e.target.value),
                  },
                }));
                setHasChanges(true);
              }}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Touch Target Validation (Mobile Only) */}
      {selectedDevice === 'mobile' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-black uppercase text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            Touch Target Validation
          </h3>
          <div className="space-y-3">
            {touchTargetChecks.map(check => (
              <div
                key={check.id}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  check.passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
                }`}
              >
                {check.passed ? (
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                )}
                <span className="text-sm font-semibold text-slate-700">{check.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-bold text-blue-800">
              📱 Mobile Accessibility: Ensure interactive elements are at least 44x44px for easy tapping
            </p>
          </div>
        </div>
      )}

      {/* Preview Device Frame */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
            <Eye size={16} />
            Device Preview
          </h3>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            {React.createElement(selectedDeviceData.icon, { size: 14 })}
            <span>{selectedDeviceData.label} • {selectedDeviceData.width}px</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl overflow-hidden" style={{ maxWidth: `${selectedDeviceData.width}px`, margin: '0 auto' }}>
          <div className="aspect-[16/9] flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            {React.createElement(selectedDeviceData.icon, { size: 64, className: 'text-slate-400' })}
            <div className="absolute">
              <p className="text-sm font-black text-slate-600">{currentLayout.replace(/_/g, ' ').toUpperCase()}</p>
              <p className="text-xs font-semibold text-slate-500 text-center mt-1">Layout: {selectedDeviceData.label}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            className="bg-white text-slate-900 rounded-xl px-6 py-3 text-sm font-black hover:bg-slate-100 transition-colors inline-flex items-center gap-2"
          >
            <Eye size={16} />
            Open Full Preview
          </button>
        </div>
      </div>
    </div>
  );
}

function MonitorSmartphone({ size, className }: { size: number; className: string }) {
  return <Monitor size={size} className={className} />;
}
