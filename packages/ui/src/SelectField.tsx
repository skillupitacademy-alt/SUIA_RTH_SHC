import React from 'react';

export interface SelectOption {
  id: string;
  name: string;
}

export interface SelectFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  options: SelectOption[];
  loading?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onCreate?: () => void;
  hideCreate?: boolean;
  active?: boolean;
}

export function SelectField({ label, value, onChange, options, loading, placeholder, icon, disabled }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
        {icon}
        {label}
      </label>
      <select
        className="border rounded-md px-3 py-2 text-sm"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || disabled}
      >
        <option value="">{placeholder ?? 'Select'}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}
