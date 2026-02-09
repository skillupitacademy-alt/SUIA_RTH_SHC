'use client';

interface TrendsRangeSelectorProps {
    value: string;
    onChange: (range: string) => void;
}

export function TrendsRangeSelector({ value, onChange }: TrendsRangeSelectorProps) {
    const ranges = [
        { label: '30 Days', value: '30d' },
        { label: '90 Days', value: '90d' },
        { label: '180 Days', value: '180d' }
    ];

    return (
        <div className="flex gap-2">
            {ranges.map((range) => (
                <button
                    key={range.value}
                    onClick={() => onChange(range.value)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${value === range.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                        }`}
                >
                    {range.label}
                </button>
            ))}
        </div>
    );
}
