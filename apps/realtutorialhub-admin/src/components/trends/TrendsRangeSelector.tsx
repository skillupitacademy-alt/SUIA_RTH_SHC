'use client';

interface TrendsRangeSelectorProps {
    value: string;
    onChange: (range: string) => void;
}

export function TrendsRangeSelector({ value, onChange }: TrendsRangeSelectorProps) {
    const ranges = [
        { label: '7 Days', value: '7d' },
        { label: '14 Days', value: '14d' },
        { label: '28 Days', value: '28d' },
        { label: '90 Days', value: '90d' }
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
