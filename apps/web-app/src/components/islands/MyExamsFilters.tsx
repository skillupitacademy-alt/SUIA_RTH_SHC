'use client';

import { Filter, List, TrendingUp, BarChart2, Clock, Layers, BookOpen as BookIcon, Hash } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { SelectField } from '@quiz/ui';
import { recordCounter } from "@quiz/observability";

type FilterOption = { id: string; name: string };

interface MyExamsFiltersProps {
    domains: FilterOption[];
    subjects: FilterOption[];
    topics: FilterOption[];
    currentFilters: {
        range: string;
        domain: string;
        subject: string;
        topic: string;
        view: string;
    };
}

export function MyExamsFilters({ domains, subjects, topics, currentFilters }: MyExamsFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        // Always reset page on filter change
        if (key !== 'page') {
            params.delete('page');
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleRangeChange = (newRange: string) => {
        if (newRange === '90d') return; // Strict constraint
        recordCounter('web.ui.my_exams.range_change', 1, { range: newRange });
        updateFilter('range', newRange);
    };

    return (
        <div className="flex flex-col gap-6 p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                        <Filter size={18} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Filter Console</span>
                </div>
                <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    <button
                        onClick={() => updateFilter('view', 'table')}
                        className={cn("px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                            currentFilters.view === 'table' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-slate-400 hover:text-slate-600")}
                    >
                        <List size={14} />
                        List
                    </button>
                    <button
                        onClick={() => updateFilter('view', 'trends')}
                        className={cn("px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                            currentFilters.view === 'trends' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-slate-400 hover:text-slate-600")}
                    >
                        <TrendingUp size={14} />
                        Trends
                    </button>
                    <button
                        onClick={() => updateFilter('view', 'breakdowns')}
                        className={cn("px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                            currentFilters.view === 'breakdowns' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-slate-400 hover:text-slate-600")}
                    >
                        <BarChart2 size={14} />
                        Stats
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <SelectField
                    label="Time Range"
                    value={currentFilters.range}
                    options={[
                        { id: '7d', name: '7 Days' },
                        { id: '14d', name: '14 Days' },
                        { id: '28d', name: '28 Days' },
                        { id: '90d', name: '90 Days' }
                    ]}
                    onChange={handleRangeChange}
                    placeholder="Select Range"
                    icon={<Clock className="w-3.5 h-3.5 text-rose-500" />}
                />
                <SelectField
                    label="Domain"
                    value={currentFilters.domain === 'all' ? null : currentFilters.domain}
                    options={[{ id: 'all', name: 'All' }, ...domains]}
                    onChange={(id: string) => updateFilter('domain', id || 'all')}
                    placeholder="All Domains"
                    icon={<Layers className="w-3.5 h-3.5 text-rose-500" />}
                />
                <SelectField
                    label="Subject"
                    value={currentFilters.subject === 'all' ? null : currentFilters.subject}
                    options={[{ id: 'all', name: 'All' }, ...subjects]}
                    onChange={(id: string) => updateFilter('subject', id || 'all')}
                    placeholder="All Subjects"
                    icon={<BookIcon className="w-3.5 h-3.5 text-rose-500" />}
                />
                <SelectField
                    label="Topic"
                    value={currentFilters.topic === 'all' ? null : currentFilters.topic}
                    options={[{ id: 'all', name: 'All' }, ...topics]}
                    onChange={(id: string) => updateFilter('topic', id || 'all')}
                    placeholder="All Topics"
                    icon={<Hash className="w-3.5 h-3.5 text-rose-500" />}
                />
            </div>
        </div>
    );
}
