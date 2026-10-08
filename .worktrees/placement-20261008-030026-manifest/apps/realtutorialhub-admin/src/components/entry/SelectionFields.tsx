'use client';

import { SelectField as SharedSelectField, SelectFieldProps as SharedSelectFieldProps, ZLoader } from '@quiz/ui';

import { cn } from '@/lib/utils';

export type SelectFieldProps = SharedSelectFieldProps;

export function SelectField(props: SelectFieldProps) {
    return <SharedSelectField {...props} />;
}

export interface MultiSelectFieldProps {
    label: string;
    values: string[];
    options: Array<{ id: string; name: string; category?: string; weight?: number; mappingType?: string }>;
    loading: boolean;
    onChange: (ids: string[]) => void;
    placeholder: string;
    active?: boolean;
    icon?: React.ReactNode;
    disabled?: boolean;
}

export function MultiSelectField({ label, values, options, loading, onChange, placeholder, active, icon, disabled }: MultiSelectFieldProps) {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        onChange(selectedOptions);
    };

    return (
        <div className={cn("flex flex-col gap-2 transition-opacity duration-300", disabled === true && "opacity-50 grayscale")}>
            <label className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em] transition-colors flex items-center gap-2",
                active === true ? "text-[#FF4B91]" : "text-slate-500"
            )}>
                {icon ?? null}
                {label} (Multi)
            </label>
            <div className="relative flex-1">
                <select
                    multiple
                    value={values}
                    onChange={handleChange}
                    disabled={disabled}
                    className={cn(
                        "w-full h-44 p-3 bg-white/70 border rounded-2xl text-[#1A1A1A] font-bold text-[13px] focus:outline-none transition-all cursor-pointer backdrop-blur-md shadow-sm scrollbar-thin scrollbar-thumb-[#FF4B91]/20",
                        "hover:bg-white",
                        active === true
                            ? "border-[#FF4B91]/40 focus:border-[#FF4B91] focus:ring-4 focus:ring-[#FF4B91]/5 shadow-[#FF4B91]/10"
                            : "border-slate-300"
                    )}
                >
                    {loading === true ? <option disabled className="p-2 opacity-50" /> : null}
                    {loading === false && options.length === 0 && <option disabled className="p-2 opacity-50">No skills available for this topic</option>}

                    {/* Grouped Options Logic */}
                    {loading === false && options.length > 0 && (() => {
                        // Check if options have category to determine if grouping is needed
                        const hasCategories = options.some(opt => (opt.category != null && opt.category !== ''));

                        if (hasCategories === false) {
                            return options.map((opt) => (
                                <option
                                    key={opt.id as string}
                                    value={opt.id as string}
                                    className="bg-white text-slate-800 font-bold py-2 px-3 rounded-lg mb-1 last:mb-0 hover:bg-[#FF4B91]/5 checked:bg-[#FF4B91] checked:text-white"
                                >
                                    {opt.name as string} {opt.weight != null && opt.weight !== 0 ? `[W: ${opt.weight as number}]` : ''}
                                </option>
                            ));
                        }

                        // Group by Category
                        // Use Record<string, typeof options> for proper typing
                        const grouped = options.reduce((acc: Record<string, typeof options>, opt) => {
                            const cat = ((opt.category as string | undefined) ?? 'Uncategorized').toUpperCase();
                            if (acc[cat] == null) acc[cat] = [];
                            acc[cat].push(opt);
                            return acc;
                        }, {});

                        return Object.entries(grouped).map(([category, items]) => (
                            <optgroup key={category} label={category} className="font-black text-slate-400 uppercase tracking-widest text-[10px] my-2">
                                {items.map((opt) => (
                                    <option
                                        key={opt.id as string}
                                        value={opt.id as string}
                                        className="bg-white text-slate-800 font-bold py-2 px-3 rounded-lg mb-1 last:mb-0 hover:bg-[#FF4B91]/5 checked:bg-[#FF4B91] checked:text-white normal-case text-sm"
                                    >
                                        {opt.name as string} {opt.mappingType != null && opt.mappingType !== '' ? `[${(opt.mappingType as string).toUpperCase()}]` : ''} {opt.weight != null && opt.weight !== 0 ? `[W: ${opt.weight as number}]` : ''}
                                    </option>
                                ))}
                            </optgroup>
                        ));
                    })()}
                </select>
                {loading === true ? <div className="absolute top-2 right-2 pointer-events-none">
                    <ZLoader size="xs" center={false} />
                </div> : null}
                {values.length === 0 && loading === false && options.length > 0 && (
                    <div className="absolute top-4 left-4 pointer-events-none text-slate-400 text-[10px] font-black uppercase tracking-widest opacity-40">
                        {placeholder}
                    </div>
                )}
            </div>
            <p className="text-[11px] text-slate-500 font-bold tracking-tight opacity-90">
                Hold Ctrl/Cmd to select multiple mappings.
            </p>
        </div>
    );
}
