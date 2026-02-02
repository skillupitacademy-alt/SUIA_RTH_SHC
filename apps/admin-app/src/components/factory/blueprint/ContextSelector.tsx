'use client';

import React from 'react';
import { useDomains, useSubjects, useTopics, useSubtopics } from '@/hooks/useAdminHierarchy';
import { SelectField } from '@/components/entry/SelectionFields';
import { Layers, Box, Bookmark, Target, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextSelectorProps {
    selections: {
        domainId: string;
        subjectId: string;
        topicId: string;
        subtopicId: string;
    };
    onChange: (field: 'domainId' | 'subjectId' | 'topicId' | 'subtopicId', value: string) => void;
}

export function ContextSelector({ selections, onChange }: ContextSelectorProps) {
    const domainsHook = useDomains();
    const subjectsHook = useSubjects(selections.domainId || undefined);
    const topicsHook = useTopics(selections.subjectId || undefined);
    const subtopicsHook = useSubtopics(selections.topicId || undefined);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-6 w-1 bg-[#FF4B91] rounded-full" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
                    1. Target Context (Surgical Scope)
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <SelectField
                    label="Target Domain"
                    value={selections.domainId}
                    onChange={(id) => onChange('domainId', id)}
                    options={domainsHook.data || []}
                    loading={domainsHook.loading}
                    placeholder="Select Domain"
                    active={true}
                    icon={<Layers className="w-3 h-3" />}
                    hideCreate={true}
                />

                <SelectField
                    label="Target Subject"
                    value={selections.subjectId}
                    onChange={(id) => onChange('subjectId', id)}
                    options={subjectsHook.data || []}
                    loading={subjectsHook.loading}
                    disabled={!selections.domainId}
                    placeholder="Select Subject"
                    active={!!selections.domainId}
                    icon={<Box className="w-3 h-3" />}
                    hideCreate={true}
                />

                <SelectField
                    label="Target Sub-Topic"
                    value={selections.subtopicId}
                    onChange={(id) => onChange('subtopicId', id)}
                    options={subtopicsHook.data || []}
                    loading={subtopicsHook.loading}
                    disabled={!selections.topicId}
                    placeholder="Select Sub-Topic"
                    active={!!selections.topicId}
                    icon={<Target className="w-3 h-3" />}
                    hideCreate={true}
                />
            </div>

            {/* Validation Feedback */}
            {(!selections.topicId) && (
                <div className="flex items-center gap-3 text-amber-600 text-[10px] font-black uppercase tracking-widest bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 animate-pulse">
                    <AlertCircle className="w-4 h-4" />
                    Identification Required: Select Domain {'>'} Subject {'>'} Topic to calibrate generator.
                </div>
            )}
        </div>
    );
}
