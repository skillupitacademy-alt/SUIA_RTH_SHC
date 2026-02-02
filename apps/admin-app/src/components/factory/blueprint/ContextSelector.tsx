'use client';

import React from 'react';
import { useDomains, useSubjects, useTopics } from '@/hooks/useAdminHierarchy'; // Assuming these hooks exist or similar structure
import { SelectField } from '@/components/ui/fields/SelectField';
import { Loader2 } from 'lucide-react';

interface ContextSelectorProps {
    selections: {
        domainId: string;
        subjectId: string;
        topicId: string;
    };
    onChange: (field: 'domainId' | 'subjectId' | 'topicId', value: string) => void;
}

export function ContextSelector({ selections, onChange }: ContextSelectorProps) {
    const domainsHook = useDomains();
    const subjectsHook = useSubjects(selections.domainId || undefined);
    const topicsHook = useTopics(selections.subjectId || undefined);

    return (
        <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                1. Target Context
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SelectField
                    label="Target Domain"
                    value={selections.domainId}
                    onChange={(e) => onChange('domainId', e.target.value)}
                    options={domainsHook.data?.map(d => ({ value: d.id, label: d.name })) || []}
                    isLoading={domainsHook.loading}
                    placeholder="Select Domain..."
                    required
                />

                <SelectField
                    label="Target Subject"
                    value={selections.subjectId}
                    onChange={(e) => onChange('subjectId', e.target.value)}
                    options={subjectsHook.data?.map(s => ({ value: s.id, label: s.name })) || []}
                    isLoading={subjectsHook.loading}
                    disabled={!selections.domainId}
                    placeholder={!selections.domainId ? "Select Domain First..." : "Select Subject..."}
                    required
                />

                <SelectField
                    label="Target Topic"
                    value={selections.topicId}
                    onChange={(e) => onChange('topicId', e.target.value)}
                    options={topicsHook.data?.map(t => ({ value: t.id, label: t.name })) || []}
                    isLoading={topicsHook.loading}
                    disabled={!selections.subjectId}
                    placeholder={!selections.subjectId ? "Select Subject First..." : "Select Topic..."}
                    required
                />
            </div>

            {/* Validation Feedback */}
            {(!selections.topicId) && (
                <div className="flex items-center gap-2 text-amber-500 text-[10px] font-bold bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Please select a specific Topic to begin the Blueprint.
                </div>
            )}
        </div>
    );
}
